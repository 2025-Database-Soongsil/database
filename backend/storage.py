import uuid
from datetime import datetime
from typing import Dict, List

# This is a simple in-memory store for demo purposes.
users: Dict[str, dict] = {}
auth_index: Dict[str, str] = {}

def create_user(email: str, password: str, nickname: str = "준비맘", pregnant: bool = False):
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    users[user_id] = {
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
