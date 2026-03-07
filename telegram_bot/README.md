# ZeDaTasca Telegram Bot (Zero Custo: ngrok + Ollama)

Bot de Telegram com 2 modos:
- `chat`: conversa geral
- `var`: gera rascunhos para o projeto VAR da Sorte com base no conteudo local em `../src`

Publicacao no canal usa aprovacao manual:
1. criar rascunho (`/var ...`)
2. aprovar (`/approve <id>`) para publicar

## Como funciona no modo zero custo

- Hosting: local no teu PC (sem Railway)
- Tunnel HTTPS: `ngrok` free
- IA: `Ollama` local (sem custo por token)

Importante: o bot so funciona enquanto o teu PC estiver ligado com os processos ativos.

## Requisitos

- Python 3.11+
- `pip` e `venv`
- `ngrok` instalado e autenticado (`ngrok config add-authtoken ...`)
- `ollama` instalado
- Bot Telegram criado no BotFather

## Setup

```bash
cd telegram_bot
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

## Configuracao `.env`

Campos principais para zero custo:

```env
TELEGRAM_BOT_TOKEN=<novo_token_do_botfather>
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
BOT_OWNER_TELEGRAM_ID=<teu_telegram_user_id_numerico_ou_@teu_username>
TELEGRAM_CHANNEL_ID=@vardasorte
DATABASE_URL=sqlite:///./telegram_bot.db
VAR_CONTENT_ROOT=../src
```

Notas:
- `BOT_OWNER_TELEGRAM_ID` pode ser ID numerico ou `@username` (recomendado: ID numerico via `@userinfobot`).
- `OPENAI_API_KEY` e `OPENAI_MODEL` sao opcionais no modo `ollama`.

## Preparar Ollama

```bash
ollama serve
ollama pull qwen2.5:3b
```

Se quiseres outro modelo, atualiza `OLLAMA_MODEL` no `.env`.

## Arranque completo (recomendado)

Com um comando, arranca API local, ngrok e configura webhook Telegram:

```bash
cd telegram_bot
export TELEGRAM_BOT_TOKEN=...
./scripts/run_local_stack.sh
```

## Verificacoes

```bash
cd telegram_bot
export TELEGRAM_BOT_TOKEN=...
./scripts/check_stack.sh
```

## Comandos do bot

- `/start`
- `/mode chat`
- `/mode var`
- `/chat <texto>`
- `/var <pedido>`
- `/approve <id>` (apenas owner)
- `/reject <id>` (apenas owner)

## Scripts auxiliares

- `scripts/run_local_stack.sh`: sobe uvicorn + ngrok e configura webhook
- `scripts/set_webhook.sh`: define webhook manualmente via `WEBHOOK_BASE_URL`
- `scripts/get_webhook_info.sh`: consulta webhook atual
- `scripts/check_stack.sh`: diagnostico rapido local + ngrok + Telegram

## Seguranca

- Nunca commits de `.env`
- Se token vazar, usar BotFather `/revoke` e gerar novo
- Mantem `BOT_OWNER_TELEGRAM_ID` correto para proteger `/approve` e `/reject`
