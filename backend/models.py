from __future__ import annotations

from datetime import datetime, time
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


class UserSetting(BaseModel):
    user_id: int
    notification_enabled: bool
    default_notify_time: Optional[time] = None
    language: str = "ko"


class TimePayload(BaseModel):
    time: str # HH:MM


class TogglePayload(BaseModel):
    enabled: bool


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
    stage: str = "custom"
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


class SupplementInfo(BaseModel):
    name: str
    time: Optional[time] = None


class CalendarDayInfo(BaseModel):
    date: str
    supplements: List[SupplementInfo] = Field(default_factory=list)
    todos: List[Todo] = Field(default_factory=list)
    pregnancyPhase: Optional[str] = None
    menstrualPhase: Optional[str] = None


class NotificationOut(BaseModel):
    id: int
    event_id: int
    notify_time: datetime
    is_sent: bool
    title: str
    user_id: int
