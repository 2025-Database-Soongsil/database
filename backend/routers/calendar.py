from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from models import CalendarDayInfo
import db
from services import calendar_service
from typing import List

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/monthly", response_model=List[CalendarDayInfo])
def get_monthly(
    year: int = Query(..., ge=2000),
    month: int = Query(..., ge = 1, le = 12),
    user_id : int = Query(...)
):
    user = db.fetch_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")

    return calendar_service.get_monthly_data(user["id"], year, month)


from models import TodoCreate

@router.post("/events")
def add_event(payload: TodoCreate, user_id: int = Query(...)):
    user = db.fetch_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    try:
        return calendar_service.add_event(user["id"], payload.text, payload.date)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.delete("/events/{event_id}")
def delete_event(event_id: int, user_id: int = Query(...)):
    user = db.fetch_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
        
    success = calendar_service.delete_event(user["id"], event_id)
    if not success:
        raise HTTPException(status_code=404, detail="이벤트를 찾을 수 없거나 삭제 권한이 없습니다.")
    
    return {"ok": True}
