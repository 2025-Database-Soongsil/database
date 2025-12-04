import os
import random
import time
from contextlib import contextmanager
from typing import Optional
from datetime import date, datetime

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = os.getenv("DATABASE_URL")
if not DEFAULT_DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Add it to your environment or .env file.")

# Initialize Connection Pool
try:
    connection_pool = psycopg2.pool.SimpleConnectionPool(
        1,  # minconn
        20, # maxconn
        DEFAULT_DATABASE_URL,
        cursor_factory=RealDictCursor
    )
    if connection_pool:
        print("Connection pool created successfully")
except (Exception, psycopg2.DatabaseError) as error:
    print("Error while connecting to PostgreSQL", error)
    raise error


@contextmanager
def get_conn():
    """
    Yields a connection from the pool.
    Commits on success, rolls back on failure.
    Returns the connection to the pool when done.
    """
    conn = connection_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute("SET TIME ZONE 'Asia/Seoul'")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        connection_pool.putconn(conn)


def _generate_id() -> int:
    # Use millisecond timestamp with a small random offset to avoid collisions
    return int(time.time() * 1000) * 1000 + random.randint(0, 999)


# ---------------- User & Auth ----------------

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


def fetch_user_by_id(user_id: str | int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "User" where id = %s limit 1', (user_id,))
        return cur.fetchone()


def delete_user_by_id(user_id: str | int) -> bool:
    """
    Delete user by id. Returns True if a row was deleted.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        # 1. Delete Notifications linked to user's calendar events
        cur.execute('''
            DELETE FROM "Notification" 
            WHERE event_id IN (SELECT id FROM "CalendarEvent" WHERE user_id = %s)
        ''', (user_id,))
        
        # 2. Delete CalendarEvents
        cur.execute('DELETE FROM "CalendarEvent" WHERE user_id = %s', (user_id,))
        
        # 3. Delete UserSupplements & CustomSupplements
        cur.execute('DELETE FROM "UserSupplement" WHERE user_id = %s', (user_id,))
        cur.execute('DELETE FROM "CustomSupplement" WHERE user_id = %s', (user_id,))
        
        # 4. Delete PregnancyInfo, PeriodInfo, UserProfile, UserSetting
        cur.execute('DELETE FROM "PregnancyInfo" WHERE user_id = %s', (user_id,))
        cur.execute('DELETE FROM "PeriodInfo" WHERE user_id = %s', (user_id,))
        cur.execute('DELETE FROM "UserProfile" WHERE user_id = %s', (user_id,))
        cur.execute('DELETE FROM "UserSetting" WHERE user_id = %s', (user_id,))
        
        # 5. Delete PartnerShare (both as user and partner)
        cur.execute('DELETE FROM "PartnerShare" WHERE user_id = %s OR partner_id = %s', (user_id, user_id))
        
        # 6. Delete User
        cur.execute('DELETE FROM "User" WHERE id = %s', (user_id,))
        return cur.rowcount > 0



def create_user_email(email: str, password: str, nickname: str, pregnant: bool) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO "User" (id, email, password, provider, nickname, is_pregnant, created_at, updated_at) '
            "VALUES (%s, %s, %s, 'local', %s, %s, NOW(), NOW()) RETURNING *",
            (_generate_id(), email, password, nickname, pregnant)
        )
        return cur.fetchone()


def upsert_pregnancy_info(user_id: int, due_date: date = None, pregnancy_start: date = None) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        # Check if exists
        cur.execute('SELECT user_id FROM "PregnancyInfo" WHERE user_id = %s', (user_id,))
        if cur.fetchone():
            cur.execute(
                'UPDATE "PregnancyInfo" SET due_date = COALESCE(%s, due_date), pregnancy_start = COALESCE(%s, pregnancy_start), updated_at = NOW() WHERE user_id = %s',
                (due_date, pregnancy_start, user_id)
            )
        else:
            cur.execute(
                'INSERT INTO "PregnancyInfo" (user_id, due_date, pregnancy_start, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW())',
                (user_id, due_date, pregnancy_start)
            )


def upsert_period_info(user_id: int, last_period: date = None, period_start: date = None) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT user_id FROM "PeriodInfo" WHERE user_id = %s', (user_id,))
        if cur.fetchone():
            cur.execute(
                'UPDATE "PeriodInfo" SET last_period = COALESCE(%s, last_period), period_start = COALESCE(%s, period_start), updated_at = NOW() WHERE user_id = %s',
                (last_period, period_start, user_id)
            )
        else:
            cur.execute(
                'INSERT INTO "PeriodInfo" (user_id, last_period, period_start, updated_at) VALUES (%s, %s, %s, NOW())',
                (user_id, last_period, period_start)
            )


def upsert_user_profile(user_id: int, height: int = None, initial_weight: float = None, current_weight: float = None) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT user_id FROM "UserProfile" WHERE user_id = %s', (user_id,))
        if cur.fetchone():
            cur.execute(
                'UPDATE "UserProfile" SET height = %s, initial_weight = %s, current_weight = %s, updated_at = NOW() WHERE user_id = %s',
                (height, initial_weight, current_weight, user_id)
            )
        else:
            cur.execute(
                'INSERT INTO "UserProfile" (user_id, height, initial_weight, current_weight, updated_at) VALUES (%s, %s, %s, %s, NOW())',
                (user_id, height, initial_weight, current_weight)
            )


def update_user_nickname(user_id: int, nickname: str) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'UPDATE "User" SET nickname = %s, updated_at = NOW() WHERE id = %s',
            (nickname, user_id)
        )
        return cur.rowcount > 0


# ---------------- Supplements & Health Info ----------------

def fetch_user_supplements(user_id: int) -> list[dict]:
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


def fetch_supplements() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select id, name, brand from "Supplement"')
        return cur.fetchall() or []


def fetch_all_supplements() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "Supplement"')
        return cur.fetchall() or []


def fetch_supplement_by_id(supplement_id: int | str) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "Supplement" where id = %s limit 1',
            (supplement_id,),
        )
        return cur.fetchone()


def fetch_nutrients_by_period(period: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        # 1. Fetch Nutrients
        cur.execute(
            'select * from "Nutrient" where recommended_period = %s',
            (period,),
        )
        nutrients = cur.fetchall()
        
        if not nutrients:
            return []

        # 2. Fetch Supplements for these nutrients
        nutrient_ids = tuple(n['id'] for n in nutrients)
        
        # Handle single element tuple syntax for SQL
        if len(nutrient_ids) == 0:
            return nutrients
            
        query = """
            SELECT s.*, sn.nutrient_id
            FROM "Supplement" s
            JOIN "SupplementNutrient" sn ON s.id = sn.supplement_id
            WHERE sn.nutrient_id IN %s
        """
        cur.execute(query, (nutrient_ids,))
        supplements = cur.fetchall()
        
        # 3. Attach supplements to nutrients
        supp_map = {n['id']: [] for n in nutrients}
        for s in supplements:
            s_formatted = {
                'id': s['id'],
                'name': s['name'],
                'schedule': s.get('dosage_info'), # Map dosage_info to schedule
                'caution': s.get('caution'),
                'brand': s.get('brand')
            }
            supp_map[s['nutrient_id']].append(s_formatted)
            
        for n in nutrients:
            n['supplements'] = supp_map.get(n['id'], [])
            # Ensure benefits is at least an empty list if not present (schema doesn't have it)
            if 'benefits' not in n:
                n['benefits'] = []
                
        return nutrients


# ---------------- Calendar & Notifications ----------------

def fetch_calendar_event(event_id: int) -> Optional[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "CalendarEvent" where id = %s limit 1', (event_id,))
        return cur.fetchone()


def fetch_calendar_events_range(user_id: int, start_date, end_date, type: Optional[str] = None) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        query = 'SELECT * FROM "CalendarEvent" WHERE user_id = %s AND start_datetime >= %s AND start_datetime < %s'
        params = [user_id, start_date, end_date]
        if type:
            query += ' AND type = %s'
            params.append(type)
        
        cur.execute(query, tuple(params))
        return cur.fetchall() or []


def upsert_calendar_event(
    user_id: int,
    title: str,
    start_datetime,
    linked_supplement_id: int | str | None = None,
    type: str = "supplement" 
) -> dict:
    """
    Find existing event or insert a new CalendarEvent row.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        # Check for existing event to avoid duplicates
        cur.execute(
            'select * from "CalendarEvent" where user_id = %s and type = %s and linked_supplement_id = %s and start_datetime = %s limit 1',
            (user_id, type, linked_supplement_id, start_datetime),
        )
        existing = cur.fetchone()
        if existing:
            return existing

        cur.execute(
            'insert into "CalendarEvent" (user_id, type, title, start_datetime, end_datetime, repeat_cycle, linked_supplement_id, created_at, updated_at) '
            'values (%s, %s, %s, %s, %s, %s, %s, now(), now()) returning *',
            (
                user_id,
                type,
                title,
                start_datetime,
                None,
                "none",
                linked_supplement_id,
            ),
        )
        return cur.fetchone()


def delete_calendar_event(event_id: int, user_id: int) -> bool:
    """
    Delete a calendar event.
    """
    with get_conn() as conn:
        cur = conn.cursor()
        # First delete notifications linked to this event
        cur.execute('DELETE FROM "Notification" WHERE event_id = %s', (event_id,))
        
        cur.execute(
            'DELETE FROM "CalendarEvent" WHERE id = %s AND user_id = %s',
            (event_id, user_id),
        )
        return cur.rowcount > 0


# Alias for backward compatibility if needed, or just use upsert_calendar_event directly
def upsert_calendar_event_for_supplement(
    user_id: int,
    supplement_id: str | int,
    start_dt,
    title: str,
) -> dict:
    return upsert_calendar_event(user_id, title, start_dt, supplement_id, type="supplement")


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
            'insert into "Notification" (event_id, notify_time, is_sent) '
            "values (%s, %s, %s) returning *",
            (event_id, notify_time, False),
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
            'update "Notification" set is_sent = true, updated_at = now() where id = %s',
            (notification_id,),
        )

# ---------------- User Settings ----------------

def fetch_user_settings(user_id: int) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('select * from "UserSetting" where user_id = %s order by default_notify_time', (user_id,))
        return cur.fetchall() or []


def add_user_setting_time(user_id: int, notify_time: time) -> dict:
    # Check if exists
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'select * from "UserSetting" where user_id = %s and default_notify_time = %s limit 1',
            (user_id, notify_time)
        )
        existing = cur.fetchone()
        if existing:
            return existing

        # Get current enabled status from another row, or default to True
        cur.execute('select notification_enabled from "UserSetting" where user_id = %s limit 1', (user_id,))
        row = cur.fetchone()
        current_enabled = row['notification_enabled'] if row else True

        cur.execute(
            'INSERT INTO "UserSetting" (user_id, notification_enabled, default_notify_time, language) VALUES (%s, %s, %s, %s) RETURNING *',
            (user_id, current_enabled, notify_time, 'ko')
        )
        return cur.fetchone()


def delete_user_setting_time(user_id: int, notify_time: time) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM "UserSetting" WHERE user_id = %s AND default_notify_time = %s',
            (user_id, notify_time)
        )
        return cur.rowcount > 0


def update_user_notification_toggle(user_id: int, enabled: bool) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'UPDATE "UserSetting" SET notification_enabled = %s WHERE user_id = %s',
            (enabled, user_id)
        )
        return cur.rowcount > 0


def add_custom_supplement(user_id: int, name: str, schedule: str = None, notes: str = None) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO "CustomSupplement" (id, user_id, name, note) VALUES (%s, %s, %s, %s) RETURNING *',
            (_generate_id(), user_id, name, f"Schedule: {schedule}\nNotes: {notes}")
        )
        return cur.fetchone()


def add_user_supplement(user_id: int, supplement_id: int) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        # Check if already added
        cur.execute(
            'SELECT * FROM "UserSupplement" WHERE user_id = %s AND supplement_id = %s',
            (user_id, supplement_id)
        )
        existing = cur.fetchone()
        if existing:
            return existing
            
        cur.execute(
            'INSERT INTO "UserSupplement" (id, user_id, supplement_id, start_date) VALUES (%s, %s, %s, NOW()) RETURNING *',
            (_generate_id(), user_id, supplement_id)
        )
        return cur.fetchone()


def fetch_user_profile(user_id: int) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT * FROM "UserProfile" WHERE user_id = %s', (user_id,))
        return cur.fetchone()


def fetch_custom_supplements(user_id: int) -> list:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT * FROM "CustomSupplement" WHERE user_id = %s', (user_id,))
        return cur.fetchall()
