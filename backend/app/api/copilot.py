from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.rag.copilot import generate_copilot_response
from app.services.incident_service import get_incident, get_all_incidents
from app.config import settings

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class ChatRequest(BaseModel):
    question: str
    incident_id: Optional[str] = None
    conversation_history: Optional[List] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    incident = None
    if request.incident_id:
        incident = get_incident(request.incident_id)

    if incident is None:
        incidents = get_all_incidents()
        if incidents:
            incident = incidents[0]

    response = await generate_copilot_response(
        question=request.question,
        incident=incident,
        conversation_history=request.conversation_history
    )

    return {
        "question": request.question,
        "response": response,
        "copilot_mode": "GEMINI" if settings.GEMINI_API_KEY else "DEMO",
        "incident_id": incident["id"] if incident else None
    }

@router.get("/mode")
async def get_mode():
    return {
        "mode": "GEMINI" if settings.GEMINI_API_KEY else "DEMO",
        "model": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else None,
        "embedding_model": settings.EMBEDDING_MODEL
    }
