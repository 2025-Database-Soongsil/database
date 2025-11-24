from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import TodoCreate, Todo, DatePayload
from utils import calculate_stage
import storage
import uuid

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _user_from_header(auth_header: str | None):
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    user_id = token.split("token-", 1)[1]
    return storage.get_user(user_id)


@router.get("/overview")
def get_overview(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    stage = calculate_stage(user["dates"].get("startDate"), user["dates"].get("dueDate"))
    return {"stage": stage, "dates": user["dates"]}


@router.post("/dates")
def set_dates(payload: DatePayload, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    storage.set_dates(user["id"], payload.startDate, payload.dueDate)
    stage = calculate_stage(payload.startDate, payload.dueDate)
    return {"dates": user["dates"], "stage": stage}


@router.get("/todos")
def list_todos(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    return user["todos"]


@router.post("/todos")
def add_todo(payload: TodoCreate, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    todo = Todo(id=str(uuid.uuid4()), text=payload.text, date=payload.date, completed=False)
    storage.upsert_todo(user["id"], todo.model_dump())
    return todo


@router.put("/todos")
def replace_todo(payload: list[Todo], authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    storage.replace_todos(user["id"], [todo.model_dump() for todo in payload])
    return {"ok": True}
