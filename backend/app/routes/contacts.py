from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, Contact, User
from ..routes.auth import JWT_ALGORITHM, JWT_SECRET, normalize_phone
from ..schemas import ContactCreate, ContactResponse

router = APIRouter(prefix="/contacts", tags=["contacts"])
me_router = APIRouter(tags=["me"])


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Invalid access token") from error
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("", response_model=list[ContactResponse])
def list_contacts(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Contact).filter(Contact.user_id == user.id).all()


@router.post("", response_model=ContactResponse, status_code=201)
def add_contact(payload: ContactCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    count = db.query(Contact).filter(Contact.user_id == user.id).count()
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 trusted contacts allowed")
    phone = normalize_phone(payload.phone)
    contact = Contact(user_id=user.id, name=payload.name.strip(), phone=phone)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@me_router.delete("/me", status_code=204)
def delete_my_data(db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.query(Contact).filter(Contact.user_id == user.id).delete()
    db.query(Alert).filter(Alert.user_id == user.id).delete()
    db.delete(user)
    db.commit()


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
