import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from fastapi import HTTPException
import db

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

def _require_env(var_name: str, value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=500, detail=f"{var_name} is not configured.")
    return value

def build_token(user_id: str | int) -> str:
    return f"token-{user_id}"

def parse_token(token: str | None) -> str | None:
    if not token:
        return None
    token = token.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    return token.split("token-", 1)[1]

def verify_google_token(credential: str, is_code: bool) -> dict:
    google_client_id = _require_env("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID)
    
    if is_code:
        google_client_secret = _require_env("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET)
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": credential,
                "client_id": google_client_id,
                "client_secret": google_client_secret,
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
            idinfo = id_token.verify_oauth2_token(id_token_value, grequests.Request(), google_client_id)
        except Exception:
            raise HTTPException(status_code=401, detail="구글 ID 토큰 검증에 실패했습니다.")
    else:
        try:
            idinfo = id_token.verify_oauth2_token(credential, grequests.Request(), google_client_id)
        except Exception:
            raise HTTPException(status_code=401, detail="유효하지 않은 구글 토큰입니다.")
            
    return idinfo

def verify_kakao_token(code: str) -> dict:
    kakao_client_id = _require_env("KAKAO_CLIENT_ID", KAKAO_CLIENT_ID)
    kakao_redirect_uri = _require_env("KAKAO_REDIRECT_URI", KAKAO_REDIRECT_URI)
    
    token_data = {
        "grant_type": "authorization_code",
        "client_id": kakao_client_id,
        "redirect_uri": kakao_redirect_uri,
        "code": code,
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

    profile_resp = requests.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=5,
    )
    if profile_resp.status_code != 200:
        raise HTTPException(status_code=401, detail=f"카카오 프로필 조회 실패: {profile_resp.text}")
        
    return profile_resp.json()

def handle_social_login(provider: str, social_id: str, email: str, nickname: str) -> dict:
    user_record = db.upsert_social_user(provider, social_id, email, nickname)
    return user_record
