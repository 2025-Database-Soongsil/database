from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from models import AuthSignup, AuthLogin, SocialLogin
import storage

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token(user_id: str):
    return f"token-{user_id}"


def _parse_token(token: str | None):
    if not token:
        return None
    token = token.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    return token.split("token-", 1)[1]


@router.post("/signup")
def signup(payload: AuthSignup):
    if storage.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    user = storage.create_user(payload.email, payload.password, payload.nickname, payload.pregnant)
    if payload.due_date:
        storage.set_dates(user["id"], None, payload.due_date)
    return {"token": _build_token(user["id"]), "user": user}


@router.post("/login")
def login(payload: AuthLogin):
    user = storage.get_user_by_email(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    return {"token": _build_token(user["id"]), "user": user}


@router.post("/social")
def social(payload: SocialLogin):
    email = f"{payload.provider.lower()}@connected"
    user = storage.get_user_by_email(email)
    if not user:
        user = storage.create_user(email, payload.token, f"{payload.provider} 사용자")
    return {"token": _build_token(user["id"]), "user": user}


@router.delete("/me")
def delete_me(authorization: str = Header(None)):
    user_id = _parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    storage.reset_user(user_id)
    return {"ok": True}
