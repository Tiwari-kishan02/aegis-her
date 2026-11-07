from datetime import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, Contact, User
from ..routes.contacts import current_user
from ..schemas import AlertCreate, AlertResponse
from ..services.sms import send_sms

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse, status_code=201)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if payload.type not in {"police", "ambulance", "cab"}:
        raise HTTPException(status_code=422, detail="Invalid alert type")

    alert = Alert(
        id=payload.id or str(uuid.uuid4()),
        user_id=user.id,
        type=payload.type,
        category=payload.category,
        lat=payload.lat,
        lng=payload.lng,
        accuracy=payload.accuracy,
        status="saved",
        created_at=datetime.utcnow(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    message = (
        f"Aegis {payload.type} alert: {payload.category}. "
        f"Location: https://maps.google.com/?q={payload.lat},{payload.lng}"
    )
    contacts = db.query(Contact).filter(Contact.user_id == user.id).all()
    for contact in contacts:
        send_sms(contact.phone, message)

    return alert


@router.get("", response_model=list[AlertResponse])
def list_alerts(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Alert).filter(Alert.user_id == user.id).order_by(Alert.created_at.desc()).all()
