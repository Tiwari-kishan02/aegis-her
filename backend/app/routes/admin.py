import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, User
from ..routes.contacts import current_user
from ..schemas import AlertStatusUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


def is_admin_phone(phone: str) -> bool:
    admin_phones = {item.strip() for item in os.getenv("ADMIN_PHONES", "").split(",") if item.strip()}
    return phone in admin_phones


@router.get("/alerts")
def get_admin_alerts(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    alert_type: str | None = Query(default=None, alias="type"),
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
):
    if not is_admin_phone(user.phone):
        raise HTTPException(status_code=403, detail="Admin access required")

    query = db.query(Alert)
    if alert_type:
        query = query.filter(Alert.type == alert_type)
    if status:
        query = query.filter(Alert.status == status)
    if start_date:
        query = query.filter(Alert.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Alert.created_at <= datetime.fromisoformat(end_date))

    return query.order_by(Alert.created_at.desc()).all()


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not is_admin_phone(user.phone):
        raise HTTPException(status_code=403, detail="Admin access required")

    total_alerts = db.query(func.count(Alert.id)).scalar() or 0
    by_type = {
        row.type: row.count for row in db.query(Alert.type, func.count(Alert.id).label("count")).group_by(Alert.type).all()
    }
    by_day = {
        row.day: row.count
        for row in db.query(func.date(Alert.created_at).label("day"), func.count(Alert.id).label("count")).group_by(func.date(Alert.created_at)).all()
    }

    return {
        "total_alerts": total_alerts,
        "by_type": by_type,
        "by_day": by_day,
    }


@router.patch("/alerts/{alert_id}")
def update_alert_status(
    alert_id: str,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    if not is_admin_phone(user.phone):
        raise HTTPException(status_code=403, detail="Admin access required")

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    allowed_statuses = {"new", "acknowledged", "resolved"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=422, detail="Invalid status")

    alert.status = payload.status
    db.commit()
    db.refresh(alert)
    return alert
