from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class AuthSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nickname: Optional[str] = None
    pregnant: bool = False
    due_date: Optional[str] = None


class AuthLogin(BaseModel):
    email: EmailStr
    password: str


class SocialLogin(BaseModel):
    provider: str
    token: str

class GoogleLogin(BaseModel):
    credential: str
    is_code: bool = False


class KakaoLogin(BaseModel):
    code: str


class Todo(BaseModel):
    id: str
    text: str
    date: str
    completed: bool = False


class TodoCreate(BaseModel):
    text: str
    date: str


class Supplement(BaseModel):
    id: str
    name: str
    nutrient: str
    schedule: str
    stage: str
    notes: Optional[str] = None


class SupplementCreate(BaseModel):
    name: str
    nutrient: Optional[str] = None
    schedule: str
    stage: str = "사용자 지정"
    notes: Optional[str] = None


class DatePayload(BaseModel):
    startDate: Optional[str] = None
    dueDate: Optional[str] = None


class ProfilePayload(BaseModel):
    height: Optional[float] = None
    preWeight: Optional[float] = None
    currentWeight: Optional[float] = None


class NotificationPayload(BaseModel):
    notifications: List[str]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    matched: Optional[str] = None
