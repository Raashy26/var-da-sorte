from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import sessionmaker

from .content_index import VarContentIndex
from .openai_client import AIService
from .repository import (
    create_draft,
    get_draft,
    get_user_mode,
    mark_draft_published,
    mark_draft_rejected,
    set_user_mode,
)
from .telegram_api import TelegramAPI

logger = logging.getLogger(__name__)


HELP_TEXT = (
    "Comandos disponiveis:\n"
    "/start - ajuda\n"
    "/mode chat|var - muda modo\n"
    "/chat <mensagem> - resposta geral\n"
    "/var <pedido> - cria rascunho VAR da Sorte\n"
    "/approve <id> - publica rascunho no canal (owner)\n"
    "/reject <id> - rejeita rascunho (owner)"
)


class BotService:
    def __init__(
        self,
        telegram_api: TelegramAPI,
        ai_service: AIService,
        content_index: VarContentIndex,
        session_factory: sessionmaker,
        owner_telegram_id: str,
        channel_id: str,
    ) -> None:
        self.telegram_api = telegram_api
        self.ai_service = ai_service
        self.content_index = content_index
        self.session_factory = session_factory
        self.owner_telegram_id = owner_telegram_id
        self.channel_id = channel_id

    async def handle_update(self, update: dict[str, Any]) -> None:
        if "message" in update:
            await self._handle_message(update["message"])
            return

        if "callback_query" in update:
            # Optional for future inline approve/reject.
            logger.info("Ignoring callback_query for now")

    async def _handle_message(self, message: dict[str, Any]) -> None:
        chat = message.get("chat", {})
        chat_id = str(chat.get("id", ""))
        chat_username = str(chat.get("username", "")).strip().lower()
        chat_type = chat.get("type", "")

        if not chat_id:
            return

        if chat_type != "private":
            await self.telegram_api.send_message(chat_id, "Este bot responde apenas em chat privado no v1.")
            return

        text = (message.get("text") or "").strip()
        if not text:
            await self.telegram_api.send_message(chat_id, "Envia texto para eu responder.")
            return

        if text.startswith("/start"):
            await self.telegram_api.send_message(chat_id, HELP_TEXT)
            return

        if text.startswith("/mode"):
            await self._command_mode(chat_id, text)
            return

        if text.startswith("/chat"):
            payload = text[len("/chat") :].strip()
            await self._reply_chat(chat_id, payload)
            return

        if text.startswith("/var"):
            payload = text[len("/var") :].strip()
            await self._reply_var(chat_id, payload)
            return

        if text.startswith("/approve"):
            await self._command_approve(chat_id, chat_username, text)
            return

        if text.startswith("/reject"):
            await self._command_reject(chat_id, chat_username, text)
            return

        with self.session_factory() as session:
            mode = get_user_mode(session, chat_id)

        if mode == "var":
            await self._reply_var(chat_id, text)
        else:
            await self._reply_chat(chat_id, text)

    async def _command_mode(self, chat_id: str, text: str) -> None:
        parts = text.split(maxsplit=1)
        if len(parts) != 2 or parts[1] not in {"chat", "var"}:
            await self.telegram_api.send_message(chat_id, "Uso: /mode chat ou /mode var")
            return

        mode = parts[1]
        with self.session_factory() as session:
            set_user_mode(session, chat_id, mode)

        await self.telegram_api.send_message(chat_id, f"Modo atualizado para: {mode}")

    async def _reply_chat(self, chat_id: str, user_text: str) -> None:
        if not user_text:
            await self.telegram_api.send_message(chat_id, "Uso: /chat <mensagem>")
            return

        reply = self.ai_service.generate_chat_reply(user_text)
        await self.telegram_api.send_message(chat_id, reply)

    async def _reply_var(self, chat_id: str, user_text: str) -> None:
        if not user_text:
            await self.telegram_api.send_message(chat_id, "Uso: /var <pedido>")
            return

        context = self.content_index.build_context()
        source_hint = "\n".join(f"- {p.name}" for p in context.source_files[:8])
        draft_text = self.ai_service.generate_var_draft(user_text, context.text)

        with self.session_factory() as session:
            draft = create_draft(session, chat_id, user_text, draft_text)

        msg = (
            f"Rascunho #{draft.id} criado:\n\n{draft_text}\n\n"
            f"Fontes usadas:\n{source_hint}\n\n"
            f"Para publicar: /approve {draft.id}\n"
            f"Para rejeitar: /reject {draft.id}"
        )
        await self.telegram_api.send_message(chat_id, msg)

    def _is_owner(self, chat_id: str, chat_username: str) -> bool:
        owner = self.owner_telegram_id.strip()
        if owner.startswith("@"):
            return bool(chat_username) and owner.lower() == f"@{chat_username}"
        return chat_id == owner

    async def _command_approve(self, chat_id: str, chat_username: str, text: str) -> None:
        if not self._is_owner(chat_id, chat_username):
            await self.telegram_api.send_message(chat_id, "Nao autorizado para aprovar/publicar.")
            return

        draft_id = self._parse_id_command(text, "/approve")
        if draft_id is None:
            await self.telegram_api.send_message(chat_id, "Uso: /approve <id>")
            return

        with self.session_factory() as session:
            draft = get_draft(session, draft_id)
            if not draft:
                await self.telegram_api.send_message(chat_id, f"Draft {draft_id} nao encontrado.")
                return
            if draft.status != "draft":
                await self.telegram_api.send_message(chat_id, f"Draft {draft_id} esta em estado '{draft.status}'.")
                return

            sent = await self.telegram_api.send_message(self.channel_id, draft.content)
            message_id = sent.get("message_id")
            mark_draft_published(session, draft, message_id)

        await self.telegram_api.send_message(
            chat_id,
            f"Draft {draft_id} publicado no canal {self.channel_id} em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        )

    async def _command_reject(self, chat_id: str, chat_username: str, text: str) -> None:
        if not self._is_owner(chat_id, chat_username):
            await self.telegram_api.send_message(chat_id, "Nao autorizado para rejeitar.")
            return

        draft_id = self._parse_id_command(text, "/reject")
        if draft_id is None:
            await self.telegram_api.send_message(chat_id, "Uso: /reject <id>")
            return

        with self.session_factory() as session:
            draft = get_draft(session, draft_id)
            if not draft:
                await self.telegram_api.send_message(chat_id, f"Draft {draft_id} nao encontrado.")
                return
            if draft.status != "draft":
                await self.telegram_api.send_message(chat_id, f"Draft {draft_id} esta em estado '{draft.status}'.")
                return
            mark_draft_rejected(session, draft)

        await self.telegram_api.send_message(chat_id, f"Draft {draft_id} rejeitado.")

    @staticmethod
    def _parse_id_command(text: str, command: str) -> int | None:
        parts = text.split(maxsplit=1)
        if len(parts) != 2:
            return None
        try:
            return int(parts[1].strip())
        except ValueError:
            return None
