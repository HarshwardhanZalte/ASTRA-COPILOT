import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.rag.copilot import _generate_llm_response


class FakeGeminiAsyncClient:
    def __init__(self):
        self.models = self
        self.request = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return None

    async def generate_content(self, **request):
        self.request = request
        return SimpleNamespace(
            text=(
                '{"claims":[{"kind":"recommendation",'
                '"text":"Verify battery voltage using an independent sensor.",'
                '"citation_ids":["C1"]}]}'
            )
        )


class GeminiCopilotTests(unittest.IsolatedAsyncioTestCase):
    async def test_response_uses_configured_gemini_model_and_parses_json(self):
        async_client = FakeGeminiAsyncClient()
        client = SimpleNamespace(aio=async_client)
        incident = {
            "incident_number": "INC-0001",
            "root_cause": "Battery degradation",
            "root_cause_confidence": 0.9,
            "severity": "HIGH",
        }
        docs = [{
            "doc_id": "power_management",
            "source_id": "power_management",
            "citation_id": "C1",
            "doc_type": "procedure",
            "title": "Power Management Procedure",
            "similarity_score": 0.8,
            "content": "Verify battery voltage using an independent sensor.",
        }]
        citations = [{
            "id": "C1",
            "source_id": "power_management",
            "source_type": "procedure",
            "title": "Power Management Procedure",
            "excerpt": docs[0]["content"],
            "relevance_score": 0.8,
        }]

        with (
            patch("app.rag.copilot.settings.GEMINI_API_KEY", "test-gemini-key"),
            patch("google.genai.Client", return_value=client) as client_factory,
        ):
            result = await _generate_llm_response(
                "What should I investigate?",
                incident,
                docs,
                [],
                citations,
                None,
            )

        client_factory.assert_called_once()
        self.assertEqual(
            client_factory.call_args.kwargs["api_key"],
            "test-gemini-key",
        )
        self.assertEqual(async_client.request["model"], "gemini-2.5-flash")
        self.assertEqual(
            async_client.request["contents"],
            '{"question": "What should I investigate?", "conversation_history": []}',
        )
        self.assertEqual(result["mode"], "GEMINI")
        self.assertEqual(result["root_cause"], "Battery degradation")
        self.assertEqual(result["sources"], ["power_management"])
        self.assertEqual(result["grounded_claims"][0]["citation_ids"], ["C1"])


if __name__ == "__main__":
    unittest.main()
