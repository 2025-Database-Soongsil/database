from __future__ import annotations
from presets import nutrient_catalog
import storage
import uuid
from fastapi import HTTPException

def add_recommended_supplement(user_id: str, nutrient_id: str, supplement_id: str):
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
    storage.add_supplement(user_id, payload)
    return payload
