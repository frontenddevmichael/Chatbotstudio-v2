from __future__ import annotations

import html
from typing import Optional


class ChatBotWidget:
    """Generates the embed snippet for a ChatBot Studio widget."""

    def __init__(
        self,
        embed_token: str,
        base_url: str = "https://[project].supabase.co",
        theme: Optional[str] = None,
        primary_color: Optional[str] = None,
        position: str = "bottom-right",
        exit_intent: bool = False,
        scroll_trigger: int = 0,
        auto_open_delay: int = 0,
        language: Optional[str] = None,
        voice_enabled: bool = True,
    ):
        self.embed_token = embed_token
        self.base_url = base_url.rstrip("/")
        self.theme = theme
        self.primary_color = primary_color
        self.position = position
        self.exit_intent = exit_intent
        self.scroll_trigger = scroll_trigger
        self.auto_open_delay = auto_open_delay
        self.language = language
        self.voice_enabled = voice_enabled

    def render(self) -> str:
        attrs = {
            "data-chatbot-token": self.embed_token,
            "data-position": self.position,
            "data-voice-enabled": str(self.voice_enabled).lower(),
        }
        if self.theme:
            attrs["data-theme"] = self.theme
        if self.primary_color:
            attrs["data-primary-color"] = self.primary_color
        if self.scroll_trigger > 0:
            attrs["data-scroll-trigger"] = str(self.scroll_trigger)
        if self.auto_open_delay > 0:
            attrs["data-auto-open"] = str(self.auto_open_delay * 1000)
        if self.language:
            attrs["data-language"] = self.language

        attr_str = " ".join(f'{k}="{html.escape(v)}"' for k, v in attrs.items())
        script_src = f"{self.base_url}/embed.js"

        return f'<div id="cbs-widget" {attr_str}></div>\n<script src="{script_src}" defer></script>'

    def render_html(self) -> str:
        return f"<!DOCTYPE html>\n<html><head><meta charset='utf-8'></head><body>\n{self.render()}\n</body></html>"
