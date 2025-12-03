from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from models import CalendarDayInfo
import storage
from services import calendar_service
from typing import List

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/monthly", response_model=List[CalendarDayInfo])
def get_monthly(
    year: int = Query(..., ge=2000),
    month: int = Query(..., ge = 1, le = 12),
    user_id : int = Query(...)
):
    user = storage.get_user_from_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")

    return calendar_service.get_monthly_data(user["id"], year, month)
