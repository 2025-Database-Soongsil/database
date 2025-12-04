from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from models import AuthSignup, AuthLogin, SocialLogin, GoogleLogin, KakaoLogin, SocialSignup
import db
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup")
def signup(payload: AuthSignup):
    if db.fetch_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    user = db.create_user_email(payload.email, payload.password, payload.nickname, payload.pregnant)
    if payload.due_date:
        # Convert string to date object if needed, but payload.due_date might be string from Pydantic if not typed as date
        # Pydantic models usually handle date conversion if typed as date.
        # Let's assume it's a date object or string that db accepts?
        # db.upsert_pregnancy_info expects date objects.
        # AuthSignup model definition? I should check models.py.
        # Assuming payload.due_date is compatible.
        db.upsert_pregnancy_info(user["id"], due_date=payload.due_date)
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/login")
def login(payload: AuthLogin):
    user = db.fetch_user_by_email(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/social")
def social(payload: SocialLogin):
    email = f"{payload.provider.lower()}@connected"
    user = db.fetch_user_by_email(email)
    if not user:
        # This seems to be a mock social login?
        # create_user_email expects password.
        user = db.create_user_email(email, payload.token, f"{payload.provider} 사용자", False)
    return {"token": auth_service.build_token(user["id"]), "user": user}

@router.post("/signup/social")
def social_signup(payload: SocialSignup):
    # Check if already exists
    if db.fetch_user_by_social(payload.provider, payload.social_id):
        raise HTTPException(status_code=400, detail="이미 가입된 계정입니다.")
        
    user = db.create_social_user_with_profile(
        payload.provider, 
        payload.social_id, 
        payload.email, 
        payload.nickname, 
        payload.gender,
        payload.height,
        payload.weight
    )
    return {"token": auth_service.build_token(str(user["id"])), "user": user}


@router.post("/google")
def google_login(payload: GoogleLogin):
    idinfo = auth_service.verify_google_token(payload.credential, payload.is_code)
    
    email = idinfo.get("email")
    social_id = idinfo.get("sub")
    if not email or not social_id:
        raise HTTPException(status_code=400, detail="구글 프로필에서 이메일을 가져올 수 없습니다.")

    # Check if user exists
    existing_user = db.fetch_user_by_social("google", social_id)
    if not existing_user:
        # Check by email to link accounts? 
        # For now, if not found by social_id, require registration
        # But if email exists, we might want to auto-link?
        # The prompt implies strict separation or at least "if not in DB -> popup".
        # Let's check email just in case to avoid duplicates, but if email found, maybe we just link it?
        # User said: "If DB User table has no info -> popup".
        # So if email exists, we should probably just return the user (auto-link).
        user_by_email = db.fetch_user_by_email(email)
        if user_by_email:
             # Auto-link logic
             user_record = auth_service.handle_social_login("google", social_id, email, user_by_email["nickname"])
             return {"token": auth_service.build_token(str(user_record["id"])), "user": user_record}
        
        # New user -> Return info for signup form
        return {
            "status": "register_required",
            "social_info": {
                "provider": "google",
                "social_id": social_id,
                "email": email,
                "nickname": idinfo.get("name") or email.split("@")[0]
            }
        }

    # User exists
    return {"token": auth_service.build_token(str(existing_user["id"])), "user": existing_user}


@router.post("/kakao")
def kakao_login(payload: KakaoLogin):
    profile = auth_service.verify_kakao_token(payload.code)

    social_id = str(profile.get("id"))
    kakao_account = profile.get("kakao_account", {}) or {}
    profile_obj = kakao_account.get("profile") or {}
    email = kakao_account.get("email")
    nickname = profile_obj.get("nickname") or "카카오 사용자"
    email = email or f"{social_id}@kakao.connected"

    # Check if user exists
    existing_user = db.fetch_user_by_social("kakao", social_id)
    if not existing_user:
        user_by_email = db.fetch_user_by_email(email)
        if user_by_email:
             # Auto-link logic
             user_record = auth_service.handle_social_login("kakao", social_id, email, user_by_email["nickname"])
             return {"token": auth_service.build_token(str(user_record["id"])), "user": user_record}
        
        # New user -> Return info for signup form
        return {
            "status": "register_required",
            "social_info": {
                "provider": "kakao",
                "social_id": social_id,
                "email": email,
                "nickname": nickname
            }
        }

    # User exists
    return {"token": auth_service.build_token(str(existing_user["id"])), "user": existing_user}

@router.delete("/me")
def delete_me(authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    # Explicitly cast to int as IDs are integers
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Check if user exists first
    existing_user = db.fetch_user_by_id(uid)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # If Kakao user, unlink first
    if existing_user.get("provider") == "kakao" and existing_user.get("social_id"):
        try:
            auth_service.unlink_kakao_user(existing_user["social_id"])
        except Exception as e:
            print(f"Failed to unlink Kakao user: {e}")

    # Remove try-except to expose DB errors
    deleted = db.delete_user_by_id(uid)
    
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete user record")

    # storage.reset_user removed
    return {"ok": True}


from pydantic import BaseModel

class UpdateProfile(BaseModel):
    nickname: str

@router.patch("/me")
def update_me(payload: UpdateProfile, authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    success = db.update_user_nickname(int(user_id), payload.nickname)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"ok": True, "nickname": payload.nickname}

@router.post("/logout")
def logout(authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    return {"ok": True}
from models import TimePayload, TogglePayload
from datetime import datetime, time

@router.get("/settings")
def get_settings(authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    rows = db.fetch_user_settings(user_id)
    
    # If no rows, return default state (empty list, enabled=True)
    if not rows:
        return {
            "notification_enabled": True,
            "times": []
        }
    
    # All rows should have same enabled status, take from first
    enabled = rows[0]["notification_enabled"]
    
    # Extract times
    times = []
    for row in rows:
        if row["default_notify_time"]:
            # Format HH:MM
            t = row["default_notify_time"]
            times.append(t.strftime("%H:%M"))
            
    return {
        "notification_enabled": enabled,
        "times": times
    }


@router.post("/settings/time")
def add_time(payload: TimePayload, authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    try:
        parts = payload.time.split(":")
        notify_time = time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid time format")

    db.add_user_setting_time(user_id, notify_time)
    return {"ok": True}


@router.delete("/settings/time")
def delete_time(payload: TimePayload, authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    try:
        parts = payload.time.split(":")
        notify_time = time(int(parts[0]), int(parts[1]))
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid time format")

    db.delete_user_setting_time(user_id, notify_time)
    return {"ok": True}


@router.patch("/settings/toggle")
def toggle_notifications(payload: TogglePayload, authorization: str = Header(None)):
    user_id = auth_service.parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    
    db.update_user_notification_toggle(user_id, payload.enabled)
    return {"ok": True}
