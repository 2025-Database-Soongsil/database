from __future__ import annotations
from datetime import date, datetime, time
from typing import List
from models import CalendarDayInfo, SupplementInfo, Todo
import db
import utils

def create_calendar_event_for_supplement_intake(
    user_id: int, user_supplement: dict, intake_date: date
) -> dict:
    time_of_day: time = user_supplement.get("time_of_day") or time(9, 0, 0)
    start_dt = datetime.combine(intake_date, time_of_day)

    sup_def = db.fetch_supplement_by_id(user_supplement["supplement_id"])
    title = f"{sup_def['name']} 복용" if sup_def else "영양제 복용"

    return db.upsert_calendar_event(
        user_id=user_id,
        title=title,
        start_datetime=start_dt,
        linked_supplement_id=user_supplement["supplement_id"],
        type="supplement"
    )

def get_monthly_data(user_id: int, year: int, month: int) -> List[CalendarDayInfo]:
    # month range
    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1)
    else:
        month_end = date(year, month + 1, 1)

    # 영양제
    supplement_events = {}
    user_supplements = db.fetch_user_supplements(user_id)
    all_supplements = db.fetch_supplements() # List of dicts with id, name

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
                sup_def = next((s for s in all_supplements if s["id"] == us["supplement_id"]), None)
                if sup_def:
                    supplement_events.setdefault(key, []).append(
                        SupplementInfo(name=sup_def["name"], time=us["time_of_day"])
                    )

                    # 이벤트 및 알림 생성
                    event = create_calendar_event_for_supplement_intake(
                        user_id, us, current
                    )
                    db.ensure_notification(event["id"], event["start_datetime"])

            #복용 주기가 없는 영양제
            if us["cycle"] == "none":
                break
            #복용 주기가 있다면 날짜를 cycle 뒤 날짜로 옮김
            current = current + utils.step_cycle(us["cycle"])  


    # 임신
    pregnancy_map = {}
    preg = db.fetch_pregnancy_info(user_id)
    if preg:
        current = preg["pregnancy_start"]
        while current <= preg["due_date"]:
            if month_start <= current < month_end:
                key = current.strftime("%Y-%m-%d")
                pregnancy_map[key] = utils.calculate_pregnancy_stage_label(
                    current, preg["pregnancy_start"], preg["due_date"]
                )
            current = current + utils.one_day()

    # 생리
    period_map = {}
    period = db.fetch_period_info(user_id)
    if period:
        last = period["last_period"]
        #기본 주기 -> 28일
        cycle_days = 28
        current = last
        for _ in range(60):
            if current > month_end: break
            if month_start <= current < month_end:
                key = current.strftime("%Y-%m-%d")
                phase = utils.calculate_period_phase(current, last)
                period_map[key] = phase
            current = current + utils.cycle_days(cycle_days)

    # Todos (CalendarEvent type='todo')
    todo_events = db.fetch_calendar_events_range(user_id, month_start, month_end, type="todo")
    todo_map = {}
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
    
    return db.upsert_calendar_event(
        user_id=user_id,
        title=title,
        start_datetime=start_dt,
        type="todo"
    )

def delete_event(user_id: int, event_id: int) -> bool:
    return db.delete_calendar_event(event_id, user_id)
