import asyncio
import unittest
from unittest.mock import patch

from app.services import incident_service, mock_data
from app.services.telemetry_service import reset_simulation, sim_state


class MockDetector:
    def predict(self, telemetry):
        return {
            "anomaly_score": 0.1,
            "raw_isolation_score": 0.1,
            "is_anomaly": False,
            "severity": "NORMAL",
            "confidence": 0.15,
            "subsystem_scores": {},
            "root_cause": "No significant anomaly",
            "root_cause_confidence": 0.3,
        }


class MockDataTests(unittest.TestCase):
    def setUp(self):
        sim_state.telemetry_history.clear()
        sim_state.current_telemetry = None
        sim_state.event_log.clear()
        sim_state.demo_data_loaded = False
        incident_service._incidents.clear()
        incident_service._events.clear()
        self.seeded_flag = patch.object(mock_data, "_seeded", False)
        self.seeded_flag.start()
        self.addCleanup(self.seeded_flag.stop)

    def tearDown(self):
        sim_state.telemetry_history.clear()
        sim_state.current_telemetry = None
        sim_state.event_log.clear()
        sim_state.demo_data_loaded = False
        incident_service._incidents.clear()
        incident_service._events.clear()

    def test_seed_populates_charts_incidents_and_timelines_once(self):
        with patch.object(mock_data, "get_detector", return_value=MockDetector()):
            result = mock_data.seed_mock_data()
            repeated_result = mock_data.seed_mock_data()

        self.assertEqual(result, {
            "seeded": True,
            "telemetry_records": mock_data.SAMPLE_COUNT,
            "incidents": 4,
        })
        self.assertFalse(repeated_result["seeded"])
        self.assertEqual(len(sim_state.telemetry_history), mock_data.SAMPLE_COUNT)
        self.assertEqual(sim_state.current_telemetry["scenario"], "normal")
        self.assertTrue(sim_state.demo_data_loaded)
        self.assertGreater(len(sim_state.event_log), 0)

        incidents = incident_service.get_all_incidents()
        self.assertEqual([item["incident_number"] for item in incidents], [
            "INC-0042",
            "INC-0041",
            "INC-0040",
            "INC-0039",
        ])
        self.assertEqual(incident_service.get_latest_incident_counter(), 42)
        for incident in incidents:
            self.assertEqual(incident["data_origin"], "SIMULATED_DEMO")
            self.assertEqual(len(incident_service.get_incident_events(incident["id"])), 4)

    def test_incident_timestamps_match_the_telemetry_episode(self):
        with patch.object(mock_data, "get_detector", return_value=MockDetector()):
            mock_data.seed_mock_data()

        for scenario in mock_data.INCIDENT_SCENARIOS:
            incident = incident_service.get_incident_by_number(
                scenario["incident_number"]
            )
            sample = list(sim_state.telemetry_history)[scenario["end"] - 1]
            self.assertEqual(incident["detected_at"], sample["timestamp"])
            self.assertTrue(incident["telemetry_snapshot"]["fault_active"])

    def test_reset_restores_the_demo_baseline(self):
        with patch.object(mock_data, "get_detector", return_value=MockDetector()):
            mock_data.seed_mock_data()
            sim_state.telemetry_history.clear()
            sim_state.current_telemetry = None
            result = asyncio.run(reset_simulation())

        self.assertEqual(result["status"], "reset")
        self.assertEqual(len(sim_state.telemetry_history), mock_data.SAMPLE_COUNT)
        self.assertEqual(len(incident_service.get_all_incidents()), 4)
        self.assertEqual(incident_service.get_latest_incident_counter(), 42)
        self.assertEqual(sim_state.event_log[-1]["type"], "INFO")


if __name__ == "__main__":
    unittest.main()
