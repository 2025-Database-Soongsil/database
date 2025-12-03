from __future__ import annotations
import db
import uuid
from fastapi import HTTPException

def add_recommended_supplement(user_id: str | int, nutrient_id: str, supplement_id: str):
    # supplement_id from frontend might be string (from presets) or int (from DB)
    # If it's a string that parses to int, we assume it's a DB ID.
    # If it's a string like "folic800", it's from presets and we can't link it to DB table easily unless we map it.
    # However, since we are moving to DB, we should assume the frontend is sending DB IDs if it fetched from DB.
    # But currently frontend might still be using presets for Catalog.
    # If so, we can't add it to UserSupplement (FK constraint).
    # We must add it as CustomSupplement.
    
    # Try to parse as int
    try:
        sup_id_int = int(supplement_id)
        # Check if it exists in DB
        sup = db.fetch_supplement_by_id(sup_id_int)
        if sup:
            return db.add_user_supplement(int(user_id), sup_id_int)
    except ValueError:
        pass

    # If we are here, it's a preset string ID or DB lookup failed.
    # We should look it up in presets to get details and add as CustomSupplement.
    from presets import nutrient_catalog
    nutrient = next((item for item in nutrient_catalog if item["id"] == nutrient_id), None)
    if not nutrient:
        raise HTTPException(status_code=404, detail="영양소를 찾을 수 없습니다.")
    
    supplement = next((item for item in nutrient["supplements"] if item["id"] == supplement_id), None)
    if not supplement:
        raise HTTPException(status_code=404, detail="영양제 옵션을 찾을 수 없습니다.")
    
    # Add as CustomSupplement
    # We map 'schedule' to 'note' or 'time_of_day' if possible.
    # CustomSupplement: name, cycle, time_of_day, note
    return db.add_custom_supplement(
        user_id=int(user_id),
        name=supplement["name"],
        schedule=supplement["schedule"],
        notes=supplement.get("caution")
    )
