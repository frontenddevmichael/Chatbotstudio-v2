from __future__ import annotations

import json
import uuid
from typing import Any, Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError


class ChatBotStudioClient:
    """Client for the ChatBot Studio REST API."""

    def __init__(self, api_key: str, base_url: str = "https://[project].supabase.co/functions/v1/rest-api"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> dict:
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode() if body else None
        req = Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.api_key}")
        req.add_header("Content-Type", "application/json")
        try:
            with urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            return {"error": str(e), "status": e.code}

    def list_chatbots(self) -> list[dict]:
        return self._request("GET", "/chatbots").get("data", [])

    def get_chatbot(self, chatbot_id: str) -> Optional[dict]:
        return self._request("GET", f"/chatbots/{chatbot_id}").get("data")

    def send_message(self, chatbot_id: str, message: str, session_id: Optional[str] = None, **kwargs) -> dict:
        body = {
            "message": message,
            "session_id": session_id or str(uuid.uuid4()),
            **kwargs,
        }
        return self._request("POST", f"/chatbots/{chatbot_id}/chat", body)

    def list_faqs(self, chatbot_id: str) -> list[dict]:
        return self._request("GET", f"/chatbots/{chatbot_id}/faqs").get("data", [])

    def create_faq(self, chatbot_id: str, question: str, answer: str, variations: Optional[list[str]] = None) -> Optional[dict]:
        return self._request("POST", f"/chatbots/{chatbot_id}/faqs", {
            "question": question,
            "answer": answer,
            "variations": variations or [],
        }).get("data")

    def list_conversations(self, chatbot_id: str) -> list[dict]:
        return self._request("GET", f"/chatbots/{chatbot_id}/conversations").get("data", [])

    def get_analytics(self, chatbot_id: str) -> dict:
        return self._request("GET", f"/chatbots/{chatbot_id}/analytics").get("data", {})
