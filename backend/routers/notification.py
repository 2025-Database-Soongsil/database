# notification_router.py (storage/in-memory version)

from __future__ import annotations
from datetime import datetime
from typing import List
from fastapi import APIRouter

import storage
from models import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/due", response_model=List[NotificationOut])
def get_due_notifications():
    now = datetime.utcnow()
    notis = storage.get_notifications_due(now)

    result = []
    for n in notis:
        # CalendarEvent 조회 (in-memory 리스트에서 찾아옴)
        ev = next(ev for ev in storage._calendar_events if ev["id"] == n["event_id"])
        result.append(
            NotificationOut(
                id=n["id"],
                event_id=n["event_id"],
                notify_time=n["notify_time"],
                is_sent=n["is_sent"],
                title=ev["title"],
                user_id=ev["user_id"],
            )
        )
    return result


@router.post("/{notification_id}/mark-sent")
def mark_notification_sent(notification_id: int):
    storage.mark_notification_sent(notification_id)
    return {"ok": True}
