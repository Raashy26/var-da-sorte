from __future__ import annotations

from typing import Any

import httpx
from openai import OpenAI


class AIService:
    def __init__(
        self,
        provider: str,
        ollama_base_url: str,
        ollama_model: str,
        openai_model: str,
        openai_api_key: str | None = None,
    ) -> None:
        self.provider = provider
        self.ollama_base_url = ollama_base_url.rstrip("/")
        self.ollama_model = ollama_model
        self.openai_model = openai_model
        self.openai_client = OpenAI(api_key=openai_api_key) if provider == "openai" else None

    def healthcheck(self) -> None:
        if self.provider == "ollama":
            with httpx.Client(timeout=10) as client:
                response = client.get(f"{self.ollama_base_url}/api/tags")
                response.raise_for_status()
            return

        if self.provider == "openai":
            if not self.openai_client:
                raise RuntimeError("OpenAI client is not configured")
            return

        raise RuntimeError(f"Unsupported AI_PROVIDER: {self.provider}")

    def generate_chat_reply(self, user_message: str) -> str:
        system_prompt = (
            "You are ZeDaTasca assistant. Reply in European Portuguese, concise and practical. "
            "If the user asks for risky topics (betting/finance), avoid guaranteed outcomes."
        )
        return self._generate(system_prompt, user_message)

    def generate_var_draft(self, user_request: str, var_context: str) -> str:
        system_prompt = (
            "You write Telegram posts for project VAR da Sorte. "
            "Language: European Portuguese. Tone: confident but responsible. "
            "Do not promise profits. Include a short responsible-gambling reminder (+18)."
        )
        user_prompt = (
            f"Pedido do criador: {user_request}\n\n"
            f"Contexto recente do projeto:\n{var_context}\n\n"
            "Entrega um rascunho curto (max 1200 chars), com call-to-action para o site/canal."
        )
        return self._generate(system_prompt, user_prompt)

    def _generate(self, system_prompt: str, user_prompt: str) -> str:
        if self.provider == "ollama":
            return self._generate_ollama(system_prompt, user_prompt)
        if self.provider == "openai":
            return self._generate_openai(system_prompt, user_prompt)
        raise RuntimeError(f"Unsupported AI_PROVIDER: {self.provider}")

    def _generate_openai(self, system_prompt: str, user_prompt: str) -> str:
        if not self.openai_client:
            raise RuntimeError("OpenAI client is not configured")

        response = self.openai_client.responses.create(
            model=self.openai_model,
            input=[
                {
                    "role": "system",
                    "content": [{"type": "text", "text": system_prompt}],
                },
                {
                    "role": "user",
                    "content": [{"type": "text", "text": user_prompt}],
                },
            ],
        )
        return response.output_text.strip()

    def _generate_ollama(self, system_prompt: str, user_prompt: str) -> str:
        payload: dict[str, Any] = {
            "model": self.ollama_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "options": {
                "temperature": 0.6,
            },
        }

        with httpx.Client(timeout=120) as client:
            response = client.post(f"{self.ollama_base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "").strip()
        if not content:
            raise RuntimeError("Ollama returned empty content")
        return content
