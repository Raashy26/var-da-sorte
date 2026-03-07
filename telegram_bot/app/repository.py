from __future__ import annotations

from sqlalchemy.orm import Session

from .database import Draft, UserMode


def get_user_mode(session: Session, chat_id: str) -> str:
    row = session.get(UserMode, chat_id)
    if not row:
        return "chat"
    return row.mode


def set_user_mode(session: Session, chat_id: str, mode: str) -> None:
    row = session.get(UserMode, chat_id)
    if not row:
        row = UserMode(chat_id=chat_id, mode=mode)
        session.add(row)
    else:
        row.mode = mode
    session.commit()


def create_draft(session: Session, owner_chat_id: str, prompt: str, content: str) -> Draft:
    draft = Draft(owner_chat_id=owner_chat_id, prompt=prompt, content=content, status="draft")
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft


def get_draft(session: Session, draft_id: int) -> Draft | None:
    return session.get(Draft, draft_id)


def mark_draft_published(session: Session, draft: Draft, channel_message_id: int | None) -> None:
    draft.status = "published"
    draft.channel_message_id = channel_message_id
    session.commit()


def mark_draft_rejected(session: Session, draft: Draft) -> None:
    draft.status = "rejected"
    session.commit()
