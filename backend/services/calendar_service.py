from __future__ import annotations
from datetime import date
from typing import List
from models import CalendarDayInfo, SupplementInfo
import storage

def get_monthly_data(user_id: int, year: int, month: int) -> List[CalendarDayInfo]:
    # month range
    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1)
    else:
        month_end = date(year, month + 1, 1)

    # 영양제
    supplement_events = {}
    user_supplements = storage.get_user_supplements(user_id)

    for us in user_supplements:
        start = us["start_date"] #복용 시작일
        end = us["end_date"] or month_end #복용 종료일이라면 그 날짜, 복용 종료일이 없다면 이번 달 범위까지만
        current = start #지금 계산 중인 날짜 (초기값은 start)
        max_loop = 500

        for _ in range(max_loop):
            #복용 기간 종료
            if current > end: 
                break
            #날짜가 이번 달 범위 안에 있을 때
            if month_start <= current < month_end:
                key = current.strftime("%Y-%m-%d")
                sup = storage.get_supplements()
                sup_def = next((s for s in sup if s["id"] == us["supplement_id"]), None)
                if sup_def:
                    supplement_events.setdefault(key, []).append(
                        SupplementInfo(name=sup_def["name"], time=us["time_of_day"])
                    )

                    # 이벤트 및 알림 생성
                    event = storage.create_calendar_event_for_supplement_intake(
                        user_id, us, current
                    )
                    storage.create_notification_for_event_if_needed(event)

            #복용 주기가 없는 영양제
            if us["cycle"] == "none":
                break
            #복용 주기가 있다면 날짜를 cycle 뒤 날짜로 옮김
            current = current + storage.step_cycle(us["cycle"])  


    # 임신
    pregnancy_map = {}
    preg = storage.get_pregnancy_info(user_id)
    if preg:
        current = preg["pregnancy_start"]
        while current <= preg["due_date"]:
            if month_start <= current < month_end:
                key = current.strftime("%Y-%m-%d")
                pregnancy_map[key] = storage.calculate_pregnancy_stage(
                    current, preg["pregnancy_start"], preg["due_date"]
                )
            current = current + storage.one_day()

    # 생리
    period_map = {}
    period = storage.get_period_info(user_id)
    if period:
        last = period["last_period"]
        #기본 주기 -> 28일
        cycle_days = 28
        current = last
        for _ in range(60):
            if current > month_end: break
            if month_start <= current < month_end:
                key = current.strftime("%Y-%m-%d")
                phase = storage.calculate_period_phase(current, last)
                period_map[key] = phase
            current = current + storage.cycle_days(cycle_days)

    # 최종 list 
    result = []
    for day in range(1, 32):
        try:
            d = date(year, month, day)
        except ValueError:
            break
        key = d.strftime("%Y-%m-%d")
        result.append(
            CalendarDayInfo(
                date=key,
                supplements=supplement_events.get(key, []),
                pregnancyPhase=pregnancy_map.get(key),
                menstrualPhase=period_map.get(key),
            )
        )

    # Todos (CalendarEvent type='todo')
    # Fetch all events for the month for this user
    # We assume storage has a way to fetch events. Since we don't have a direct fetch_events in storage/db,
    # I will add a helper in storage.py or use db directly if exposed.
    # But wait, I can't modify storage.py in this turn easily without viewing it again or assuming.
    # Let's use db.fetch_calendar_events_by_range if it exists? No.
    # I will use a direct SQL query via db.get_conn() here or add a helper in storage.
    # Since I am in service layer, I should use storage.
    # I'll assume storage.get_calendar_events(user_id, start, end) exists or I'll add it.
    # Actually, I'll implement the logic here using storage.get_calendar_events if I add it to storage.
    # Let's add `get_calendar_events` to storage.py first?
    # Or I can just do it here if I import db.
    # Let's import db in this file? No, better to keep separation.
    # I will add `get_calendar_events_in_range` to storage.py in the next step.
    # For now, let's write the code assuming it exists.
    
    todo_events = storage.get_calendar_events_in_range(user_id, month_start, month_end, type="todo")
    todo_map = {}
    from models import Todo
    for ev in todo_events:
        # ev is a dict from DB: id, title, start_datetime, etc.
        d_str = ev["start_datetime"].strftime("%Y-%m-%d")
        todo_map.setdefault(d_str, []).append(
            Todo(
                id=str(ev["id"]),
                text=ev["title"],
                date=d_str,
                completed=False # DB doesn't have completed status yet
            )
        )

    # 최종 list 
    result = []
    for day in range(1, 32):
        try:
            d = date(year, month, day)
        except ValueError:
            break
        key = d.strftime("%Y-%m-%d")
        result.append(
            CalendarDayInfo(
                date=key,
                supplements=supplement_events.get(key, []),
                todos=todo_map.get(key, []),
                pregnancyPhase=pregnancy_map.get(key),
                menstrualPhase=period_map.get(key),
            )
        )

    return result

def add_event(user_id: int, title: str, date_str: str) -> dict:
    # date_str is YYYY-MM-DD
    # We need to convert it to datetime
    from datetime import datetime
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    # upsert_calendar_event requires datetime
    start_dt = datetime.combine(dt, datetime.min.time())
    
    return storage.upsert_calendar_event(
        user_id=user_id,
        title=title,
        start_datetime=start_dt,
        type="todo"
    )

def delete_event(user_id: int, event_id: int) -> bool:
    return storage.delete_calendar_event(event_id, user_id)
