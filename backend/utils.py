from __future__ import annotations
from datetime import datetime
from presets import stages


def format_date(dt: datetime):
    return dt.strftime("%Y-%m-%d")


def calculate_stage(start_date: str | None, due_date: str | None):
    if not start_date or not due_date:
        return {
            "label": "일정을 입력해주세요",
            "description": "시작일과 예정일을 입력하면 단계가 계산됩니다.",
            "daysUntil": None,
            "daysToDue": None,
            "timeline": [dict(stage, active=False) for stage in stages],
        }

    today = datetime.utcnow().date()
    start = datetime.fromisoformat(start_date).date()
    due = datetime.fromisoformat(due_date).date()
    day_diff = (start - today).days
    days_to_due = (due - today).days

    if day_diff > 90:
        label = "기초 준비기"
        description = "생활 습관을 조정하고 몸 상태를 정비하세요."
    elif day_diff > 30:
        label = "집중 준비기"
        description = "배란 주기 유지와 검진 일정을 챙겨보세요."
    elif day_diff >= 0:
        label = "임박기"
        description = "휴식과 수분 섭취, 일정한 수면 리듬을 유지하세요."
    else:
        label = "임신 진행 중"
        description = "임신 주차 정보를 기반으로 영양과 검사를 관리하세요."

    timeline = []
    for stage in stages:
        timeline.append({**stage, "active": stage["label"] == label})

    return {
        "label": label,
        "description": description,
        "daysUntil": day_diff,
        "daysToDue": days_to_due,
        "timeline": timeline,
    }


def weight_status(height: float | None, pre_weight: float | None, current_weight: float | None):
    if not height or not pre_weight or not current_weight:
        return None
    bmi = pre_weight / ((height / 100) ** 2)
    if bmi < 18.5:
        target = (12.5, 18)
    elif bmi < 25:
        target = (11.5, 16)
    elif bmi < 30:
        target = (7, 11.5)
    else:
        target = (5, 9)

    gained = current_weight - pre_weight
    if gained < target[0]:
        message = "조금 더 에너지를 보충해도 괜찮아요."
    elif gained > target[1]:
        message = "증가 폭이 빠릅니다. 담당의와 상의하세요."
    else:
        message = "안정적인 범위예요."

    return {
        "bmi": round(bmi, 1),
        "gained": round(gained, 1),
        "target": f"{target[0]}kg ~ {target[1]}kg",
        "message": message,
    }
