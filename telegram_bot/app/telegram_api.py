from __future__ import annotations

from typing import Any

import httpx


class TelegramAPI:
    def __init__(self, bot_token: str) -> None:
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(
        self,
        chat_id: str | int,
        text: str,
        parse_mode: str | None = None,
        reply_markup: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"chat_id": str(chat_id), "text": text}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(f"{self.base_url}/sendMessage", json=payload)
            response.raise_for_status()
            data = response.json()
            if not data.get("ok"):
                raise RuntimeError(f"Telegram sendMessage failed: {data}")
            return data["result"]

    async def set_webhook(self, webhook_url: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/setWebhook",
                json={"url": webhook_url},
            )
            response.raise_for_status()
            return response.json()
