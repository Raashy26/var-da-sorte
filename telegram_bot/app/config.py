from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    telegram_bot_token: str
    ai_provider: str
    ollama_base_url: str
    ollama_model: str
    openai_api_key: str
    openai_model: str
    bot_owner_telegram_id: str
    telegram_channel_id: str
    database_url: str
    var_content_root: Path


def _default_content_root() -> Path:
    # Default points to VAR_da_sorte/src when running inside telegram_bot/
    return (Path(__file__).resolve().parents[2] / "src").resolve()


def load_settings() -> Settings:
    load_dotenv()

    telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not telegram_bot_token:
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN")

    ai_provider = os.getenv("AI_PROVIDER", "ollama").strip().lower()
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip()
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b").strip()

    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()

    if ai_provider == "openai" and not openai_api_key:
        raise RuntimeError("Missing OPENAI_API_KEY when AI_PROVIDER=openai")
    if ai_provider not in {"ollama", "openai"}:
        raise RuntimeError("AI_PROVIDER must be 'ollama' or 'openai'")

    bot_owner_telegram_id = os.getenv("BOT_OWNER_TELEGRAM_ID", "").strip()
    telegram_channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "").strip()
    database_url = os.getenv("DATABASE_URL", "sqlite:///./telegram_bot.db").strip()

    content_root_env = os.getenv("VAR_CONTENT_ROOT", "").strip()
    var_content_root = Path(content_root_env).resolve() if content_root_env else _default_content_root()

    if not bot_owner_telegram_id:
        raise RuntimeError("Missing BOT_OWNER_TELEGRAM_ID")
    if not telegram_channel_id:
        raise RuntimeError("Missing TELEGRAM_CHANNEL_ID")

    return Settings(
        telegram_bot_token=telegram_bot_token,
        ai_provider=ai_provider,
        ollama_base_url=ollama_base_url,
        ollama_model=ollama_model,
        openai_api_key=openai_api_key,
        openai_model=openai_model,
        bot_owner_telegram_id=bot_owner_telegram_id,
        telegram_channel_id=telegram_channel_id,
        database_url=database_url,
        var_content_root=var_content_root,
    )
