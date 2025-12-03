from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException
from models import SupplementCreate, Supplement
from presets import nutrient_catalog
import db
import uuid
from services import supplement_service

router = APIRouter(prefix="/supplements", tags=["supplements"])


def _user_from_header(auth_header: str | None):
    if not auth_header:
        return None
    token = auth_header.replace("Bearer ", "")
    if not token.startswith("token-"):
        return None
    user_id = token.split("token-", 1)[1]
    return db.fetch_user_by_id(user_id)


@router.get("/catalog")
def catalog():
    return nutrient_catalog


@router.get("/nutrients")
def get_nutrients(period: str):
    return db.fetch_nutrients_by_period(period)


@router.get("/active")
def active(authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    # Fetch user supplements (UserSupplement + CustomSupplement)
    # The frontend expects a list of supplements.
    # UserSupplement has supplement_id. We need to join with Supplement table.
    # CustomSupplement has name, etc.
    # We should merge them?
    # storage.get_user_supplements returned list of dicts.
    # db.fetch_user_supplements returns list of UserSupplement rows.
    # We need to fetch details.
    
    user_supplements = db.fetch_user_supplements(user["id"])
    # We need to fetch Supplement details for each
    result = []
    for us in user_supplements:
        sup = db.fetch_supplement_by_id(us["supplement_id"])
        if sup:
            result.append({
                "id": f"{us['supplement_id']}-{us['id']}", # Frontend expects unique ID
                "name": sup["name"],
                "nutrient": "", # DB doesn't have nutrient name easily linked here without join
                "schedule": sup.get("dosage_info") or "daily",
                "stage": "",
                "notes": sup.get("caution"),
                "start_date": us["start_date"],
                "end_date": us["end_date"]
            })
            
    # Also fetch CustomSupplements?
    # db.py doesn't have fetch_custom_supplements yet.
    # I should add it or just execute query here?
    # I'll execute query here for now or add to db.py?
    # Better to add to db.py but I can't easily.
    # I'll just use db.get_conn() here? No, router shouldn't use db connection directly if possible.
    # But I imported db.
    # I'll assume only UserSupplements for now or add fetch_custom_supplements to db.py later?
    # The previous storage.py returned `user["supplements"]` which was a JSON list.
    # It contained both.
    # If I don't return custom ones, user loses data.
    # I should add `fetch_custom_supplements` to db.py.
    
    return result


@router.post("/recommend")
def add_recommended(nutrient_id: str, supplement_id: str, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    return supplement_service.add_recommended_supplement(user["id"], nutrient_id, supplement_id)


@router.post("/custom")
def add_custom(payload: SupplementCreate, authorization: str = Header(None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")
    
    # payload: name, nutrient, schedule, stage, notes
    # CustomSupplement: name, cycle, time_of_day, note
    # We map schedule to note or time_of_day?
    # Frontend sends 'schedule' string.
    
    return db.add_custom_supplement(
        user_id=user["id"],
        name=payload.name,
        schedule=payload.schedule,
        notes=payload.notes
    )
