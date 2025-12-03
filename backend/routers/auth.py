from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from models import AuthSignup, AuthLogin, SocialLogin, GoogleLogin, KakaoLogin
import storage
import db
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup")
def signup(payload: AuthSignup):
    if storage.get_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    user = storage.create_user(payload.email, payload.password, payload.nickname, payload.pregnant)
    if payload.due_date:
        storage.set_dates(user["id"], None, payload.due_date)
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/login")
def login(payload: AuthLogin):
    user = storage.get_user_by_email(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/social")
def social(payload: SocialLogin):
    email = f"{payload.provider.lower()}@connected"
    user = storage.get_user_by_email(email)
    if not user:
        user = storage.create_user(email, payload.token, f"{payload.provider} 사용자")
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/google")
def google_login(payload: GoogleLogin):
    idinfo = auth_service.verify_google_token(payload.credential, payload.is_code)
    
    email = idinfo.get("email")
    social_id = idinfo.get("sub")
    if not email or not social_id:
        raise HTTPException(status_code=400, detail="구글 프로필에서 이메일을 가져올 수 없습니다.")

    nickname = idinfo.get("name") or email.split("@")[0]
    user_record = auth_service.handle_social_login("google", social_id, email, nickname)
    user = storage.ensure_user_cache(user_record)
    return {"token": auth_service.build_token(str(user_record["id"])), "user": user}

@router.post("/kakao")
def kakao_login(payload: KakaoLogin):
    profile = auth_service.verify_kakao_token(payload.code)

    social_id = str(profile.get("id"))
    kakao_account = profile.get("kakao_account", {}) or {}
    profile_obj = kakao_account.get("profile") or {}
    email = kakao_account.get("email")
    nickname = profile_obj.get("nickname") or "카카오 사용자"
    email = email or f"{social_id}@kakao.connected"

    user_record = auth_service.handle_social_login("kakao", social_id, email, nickname)
    user = storage.ensure_user_cache(user_record)
    return {"token": auth_service.build_token(str(user_record["id"])), "user": user}

@router.delete("/me")
def delete_me(authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    # Best-effort DB delete
    try:
        db.delete_user_by_id(user_id)
    except Exception:
        pass
    storage.reset_user(user_id)
    return {"ok": True}

@router.post("/logout")
def logout(authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    return {"ok": True}
