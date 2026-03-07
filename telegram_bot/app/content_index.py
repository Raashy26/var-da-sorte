from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class ContextBundle:
    source_files: list[Path]
    text: str


def _strip_frontmatter(md_text: str) -> str:
    if not md_text.startswith("---"):
        return md_text
    parts = md_text.split("---", 2)
    if len(parts) < 3:
        return md_text
    return parts[2].strip()


def _latest_markdown_files(path: Path, limit: int) -> list[Path]:
    if not path.exists():
        return []
    files = [p for p in path.glob("*.md") if p.is_file()]
    return sorted(files, key=lambda p: p.name, reverse=True)[:limit]


class VarContentIndex:
    def __init__(self, root: Path) -> None:
        self.root = root

    def build_context(self, per_section_limit: int = 3, max_chars: int = 10_000) -> ContextBundle:
        sources: list[Path] = []
        chunks: list[str] = []

        target_dirs = [
            self.root / "apostas",
            self.root / "desafios" / "draw",
            self.root / "desafios" / "comeback",
            self.root / "desafios" / "over25",
        ]

        for directory in target_dirs:
            latest = _latest_markdown_files(directory, per_section_limit)
            for file_path in latest:
                text = _strip_frontmatter(file_path.read_text(encoding="utf-8", errors="ignore"))
                sources.append(file_path)
                chunks.append(f"## Source: {file_path.name}\n{text.strip()}\n")

        merged = "\n".join(chunks).strip()
        if len(merged) > max_chars:
            merged = merged[:max_chars]

        return ContextBundle(source_files=sources, text=merged)
