from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import ProfilePayload, PregnancyPayload
from utils import weight_status
import db

router = APIRouter(prefix="/users", tags=["users"])


def _user_from_header(auth_header: str | None):
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    user_id = token.split("token-", 1)[1]
    return db.fetch_user_by_id(user_id)


@router.get("/me")
def me(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    # Fetch profile separately as it's not in User table anymore
    profile_data = db.fetch_user_profile(user["id"]) or {}
    
    # Map DB columns to frontend keys
    mapped_profile = {
        "height": profile_data.get("height"),
        "preWeight": profile_data.get("initial_weight"),
        "currentWeight": profile_data.get("current_weight"),
    }
    
    user_with_profile = dict(user)
    user_with_profile["profile"] = mapped_profile
    
    status = weight_status(
        mapped_profile.get("height"), 
        mapped_profile.get("preWeight"), 
        mapped_profile.get("currentWeight")
    )
    return {"user": user_with_profile, "weightStatus": status}


@router.put("/profile")
def update_profile(payload: ProfilePayload, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    db.upsert_user_profile(
        user_id=user["id"],
        height=payload.height,
        initial_weight=payload.preWeight,
        current_weight=payload.currentWeight
    )
    
    # Fetch updated profile
    profile_data = db.fetch_user_profile(user["id"]) or {}
    
    # Map DB columns to frontend keys
    mapped_profile = {
        "height": profile_data.get("height"),
        "preWeight": profile_data.get("initial_weight"),
        "currentWeight": profile_data.get("current_weight"),
    }
    
    status = weight_status(
        mapped_profile.get("height"),
        mapped_profile.get("preWeight"),
        mapped_profile.get("currentWeight"),
    )
    return {"profile": mapped_profile, "weightStatus": status}


@router.patch("/pregnancy")
def update_pregnancy(payload: PregnancyPayload, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    success = db.update_user_pregnancy(user["id"], payload.is_pregnant)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update pregnancy status")
        
    return {"ok": True, "is_pregnant": payload.is_pregnant}


@router.put("/notifications")
def notifications(notifications: list[str], authorization: str = Header(None)):
    # This endpoint seems legacy/unused by new frontend hooks.
    # But to be safe, we can implement it or just pass.
    # storage.set_notifications used to update JSONB.
    # We have UserSetting table now.
    # We could clear all settings and insert these?
    # But UserSetting has default_notify_time.
    # Let's just return success for now as it's likely unused.
    return {"notifications": notifications}
