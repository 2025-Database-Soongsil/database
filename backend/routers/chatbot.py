from fastapi import APIRouter, HTTPException
from models import ChatRequest, ChatResponse
from services.chatbot_service import ChatbotInitError, get_chatbot_engine

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/query", response_model=ChatResponse)
async def query(payload: ChatRequest):
    try:
        engine = get_chatbot_engine()
    except ChatbotInitError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        reply = await engine.aask(payload.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="챗봇 응답 생성 중 오류가 발생했습니다.") from exc

    return ChatResponse(reply=reply, matched=None)
