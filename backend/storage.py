import uuid
from datetime import datetime
from typing import Dict, List

# This is a simple in-memory store for demo purposes.
users: Dict[str, dict] = {}
auth_index: Dict[str, str] = {}

def _build_user_dict(user_id: str, email: str, password: str | None, nickname: str | None, pregnant: bool, created_at: str | None = None):
    now = created_at or datetime.utcnow().isoformat()
    return {
        "id": user_id,
        "email": email,
        "password": password,
        "nickname": nickname or "준비맘",
        "pregnant": pregnant,
        "created_at": now,
        "dates": {"startDate": None, "dueDate": None},
        "supplements": [],
        "todos": [],
        "notifications": ["08:00", "21:00"],
        "profile": {"height": None, "preWeight": None, "currentWeight": None},
    }

def create_user(email: str, password: str, nickname: str = "준비맘", pregnant: bool = False):
    user_id = str(uuid.uuid4())
    users[user_id] = _build_user_dict(user_id, email, password, nickname, pregnant)
    auth_index[email] = user_id
    return users[user_id]

def get_user_by_email(email: str):
    user_id = auth_index.get(email)
    if not user_id:
        return None
    return users.get(user_id)

def get_user(user_id: str):
    return users.get(user_id)

def upsert_todo(user_id: str, todo: dict):
    store = users[user_id]["todos"]
    store.append(todo)
    return todo

def replace_todos(user_id: str, todos: List[dict]):
    users[user_id]["todos"] = todos
    return todos

def add_supplement(user_id: str, supplement: dict):
    users[user_id]["supplements"].append(supplement)
    return supplement

def set_dates(user_id: str, start_date: str, due_date: str):
    users[user_id]["dates"] = {"startDate": start_date, "dueDate": due_date}
    return users[user_id]["dates"]

def update_profile(user_id: str, payload: dict):
    users[user_id]["profile"].update(payload)
    return users[user_id]["profile"]

def set_notifications(user_id: str, notifications: List[str]):
    users[user_id]["notifications"] = notifications
    return notifications

def reset_user(user_id: str):
    if user_id not in users:
        return
    email = users[user_id]["email"]
    users.pop(user_id)
    if email in auth_index:
        auth_index.pop(email)

def ensure_user_cache(user_record: dict):
    """
    Ensure a DB user is represented in the in-memory cache for downstream routes.
    """
    user_id = str(user_record["id"])
    if user_id in users:
        return users[user_id]

    created_at = user_record.get("created_at")
    if hasattr(created_at, "isoformat"):
        created_at = created_at.isoformat()

    user = _build_user_dict(
        user_id=user_id,
        email=user_record.get("email", ""),
        password=user_record.get("password"),
        nickname=user_record.get("nickname"),
        pregnant=bool(user_record.get("is_pregnant", False)),
        created_at=created_at,
    )
    users[user_id] = user
    if user["email"]:
        auth_index[user["email"]] = user_id
    return user
