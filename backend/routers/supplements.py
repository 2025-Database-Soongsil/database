from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import SupplementCreate, Supplement
from presets import nutrient_catalog
import storage
import uuid

router = APIRouter(prefix="/supplements", tags=["supplements"])


def _user_from_header(auth_header: str | None):
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    user_id = token.split("token-", 1)[1]
    return storage.get_user(user_id)


@router.get("/catalog")
def catalog():
    return nutrient_catalog


@router.get("/active")
def active(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    return user["supplements"]


@router.post("/recommend")
def add_recommended(nutrient_id: str, supplement_id: str, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    nutrient = next((item for item in nutrient_catalog if item["id"] == nutrient_id), None)
    if not nutrient:
        raise HTTPException(status_code=404, detail="영양소를 찾을 수 없습니다.")
    supplement = next((item for item in nutrient["supplements"] if item["id"] == supplement_id), None)
    if not supplement:
        raise HTTPException(status_code=404, detail="영양제 옵션을 찾을 수 없습니다.")
    payload = {
        "id": f"{supplement_id}-{uuid.uuid4()}",
        "name": supplement["name"],
        "nutrient": nutrient["nutrient"],
        "schedule": supplement["schedule"],
        "stage": nutrient["stage"],
        "notes": supplement.get("caution"),
    }
    storage.add_supplement(user["id"], payload)
    return payload


@router.post("/custom")
def add_custom(payload: SupplementCreate, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    supplement = Supplement(id=str(uuid.uuid4()), **payload.model_dump())
    storage.add_supplement(user["id"], supplement.model_dump())
    return supplement
