import os
import random
import time
from contextlib import contextmanager
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ssu_data:ssu_data_pass@ssu-database-2025.cte8uwka62k7.ap-northeast-2.rds.amazonaws.com:5432/ssu_database",
)


@contextmanager
def get_conn():
    """
    Yields a connection with RealDictCursor so rows come back as dicts.
    Commits on success, rolls back on failure.
    """
    conn = psycopg2.connect(DEFAULT_DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _generate_id() -> int:
    # Use millisecond timestamp with a small random offset to avoid collisions
    return int(time.time() * 1000) * 1000 + random.randint(0, 999)


def fetch_user_by_email(email: str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "User" where email = %s limit 1', (email,))
        return cur.fetchone()


def fetch_user_by_social(provider: str, social_id: str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "User" where provider = %s and social_id = %s limit 1',
            (provider, social_id),
        )
        return cur.fetchone()


def upsert_social_user(provider: str, social_id: str, email: str, nickname: str) -> dict:
    """
    Returns existing user if found by provider/social_id or email, otherwise inserts.
    """
    existing = fetch_user_by_social(provider, social_id)
    if existing:
        return existing

    user_by_email = fetch_user_by_email(email)
    with get_conn() as conn:
        cur = conn.cursor()
        if user_by_email:
            cur.execute(
                'update "User" set provider = %s, social_id = %s, nickname = %s, updated_at = now() where id = %s returning *',
                (provider, social_id, nickname, user_by_email["id"]),
            )
        else:
            cur.execute(
                'insert into "User" (id, email, provider, social_id, nickname, is_pregnant, created_at, updated_at) '
                'values (%s, %s, %s, %s, %s, %s, now(), now()) returning *',
                (_generate_id(), email, provider, social_id, nickname, False),
            )
        return cur.fetchone()


def delete_user_by_id(user_id: str | int) -> bool:
    """
    Delete user by id. Returns True if a row was deleted.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('delete from "User" where id = %s', (user_id,))
        return cur.rowcount > 0


# ---------------- additional helpers for calendar & supplements ----------------


def fetch_user_by_id(user_id: str | int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "User" where id = %s limit 1', (user_id,))
        return cur.fetchone()


def fetch_user_supplements(user_id: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select id, user_id, supplement_id, start_date, end_date, cycle, time_of_day '
            'from "UserSupplement" where user_id = %s',
            (user_id,),
        )
        return cur.fetchall()


def fetch_pregnancy_info(user_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select user_id, pregnancy_start, due_date from "PregnancyInfo" where user_id = %s limit 1',
            (user_id,),
        )
        return cur.fetchone()


def fetch_period_info(user_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select user_id, last_period, period_start from "PeriodInfo" where user_id = %s limit 1',
            (user_id,),
        )
        return cur.fetchone()


def fetch_supplements() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select id, name, brand from "Supplement"')
        return cur.fetchall()


def upsert_calendar_event_for_supplement(
    user_id: int,
    supplement_id: str | int,
    start_dt,
    title: str,
) -> dict:
    """
    Ensures a calendar event exists for a supplement intake at a specific time.
    Returns the row as a dict.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "CalendarEvent" '
            'where user_id = %s and type = %s and linked_supplement_id = %s and start_datetime = %s '
            "limit 1",
            (user_id, "supplement", supplement_id, start_dt),
        )
        existing = cur.fetchone()
        if existing:
            return existing

        cur.execute(
            'insert into "CalendarEvent" ('
            "id, user_id, type, title, start_datetime, end_datetime, repeat_cycle, linked_supplement_id, created_at, updated_at"
            ") values (%s, %s, %s, %s, %s, %s, %s, %s, now(), now()) "
            "returning *",
            (
                _generate_id(),
                user_id,
                "supplement",
                title,
                start_dt,
                None,
                "none",
                supplement_id,
            ),
        )
        return cur.fetchone()


def ensure_notification(event_id: int, notify_time) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Notification" where event_id = %s and notify_time = %s limit 1',
            (event_id, notify_time),
        )
        existing = cur.fetchone()
        if existing:
            return existing

        cur.execute(
            'insert into "Notification" (id, event_id, notify_time, is_sent) '
            "values (%s, %s, %s, %s) returning *",
            (_generate_id(), event_id, notify_time, False),
        )
        return cur.fetchone()


def fetch_notifications_due(now) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Notification" where notify_time <= %s and is_sent = false',
            (now,),
        )
        return cur.fetchall()


def mark_notification_sent(notification_id: int) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'update "Notification" set is_sent = true, updated_at = now() where id = %s',
            (notification_id,),
        )


def fetch_calendar_event(event_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "CalendarEvent" where id = %s limit 1', (event_id,))
        return cur.fetchone()


# --------- additional fetch helpers ----------

def fetch_user_by_id(user_id: str | int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "User" where id = %s limit 1', (user_id,))
        return cur.fetchone()


def fetch_user_supplements(user_id: int) -> list[dict]:
    """
    Fetch rows from UserSupplement for the given user.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "UserSupplement" where user_id = %s',
            (user_id,),
        )
        return cur.fetchall() or []


def fetch_pregnancy_info(user_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "PregnancyInfo" where user_id = %s limit 1',
            (user_id,),
        )
        return cur.fetchone()


def fetch_period_info(user_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "PeriodInfo" where user_id = %s limit 1',
            (user_id,),
        )
        return cur.fetchone()


def fetch_supplement_by_id(supplement_id: int | str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Supplement" where id = %s limit 1',
            (supplement_id,),
        )
        return cur.fetchone()


def fetch_all_supplements() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "Supplement"')
        return cur.fetchall() or []


# --------- calendar & notification helpers ----------

def upsert_calendar_event(
    user_id: int,
    title: str,
    start_datetime,
    linked_supplement_id: int | str | None,
) -> dict:
    """
    Find existing supplement event for the same user/supplement/start time,
    otherwise insert a new CalendarEvent row.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "CalendarEvent" where user_id = %s and type = %s and linked_supplement_id = %s and start_datetime = %s limit 1',
            (user_id, "supplement", linked_supplement_id, start_datetime),
        )
        existing = cur.fetchone()
        if existing:
            return existing

        cur.execute(
            'insert into "CalendarEvent" (id, user_id, type, title, start_datetime, end_datetime, repeat_cycle, linked_supplement_id, created_at, updated_at) '
            'values (%s, %s, %s, %s, %s, %s, %s, %s, now(), now()) returning *',
            (
                _generate_id(),
                user_id,
                "supplement",
                title,
                start_datetime,
                None,
                "none",
                linked_supplement_id,
            ),
        )
        return cur.fetchone()


def ensure_notification(event_id: int, notify_time) -> dict:
    """
    Return existing notification for the event/time or insert a new one.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Notification" where event_id = %s and notify_time = %s limit 1',
            (event_id, notify_time),
        )
        existing = cur.fetchone()
        if existing:
            return existing
        cur.execute(
            'insert into "Notification" (id, event_id, notify_time, is_sent) values (%s, %s, %s, %s) returning *',
            (_generate_id(), event_id, notify_time, False),
        )
        return cur.fetchone()


def fetch_notifications_due(now) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Notification" where notify_time <= %s and is_sent = false',
            (now,),
        )
        return cur.fetchall() or []


def mark_notification_sent(notification_id: int) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'update "Notification" set is_sent = true where id = %s',
            (notification_id,),
        )


def fetch_calendar_event(event_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "CalendarEvent" where id = %s limit 1',
            (event_id,),
        )
        return cur.fetchone()
