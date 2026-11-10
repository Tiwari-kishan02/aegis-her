from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PhoneRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str = Field(min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str


class ContactResponse(BaseModel):
    id: int
    name: str
    phone: str


class AlertCreate(BaseModel):
    id: str | None = None
    type: str
    category: str
    lat: float
    lng: float
    accuracy: float
    details: dict[str, Any] | None = None


class AlertResponse(BaseModel):
    id: str
    type: str
    category: str
    lat: float
    lng: float
    accuracy: float
    status: str
    details: str | None = None
    created_at: datetime
