"""Storage layer now backed by Postgres (db.py) for calendar-related data.

User 기본 정보는 캐시를 유지하되, 캘린더/서플리먼트/임신·생리 정보와
캘린더 이벤트·알림은 모두 DB를 조회/저장합니다.
"""

from __future__ import annotations

import random
import time as time_util
from datetime import date, datetime, time, timedelta
from typing import Dict, List, Optional

import db

# ---------------- in-memory user cache (호환용) ----------------

_users: Dict[str, dict] = {}
_supplement_defs: Dict[str, dict] = {}


# ---------------- helpers ----------------

def _generate_id() -> int:
    return int(time_util.time() * 1000) * 1000 + random.randint(0, 999)


def _default_user_record(user_id: str, email: str, password: Optional[str], nickname: Optional[str]) -> dict:
    return {
        "id": user_id,
        "email": email,
        "password": password,
        "nickname": nickname or email.split("@")[0],
        "pregnant": False,
        "dates": {
            "pregnancy_start": None,
            "due_date": None,
            "last_period": None,
            "period_start": None,
        },
        "profile": {},
        "notifications": [],
        "supplements": [],
    }


def _fetch_db_user_by_id(user_id: str | int) -> Optional[dict]:
    try:
        return db.fetch_user_by_id(int(user_id))
    except Exception:
        return None


# ---------------- shared business logic ----------------

def one_day() -> timedelta:
    return timedelta(days=1)


def step_cycle(cycle: str) -> timedelta:
    if cycle == "daily":
        return timedelta(days=1)
    if cycle == "weekly":
        return timedelta(weeks=1)
    if cycle == "monthly":
        return timedelta(days=30)
    return timedelta(days=0)


def cycle_days(days: int) -> timedelta:
    return timedelta(days=days)


def calculate_pregnancy_stage(target: date, start: date, due: date) -> str:
    week = ((target - start).days // 7) + 1
    return f"{week}주차"


def calculate_period_phase(target: date, last_start: date) -> str:
    diff = (target - last_start).days % 28
    if diff < 5:
        return "menstruation"
    if diff < 14:
        return "follicular"
    if diff < 21:
        return "ovulation"
    return "luteal"


# ---------------- user helpers ----------------

def ensure_user_cache(user_record: dict) -> dict:
    user_id = str(user_record["id"])
    cached = _users.get(user_id)
    if not cached:
        cached = _default_user_record(
            user_id=user_id,
            email=user_record.get("email", ""),
            password=user_record.get("password"),
            nickname=user_record.get("nickname"),
        )
        _users[user_id] = cached
    else:
        cached["email"] = user_record.get("email", cached["email"])
        cached["nickname"] = user_record.get("nickname", cached.get("nickname"))
    return cached


def reset_user(user_id: str | int) -> None:
    _users.pop(str(user_id), None)


def get_user(user_id: str | int) -> Optional[dict]:
    cached = _users.get(str(user_id))
    if cached:
        return cached
    db_user = _fetch_db_user_by_id(user_id)
    if db_user:
        return ensure_user_cache(db_user)
    return None


def get_user_from_token(token: str) -> Optional[dict]:
    if not token.startswith("token-"):
        return None
    user_id = token.replace("token-", "")
    return get_user(user_id)


def get_user_from_id(user_id: int) -> Optional[dict]:
    return get_user(user_id)


def get_user_by_email(email: str) -> Optional[dict]:
    for user in _users.values():
        if user["email"] == email:
            return user
    db_user = db.fetch_user_by_email(email)
    if db_user:
        return ensure_user_cache(db_user)
    return None


def create_user(email: str, password: str, nickname: Optional[str], pregnant: bool) -> dict:
    # Keep in-memory behavior (DB schema의 password 컬럼 여부를 알 수 없어 안전하게 캐시에만 저장)
    user_id = str(_generate_id())
    user = _default_user_record(user_id, email, password, nickname)
    user["pregnant"] = pregnant
    _users[user_id] = user
    return user


def set_dates(user_id: str | int, period_start: Optional[str], due_date: Optional[str]) -> None:
    user = get_user(user_id)
    if not user:
        return
    if period_start is not None:
        user["dates"]["period_start"] = datetime.fromisoformat(period_start).date()
        user["dates"]["last_period"] = datetime.fromisoformat(period_start).date()
    if due_date is not None:
        user["dates"]["due_date"] = datetime.fromisoformat(due_date).date()
        if user["dates"]["due_date"] and not user["dates"]["pregnancy_start"]:
            user["dates"]["pregnancy_start"] = user["dates"]["due_date"] - timedelta(days=280)


def update_profile(user_id: str | int, payload: dict) -> None:
    user = get_user(user_id)
    if not user:
        return
    profile = user.setdefault("profile", {})
    profile.update(payload)


def set_notifications(user_id: str | int, notifications: List[str]) -> None:
    user = get_user(user_id)
    if not user:
        return
    user["notifications"] = list(notifications)


# ---------------- data lookups (DB) ----------------

def get_user_setting(user_id: int) -> Optional[dict]:
    return {
        "user_id": int(user_id),
        "notification_enabled": True,
        "default_notify_time": time(9, 0),
        "language": "ko",
    }


def get_pregnancy_info(user_id: int) -> Optional[dict]:
    return db.fetch_pregnancy_info(user_id)


def get_period_info(user_id: int) -> Optional[dict]:
    return db.fetch_period_info(user_id)


# ---------------- supplements ----------------

def add_supplement(user_id: str | int, payload: dict) -> None:
    # 기존 라우터 호환용: 캐시에만 저장
    user = get_user(user_id)
    if not user:
        return
    user["supplements"].append(payload)
    _supplement_defs.setdefault(
        payload["id"],
        {"id": payload["id"], "name": payload.get("name", payload["id"]), "brand": payload.get("brand")},
    )


def get_user_supplements(user_id: int) -> List[dict]:
    return db.fetch_user_supplements(user_id)


def get_supplements() -> List[dict]:
    # DB 기준 (필수 컬럼: id, name, brand)
    rows = db.fetch_supplements()
    for r in rows:
        _supplement_defs.setdefault(str(r["id"]), r)
    return rows


# ---------------- calendar and notifications (DB) ----------------

def create_calendar_event_for_supplement_intake(
    user_id: int, user_supplement: dict, intake_date: date
) -> dict:
    time_of_day: time = user_supplement.get("time_of_day") or time(9, 0, 0)
    start_dt = datetime.combine(intake_date, time_of_day)

    sup_def = None
    for s in get_supplements():
        if str(s["id"]) == str(user_supplement["supplement_id"]):
            sup_def = s
            break
    title = f"{sup_def['name']} 복용" if sup_def else "영양제 복용"

    return db.upsert_calendar_event_for_supplement(
        user_id=user_id,
        supplement_id=user_supplement["supplement_id"],
        start_dt=start_dt,
        title=title,
    )


def create_notification_for_event_if_needed(event: dict) -> Optional[dict]:
    return db.ensure_notification(event["id"], event["start_datetime"])


def get_notifications_due(now: datetime) -> List[dict]:
    return db.fetch_notifications_due(now)


def mark_notification_sent(notification_id: int) -> None:
    db.mark_notification_sent(notification_id)


def get_calendar_event(event_id: int) -> Optional[dict]:
    return db.fetch_calendar_event(event_id)
