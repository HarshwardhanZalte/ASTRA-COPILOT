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
                '{"summary":"Battery voltage is low.",'
                '"observed_facts":["Voltage below nominal."],'
                '"root_cause":"Battery degradation",'
                '"root_cause_confidence":0.9,'
                '"recommendations":["Verify the secondary sensor."],'
                '"uncertainty":"Sensor drift is not excluded.",'
                '"sources":["power_management"]}'
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
            "content": "Verify battery voltage using an independent sensor.",
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
                None,
            )

        client_factory.assert_called_once()
        self.assertEqual(
            client_factory.call_args.kwargs["api_key"],
            "test-gemini-key",
        )
        self.assertEqual(async_client.request["model"], "gemini-2.5-flash")
        self.assertEqual(async_client.request["contents"], "What should I investigate?")
        self.assertEqual(result["mode"], "GEMINI")
        self.assertEqual(result["root_cause"], "Battery degradation")
        self.assertEqual(result["sources"], ["power_management"])


if __name__ == "__main__":
    unittest.main()
