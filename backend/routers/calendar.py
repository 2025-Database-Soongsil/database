#------------------------------------------------------------
# 특정 연/월에 대해 달의 날짜별로
#   영양제 복용 정보
#   임신 단계
#   생리 단계
# 를 합쳐 CalendarDayInfo[] 형태로 리턴
# 추가로 해당 달의 영양제 복용 일정에 대한 Notification 데이터 만들어놓음
#-------------------------------------------------------------

from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException, Query
from models import CalendarDayInfo, SupplementInfo
import storage
from datetime import date
from typing import List
import database

router = APIRouter(prefix="/calendar", tags=["calendar"])

def _user_from_header(auth_header: str | None):
    #storage 기반 토큰 인증 -> 차후에 DB연결하면 바꾸어야 함
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    return storage.get_user_from_token(token)


@router.get("/monthly", response_model=List[CalendarDayInfo])
def get_monthly(
    year: int = Query(..., ge=2000),
    month: int = Query(..., ge = 1, le = 12),
    user_id : int = Query(...)
    #authorization: str = Header(None)
):
    user = storage.get_user_from_id(user_id)
   # user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")

    user_id = user["id"]

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

    return result
