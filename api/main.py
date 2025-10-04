from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from scout_prompt_processor import ScoutPromptProcessor

app = FastAPI(title="Scout Prompt Processor API")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None


class ChatSessionPayload(BaseModel):
    session_id: Optional[str] = Field(
        default=None,
        description="Unique identifier for the active chat session",
    )
    messages: List[ChatMessage] = Field(
        default_factory=list,
        description="Chronological chat transcript shared by the web client",
        min_length=1,
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Optional OpenHands API key override for this request",
    )
    use_full_history: bool = Field(
        default=False,
        description="When true, concatenate all user messages before processing",
    )
    prompt_override: Optional[str] = Field(
        default=None,
        description="Optional prompt to send directly to the Scout processor instead of deriving from chat history",
    )


class ProcessedResponse(BaseModel):
    session_id: Optional[str]
    prompt: str
    parameters: Dict[str, Any]
    meta: Dict[str, Any]


_processor_cache: Dict[str, ScoutPromptProcessor] = {}


def _get_processor(api_key: Optional[str]) -> ScoutPromptProcessor:
    cache_key = api_key or "__default__"
    if cache_key not in _processor_cache:
        _processor_cache[cache_key] = ScoutPromptProcessor(api_key=api_key)
    return _processor_cache[cache_key]


@app.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/scout/process", response_model=ProcessedResponse)
async def process_chat_session(payload: ChatSessionPayload) -> ProcessedResponse:
    user_messages = [msg for msg in payload.messages if msg.role == "user" and msg.content.strip()]

    if not user_messages:
        raise HTTPException(status_code=400, detail="At least one user message with content is required.")

    if payload.prompt_override and payload.prompt_override.strip():
        prompt = payload.prompt_override.strip()
    elif payload.use_full_history:
        prompt = "\n".join(msg.content.strip() for msg in user_messages)
    else:
        prompt = user_messages[-1].content.strip()

    processor = _get_processor(payload.api_key)
    params = processor.extract_search_parameters(prompt)
    params_dict = processor.to_dict(params)

    used_openhands = processor.agent is not None

    meta = {
        "messages_received": len(payload.messages),
        "user_messages_processed": len(user_messages),
        "used_full_history": payload.use_full_history,
        "used_openhands": used_openhands,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "prompt_override_used": bool(payload.prompt_override and payload.prompt_override.strip()),
    }

    return ProcessedResponse(
        session_id=payload.session_id,
        prompt=prompt,
        parameters=params_dict,
        meta=meta,
    )
