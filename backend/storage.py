# storage.py (DB version)

from __future__ import annotations
from datetime import datetime, date, timedelta, time
from typing import List, Optional, Dict

from sqlalchemy.orm import Session

from database import SessionLocal
import db_models as orm


# ---------------- 공통 날짜 헬퍼 ----------------

def one_day() -> timedelta:
    return timedelta(days=1)


def step_cycle(cycle: str) -> timedelta:
    if cycle == "daily":
        return timedelta(days=1)
    if cycle == "weekly":
        return timedelta(weeks=1)
    if cycle == "monthly":
        # 단순 버전 (DB ENUM 구조와 맞춤)
        return timedelta(days=30)
    return timedelta(days=0)


def cycle_days(days: int) -> timedelta:
    return timedelta(days=days)


# ---------------- 임신 / 생리 계산 함수 ----------------

def calculate_pregnancy_stage(target: date, start: date, due: date) -> str:
    week = ((target - start).days // 7) + 1
    return f"{week}주차"


def calculate_period_phase(target: date, last_start: date) -> str:
    diff = (target - last_start).days % 28
    if diff < 5:
        return "menstruation"
    elif diff < 14:
        return "follicular"
    elif diff < 21:
        return "ovulation"
    else:
        return "luteal"


# ---------------- DB 세션 헬퍼 ----------------

def get_db() -> Session:
    return SessionLocal()


# ---------------- User / Setting / Info 조회 ----------------

def get_user_from_token(token: str) -> Optional[dict]:
    """
    토큰 형태: 'token-<user_id>'
    -> DB에서 User 조회 후 dict 반환
    """
    if not token.startswith("token-"):
        return None
    try:
        user_id = int(token.replace("token-", ""))
    except ValueError:
        return None

    db = get_db()
    try:
        user = db.get(orm.User, user_id)
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
        }
    finally:
        db.close()

def get_user_from_id(id : int) -> Optional[dict]:
        db = get_db()
        try : 
            user = db.get(orm.User, id)
            if not user : 
                return None
            return {
                "id" : user.id,
                "email" : user.email,
                "nickname" : user.nickname,
            }
        finally :
            db.close()

def get_user_setting(user_id: int) -> Optional[dict]:
    db = get_db()
    try:
        setting = (
            db.query(orm.UserSetting)
            .filter(orm.UserSetting.user_id == user_id)
            .first()
        )
        if not setting:
            return None
        return {
            "user_id": setting.user_id,
            "notification_enabled": setting.notification_enabled,
            "default_notify_time": setting.default_notify_time,
            "language": setting.language,
        }
    finally:
        db.close()


def get_pregnancy_info(user_id: int) -> Optional[dict]:
    db = get_db()
    try:
        p = db.query(orm.PregnancyInfo).filter(
            orm.PregnancyInfo.user_id == user_id
        ).first()
        if not p:
            return None
        return {
            "user_id": p.user_id,
            "pregnancy_start": p.pregnancy_start,
            "due_date": p.due_date,
        }
    finally:
        db.close()


def get_period_info(user_id: int) -> Optional[dict]:
    db = get_db()
    try:
        p = db.query(orm.PeriodInfo).filter(
            orm.PeriodInfo.user_id == user_id
        ).first()
        if not p:
            return None
        return {
            "user_id": p.user_id,
            "last_period": p.last_period,
            "period_start": p.period_start,
        }
    finally:
        db.close()


# ---------------- Supplement / UserSupplement ----------------

def get_user_supplements(user_id: int) -> List[dict]:
    """
    기존 in-memory 버전과 동일한 형태의 dict 리스트 반환:
    {
        "id": ...,
        "user_id": ...,
        "supplement_id": ...,
        "start_date": date,
        "end_date": date | None,
        "cycle": "daily" | ...,
        "time_of_day": time | None
    }
    """
    db = get_db()
    try:
        rows = (
            db.query(orm.UserSupplement)
            .filter(orm.UserSupplement.user_id == user_id)
            .all()
        )
        result: List[dict] = []
        for r in rows:
            result.append(
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "supplement_id": r.supplement_id,
                    "start_date": r.start_date,
                    "end_date": r.end_date,
                    "cycle": r.cycle,
                    "time_of_day": r.time_of_day,
                }
            )
        return result
    finally:
        db.close()


def get_supplements() -> List[dict]:
    """
    Supplement 테이블에서 id, name 정도만 가져옴.
    """
    db = get_db()
    try:
        rows = db.query(orm.Supplement).all()
        return [
            {"id": r.id, "name": r.name, "brand": r.brand}
            for r in rows
        ]
    finally:
        db.close()


# ---------------- CalendarEvent & Notification ----------------

def create_calendar_event_for_supplement_intake(
    user_id: int, user_supplement: dict, intake_date: date
) -> dict:
    """
    intake_date 에 해당하는 복용 이벤트가 이미 있으면 재사용.
    아니면 CalendarEvent 레코드 새로 INSERT.
    """
    db = get_db()
    try:
        t: time = user_supplement.get("time_of_day") or time(9, 0, 0)
        start_dt = datetime.combine(intake_date, t)

        # 이미 같은 이벤트가 있는지 확인
        ev = (
            db.query(orm.CalendarEvent)
            .filter(
                orm.CalendarEvent.user_id == user_id,
                orm.CalendarEvent.type == "supplement",
                orm.CalendarEvent.linked_supplement_id
                == user_supplement["supplement_id"],
                orm.CalendarEvent.start_datetime == start_dt,
            )
            .first()
        )

        if not ev:
            sup = db.get(orm.Supplement, user_supplement["supplement_id"])
            title = f"{sup.name} 복용" if sup else "영양제 복용"

            ev = orm.CalendarEvent(
                user_id=user_id,
                type="supplement",
                title=title,
                start_datetime=start_dt,
                end_datetime=None,
                repeat_cycle="none",
                linked_supplement_id=user_supplement["supplement_id"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(ev)
            db.commit()
            db.refresh(ev)

        return {
            "id": ev.id,
            "user_id": ev.user_id,
            "title": ev.title,
            "start_datetime": ev.start_datetime,
        }
    finally:
        db.close()


def create_notification_for_event_if_needed(event: dict) -> Optional[dict]:
    """
    UserSetting.notification_enabled 가 False 면 생성 안 함.
    이미 동일한 알림이 있으면 재사용.
    """
    db = get_db()
    try:
        setting = (
            db.query(orm.UserSetting)
            .filter(orm.UserSetting.user_id == event["user_id"])
            .first()
        )
        if setting and setting.notification_enabled is False:
            return None

        existing = (
            db.query(orm.Notification)
            .filter(
                orm.Notification.event_id == event["id"],
                orm.Notification.notify_time == event["start_datetime"],
            )
            .first()
        )

        if existing:
            return {
                "id": existing.id,
                "event_id": existing.event_id,
                "notify_time": existing.notify_time,
                "is_sent": existing.is_sent,
            }

        n = orm.Notification(
            event_id=event["id"],
            notify_time=event["start_datetime"],
            is_sent=False,
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        return {
            "id": n.id,
            "event_id": n.event_id,
            "notify_time": n.notify_time,
            "is_sent": n.is_sent,
        }
    finally:
        db.close()


def get_notifications_due(now: datetime) -> List[dict]:
    """
    현재 시간 기준으로 발송해야 하는 Notification 목록
    """
    db = get_db()
    try:
        rows = (
            db.query(orm.Notification)
            .filter(
                orm.Notification.notify_time <= now,
                orm.Notification.is_sent.is_(False),
            )
            .all()
        )
        return [
            {
                "id": r.id,
                "event_id": r.event_id,
                "notify_time": r.notify_time,
                "is_sent": r.is_sent,
            }
            for r in rows
        ]
    finally:
        db.close()


def mark_notification_sent(notification_id: int) -> None:
    db = get_db()
    try:
        n = db.get(orm.Notification, notification_id)
        if not n:
            return
        n.is_sent = True
        db.commit()
    finally:
        db.close()


def get_calendar_event(event_id: int) -> Optional[dict]:
    """
    Notification에서 event 정보를 붙이기 위해 사용.
    """
    db = get_db()
    try:
        ev = db.get(orm.CalendarEvent, event_id)
        if not ev:
            return None
        return {
            "id": ev.id,
            "user_id": ev.user_id,
            "title": ev.title,
            "start_datetime": ev.start_datetime,
        }
    finally:
        db.close()
