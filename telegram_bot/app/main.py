from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request

from .bot_service import BotService
from .config import Settings, load_settings
from .content_index import VarContentIndex
from .database import build_session_factory
from .openai_client import AIService
from .telegram_api import TelegramAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ZeDaTasca Telegram Bot", version="1.1.0")


class Container:
    settings: Settings
    bot_service: BotService


container = Container()


@app.on_event("startup")
def startup() -> None:
    settings = load_settings()
    session_factory = build_session_factory(settings.database_url)

    telegram_api = TelegramAPI(settings.telegram_bot_token)
    ai_service = AIService(
        provider=settings.ai_provider,
        ollama_base_url=settings.ollama_base_url,
        ollama_model=settings.ollama_model,
        openai_model=settings.openai_model,
        openai_api_key=settings.openai_api_key or None,
    )
    ai_service.healthcheck()

    content_index = VarContentIndex(settings.var_content_root)

    bot_service = BotService(
        telegram_api=telegram_api,
        ai_service=ai_service,
        content_index=content_index,
        session_factory=session_factory,
        owner_telegram_id=settings.bot_owner_telegram_id,
        channel_id=settings.telegram_channel_id,
    )

    container.settings = settings
    container.bot_service = bot_service
    logger.info("Bot startup complete with provider=%s", settings.ai_provider)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request) -> dict[str, bool]:
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {exc}") from exc

    await container.bot_service.handle_update(payload)
    return {"ok": True}
