import os
import random
from datetime import datetime, timedelta, timezone
from collections import defaultdict, deque

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from jose import jwt

load_dotenv()

from ..schemas import PhoneRequest, TokenResponse, VerifyOtpRequest
from ..database import SessionLocal
from ..models import User

router = APIRouter(prefix="/auth", tags=["auth"])
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-for-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TEST_MODE = os.getenv("TEST_MODE", "true").lower() == "true"

otp_store = {}
otp_requests = defaultdict(deque)


def normalize_phone(phone: str) -> str:
    normalized = phone.strip().replace(" ", "").replace("-", "")
    if normalized.startswith("+91"):
        normalized = normalized[3:]
    elif normalized.startswith("91") and len(normalized) == 12:
        normalized = normalized[2:]
    if not normalized.isdigit() or len(normalized) != 10:
        raise HTTPException(status_code=422, detail="Enter a valid 10-digit Indian phone number")
    return normalized


@router.post("/request-otp")
def request_otp(payload: PhoneRequest):
    phone = normalize_phone(payload.phone)
    now = datetime.now(timezone.utc)
    requests = otp_requests[phone]
    while requests and now - requests[0] > timedelta(minutes=10):
        requests.popleft()
    if len(requests) >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again in 10 minutes.")

    otp = f"{random.randint(100000, 999999)}"
    otp_store[phone] = {"otp": otp, "expires": now + timedelta(minutes=5)}
    requests.append(now)
    if TEST_MODE:
        print(f"[TEST MODE] OTP for {phone}: {otp}")
    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpRequest):
    phone = normalize_phone(payload.phone)
    record = otp_store.get(phone)
    if not record:
        raise HTTPException(status_code=400, detail="Request an OTP first")
    if datetime.now(timezone.utc) > record["expires"]:
        otp_store.pop(phone, None)
        raise HTTPException(status_code=400, detail="OTP has expired")
    if payload.otp != record["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    otp_store.pop(phone, None)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            user = User(phone=phone)
            db.add(user)
            db.commit()
            db.refresh(user)
        token = jwt.encode(
            {"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(days=7)},
            JWT_SECRET,
            algorithm=JWT_ALGORITHM,
        )
        return {"access_token": token, "token_type": "bearer"}
    finally:
        db.close()
