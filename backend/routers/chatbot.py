from fastapi import APIRouter
from models import ChatRequest, ChatResponse
from presets import chatbot_hints

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/query", response_model=ChatResponse)
def query(payload: ChatRequest):
    matched = next((item for item in chatbot_hints if item["keyword"] in payload.message), None)
    reply = matched["reply"] if matched else "지금 단계에 맞는 할 일과 알림을 자동으로 정리해 둘게요."
    return ChatResponse(reply=reply, matched=matched["keyword"] if matched else None)
