import unittest
from unittest.mock import patch

from app.rag.copilot import generate_copilot_response


class CopilotGroundingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.incident = {
            "id": "incident-1",
            "incident_number": "INC-0001",
            "root_cause": "Battery degradation",
            "root_cause_confidence": 0.8,
            "severity": "HIGH",
            "status": "OPEN",
            "subsystem_scores": {"power": 0.9},
            "telemetry_snapshot": {
                "battery_voltage": 25.0,
                "battery_current": 7.0,
                "battery_temperature": 38.0,
            },
            "recommendations": ["Uncited stored recommendation should not be shown."],
        }
        self.docs = [{
            "id": "power_management#chunk-001",
            "doc_id": "power_management",
            "source_id": "power_management",
            "title": "Power Management and Battery Recovery Procedure",
            "doc_type": "procedure",
            "subsystem": "power",
            "chunk_index": 1,
            "similarity_score": 0.8,
            "lexical_score": 0.6,
            "content": (
                "Step 1: Verify battery voltage using an independent sensor.\n"
                "Action 2: Review the solar charging telemetry."
            ),
        }]

    async def test_relevant_answer_has_traceable_evidence_and_procedure_quotes(self):
        with (
            patch("app.rag.copilot.settings.GEMINI_API_KEY", ""),
            patch("app.rag.copilot.retrieve_for_question", return_value=self.docs),
        ):
            response = await generate_copilot_response(
                "What should the operator investigate next?",
                self.incident,
            )

        self.assertFalse(response["insufficient_evidence"])
        self.assertTrue(response["citations"])
        citation_ids = {item["id"] for item in response["citations"]}
        for claim in response["grounded_claims"]:
            self.assertTrue(set(claim["citation_ids"]).issubset(citation_ids))
        self.assertTrue(any(
            claim["kind"] == "recommendation"
            and "Step 1: Verify battery voltage" in claim["text"]
            for claim in response["grounded_claims"]
        ))
        self.assertFalse(any(
            "Uncited stored recommendation" in claim["text"]
            for claim in response["grounded_claims"]
        ))

    async def test_unrelated_question_refuses_even_with_an_active_incident(self):
        with (
            patch("app.rag.copilot.settings.GEMINI_API_KEY", ""),
            patch("app.rag.copilot.retrieve_for_question", return_value=self.docs),
        ):
            response = await generate_copilot_response(
                "What is the capital of France?",
                self.incident,
            )

        self.assertTrue(response["insufficient_evidence"])
        self.assertEqual(response["grounded_claims"], [])
        self.assertEqual(response["citations"], [])
        self.assertIn("could not find enough relevant", response["summary"])


if __name__ == "__main__":
    unittest.main()
