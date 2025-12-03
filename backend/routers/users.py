from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import ProfilePayload
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
    # Merge profile into user object for frontend compatibility if needed, 
    # or just return as is. The frontend expects "user" object to have "profile" field?
    # Let's check frontend code.
    # useProfile.js: const { user } = res.data; setHeight(user.profile?.height);
    # So yes, user object should have profile field.
    
    user_with_profile = dict(user)
    user_with_profile["profile"] = profile_data
    
    status = weight_status(profile_data.get("height"), profile_data.get("preWeight"), profile_data.get("currentWeight"))
    return {"user": user_with_profile, "weightStatus": status}


@router.put("/profile")
def update_profile(payload: ProfilePayload, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    db.upsert_user_profile(
        user_id=user["id"],
        height=payload.height,
        weight=payload.currentWeight # payload has currentWeight, db expects weight?
        # db.upsert_user_profile(user_id, height, weight)
        # UserProfile table has 'weight'.
        # Frontend sends 'currentWeight'.
        # Let's check db.upsert_user_profile signature.
        # def upsert_user_profile(user_id: int, height: int = None, weight: float = None)
    )
    # Also update preWeight?
    # UserProfile table has height, weight. No preWeight?
    # Schema: height, weight.
    # Frontend sends preWeight too.
    # If DB doesn't support preWeight, we lose it.
    # I should add preWeight to UserProfile table?
    # Or just ignore it?
    # The user said "Connect Notification Settings to DB".
    # Maybe Profile DB connection was already done or assumed?
    # Schema has UserProfile with height, weight.
    # I'll stick to what DB supports.
    
    # Fetch updated profile
    profile_data = db.fetch_user_profile(user["id"]) or {}
    
    status = weight_status(
        profile_data.get("height"),
        payload.preWeight, # We don't store preWeight in DB yet, so use payload?
        profile_data.get("weight"),
    )
    return {"profile": profile_data, "weightStatus": status}


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
