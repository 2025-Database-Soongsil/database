from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import ProfilePayload
from utils import weight_status
import storage

router = APIRouter(prefix="/users", tags=["users"])


def _user_from_header(auth_header: str | None):
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    user_id = token.split("token-", 1)[1]
    return storage.get_user(user_id)


@router.get("/me")
def me(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    profile = user.get("profile", {})
    status = weight_status(profile.get("height"), profile.get("preWeight"), profile.get("currentWeight"))
    return {"user": user, "weightStatus": status}


@router.put("/profile")
def update_profile(payload: ProfilePayload, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    storage.update_profile(user["id"], payload.model_dump(exclude_none=True))
    status = weight_status(
        payload.height or user["profile"].get("height"),
        payload.preWeight or user["profile"].get("preWeight"),
        payload.currentWeight or user["profile"].get("currentWeight"),
    )
    return {"profile": user["profile"], "weightStatus": status}


@router.put("/notifications")
def notifications(notifications: list[str], authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    storage.set_notifications(user["id"], notifications)
    return {"notifications": notifications}
