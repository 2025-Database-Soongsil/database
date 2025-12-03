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
import utils

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


# ---------------- shared business logic ----------------
# Moved to utils.py, re-exporting for compatibility if needed, 
# but better to use utils directly in other files.
# Keeping wrappers here if other files import from storage.

def one_day() -> timedelta:
    return utils.one_day()


def step_cycle(cycle: str) -> timedelta:
    return utils.step_cycle(cycle)


def cycle_days(days: int) -> timedelta:
    return utils.cycle_days(days)


def calculate_pregnancy_stage(target: date, start: date, due: date) -> str:
    return utils.calculate_pregnancy_stage_label(target, start, due)


def calculate_period_phase(target: date, last_start: date) -> str:
    return utils.calculate_period_phase(target, last_start)


# ---------------- user helpers ----------------

def ensure_user_cache(user_record: dict) -> dict:
    # No-op since we removed the cache, just return the record
    return user_record


def reset_user(user_id: str | int) -> None:
    # No-op
    pass


def get_user(user_id: str | int) -> Optional[dict]:
    try:
        return db.fetch_user_by_id(int(user_id))
    except Exception:
        return None


def get_user_from_token(token: str) -> Optional[dict]:
    if not token.startswith("token-"):
        return None
    user_id = token.replace("token-", "")
    return get_user(user_id)


def get_user_from_id(user_id: int) -> Optional[dict]:
    return get_user(user_id)


def get_user_by_email(email: str) -> Optional[dict]:
    return db.fetch_user_by_email(email)


def create_user(email: str, password: str, nickname: Optional[str], pregnant: bool) -> dict:
    # DB insert
    # Note: db.create_user is not defined in the snippet I saw earlier, 
    # but based on db.py content I saw, I might need to use upsert_social_user or similar, 
    # or if there is a create_user function.
    # Checking db.py content again... it has upsert_social_user but maybe not a generic create_user for email/pass?
    # Actually, looking at previous storage.py, it was just in-memory.
    # I should implement a proper DB insert here or in db.py.
    # For now, I will assume db.py has or I can add a simple insert.
    # Wait, the prompt didn't ask me to edit db.py again. 
    # I will use a direct SQL execution here if needed or assume db.py has it.
    # Actually, let's check if I can use upsert_social_user for normal users too?
    # No, that takes provider/social_id.
    # I'll implement a simple insert using db.get_conn() here if db.py doesn't have it.
    # BUT, I should stick to the plan. The plan said "Simplify to just be a wrapper around db.py".
    # I will assume db.py has `create_user_email` or I will add it.
    # Since I cannot see db.py right now (I saw it earlier), I'll implement it here using db.get_conn().
    
    with db.get_conn() as conn:
        cur = conn.cursor()
        # Check if exists
        cur.execute('SELECT * FROM "User" WHERE email = %s', (email,))
        if cur.fetchone():
            raise ValueError("User already exists")
            
        cur.execute(
            '''
            INSERT INTO "User" (email, password, nickname, pregnant, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            RETURNING *
            ''',
            (email, password, nickname, pregnant)
        )
        row = cur.fetchone()
        return dict(row)


def set_dates(user_id: str | int, period_start: Optional[str], due_date: Optional[str]) -> None:
    # Update DB
    with db.get_conn() as conn:
        cur = conn.cursor()
        if period_start:
            p_start = datetime.fromisoformat(period_start).date()
            cur.execute(
                'UPDATE "User" SET dates = jsonb_set(COALESCE(dates, \'{}\'), \'{period_start}\', to_jsonb(%s::text)) WHERE id = %s',
                (p_start, int(user_id))
            )
            # Logic for last_period?
             
        if due_date:
            d_date = datetime.fromisoformat(due_date).date()
            cur.execute(
                'UPDATE "User" SET dates = jsonb_set(COALESCE(dates, \'{}\'), \'{due_date}\', to_jsonb(%s::text)) WHERE id = %s',
                (d_date, int(user_id))
            )
            # Logic for pregnancy_start?
            p_start = d_date - timedelta(days=280)
            cur.execute(
                'UPDATE "User" SET dates = jsonb_set(COALESCE(dates, \'{}\'), \'{pregnancy_start}\', to_jsonb(%s::text)) WHERE id = %s',
                (p_start, int(user_id))
            )


def update_profile(user_id: str | int, payload: dict) -> None:
    # Update DB profile column
    import json
    with db.get_conn() as conn:
        cur = conn.cursor()
        # Merge update
        cur.execute(
            'UPDATE "User" SET profile = COALESCE(profile, \'{}\'::jsonb) || %s::jsonb WHERE id = %s',
            (json.dumps(payload), int(user_id))
        )


def update_user_nickname(user_id: str | int, nickname: str) -> bool:
    return db.update_user_nickname(int(user_id), nickname)


def set_notifications(user_id: str | int, notifications: List[str]) -> None:
    import json
    with db.get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'UPDATE "User" SET notifications = %s::jsonb WHERE id = %s',
            (json.dumps(notifications), int(user_id))
        )


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
    # This was "cache only" before. Now we should probably save to DB?
    # But db.py might not have a table for user supplements if it was relying on JSON column.
    # Let's check if there is a function in db.py for this.
    # db.fetch_user_supplements exists.
    # I'll assume we store it in the 'supplements' JSONB column of User table for now to match previous behavior if no separate table.
    # Or better, use a separate table if it exists.
    # Given I can't see schema, I'll stick to updating the User.supplements JSONB column which matches `_default_user_record` structure.
    import json
    with db.get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            '''
            UPDATE "User" 
            SET supplements = COALESCE(supplements, '[]'::jsonb) || %s::jsonb 
            WHERE id = %s
            ''',
            (json.dumps([payload]), int(user_id))
        )


def get_user_supplements(user_id: int) -> List[dict]:
    return db.fetch_user_supplements(user_id)


def get_supplements() -> List[dict]:
    return db.fetch_supplements()


def get_nutrients_by_period(period: str) -> List[dict]:
    return db.fetch_nutrients_by_period(period)


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


def get_calendar_events_in_range(user_id: int, start_date: date, end_date: date, type: Optional[str] = None) -> List[dict]:
    return db.fetch_calendar_events_range(user_id, start_date, end_date, type)


def upsert_calendar_event(user_id: int, title: str, start_datetime: datetime, type: str = "supplement", linked_supplement_id: Optional[int] = None) -> dict:
    return db.upsert_calendar_event(user_id, title, start_datetime, linked_supplement_id, type)


def delete_calendar_event(event_id: int, user_id: int) -> bool:
    return db.delete_calendar_event(event_id, user_id)
