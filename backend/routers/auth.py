from __future__ import annotations
import os
from fastapi import APIRouter, HTTPException, Header
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from models import AuthSignup, AuthLogin, SocialLogin, GoogleLogin, KakaoLogin
import storage
import db
import requests

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "508761663996-4hu8esf43jug8m677o8l5bkh5elhjchi.apps.googleusercontent.com",
)
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "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")
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID", "bb709df8328e550df323509b196c988a")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "5GEvDYGzKkv70aPAO8q9La1btjUOHKni")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:5173/login/oauth2/code/kakao")


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


@router.post("/google")
def google_login(payload: GoogleLogin):
    # Supports both ID token (One Tap) and auth code (popup) flows.
    if payload.is_code:
        if not GOOGLE_CLIENT_SECRET:
            raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_SECRET가 설정되어 있지 않습니다.")
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": payload.credential,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": "postmessage",
            },
            timeout=5,
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=401, detail=f"구글 토큰 교환 실패: {token_resp.text}")
        token_json = token_resp.json()
        id_token_value = token_json.get("id_token")
        if not id_token_value:
            raise HTTPException(status_code=401, detail="구글 ID 토큰을 받지 못했습니다.")
        try:
            idinfo = id_token.verify_oauth2_token(id_token_value, grequests.Request(), GOOGLE_CLIENT_ID)
        except Exception:
            raise HTTPException(status_code=401, detail="구글 ID 토큰 검증에 실패했습니다.")
    else:
        try:
            idinfo = id_token.verify_oauth2_token(payload.credential, grequests.Request(), GOOGLE_CLIENT_ID)
        except Exception:
            raise HTTPException(status_code=401, detail="유효하지 않은 구글 토큰입니다.")

    email = idinfo.get("email")
    social_id = idinfo.get("sub")
    if not email or not social_id:
        raise HTTPException(status_code=400, detail="구글 프로필에서 이메일을 가져올 수 없습니다.")

    nickname = idinfo.get("name") or email.split("@")[0]
    user_record = db.upsert_social_user("google", social_id, email, nickname)
    user = storage.ensure_user_cache(user_record)
    return {"token": _build_token(str(user_record["id"])), "user": user}


@router.post("/kakao")
def kakao_login(payload: KakaoLogin):
    # Exchange code for token
    token_data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "code": payload.code,
    }
    if KAKAO_CLIENT_SECRET:
        token_data["client_secret"] = KAKAO_CLIENT_SECRET

    token_resp = requests.post(
        "https://kauth.kakao.com/oauth/token",
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=5,
    )
    if token_resp.status_code != 200:
        raise HTTPException(status_code=401, detail=f"카카오 토큰 발급 실패: {token_resp.text}")
    token_json = token_resp.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="카카오 액세스 토큰을 받지 못했습니다.")

    # Fetch user profile
    profile_resp = requests.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=5,
    )
    if profile_resp.status_code != 200:
        raise HTTPException(status_code=401, detail=f"카카오 프로필 조회 실패: {profile_resp.text}")
    profile = profile_resp.json()

    social_id = str(profile.get("id"))
    kakao_account = profile.get("kakao_account", {}) or {}
    profile_obj = kakao_account.get("profile") or {}
    email = kakao_account.get("email")
    nickname = profile_obj.get("nickname") or "카카오 사용자"
    email = email or f"{social_id}@kakao.connected"

    user_record = db.upsert_social_user("kakao", social_id, email, nickname)
    user = storage.ensure_user_cache(user_record)
    return {"token": _build_token(str(user_record["id"])), "user": user}


@router.delete("/me")
def delete_me(authorization: str = Header(None)):
    user_id = _parse_token(authorization)
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
    user_id = _parse_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    return {"ok": True}
