import asyncio
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.simulator.delivery import TelemetryDeliveryBuffer
from app.simulator.noise import NoiseConfig
from app.services import telemetry_service


class InferenceStub:
    def predict(self, telemetry):
        return {
            "is_anomaly": False,
            "anomaly_score": 0.1,
            "severity": "NORMAL",
            "root_cause": "No significant anomaly",
            "root_cause_confidence": 0.3,
        }


class TelemetryDeliveryTests(unittest.TestCase):
    def test_late_packet_is_flagged_and_does_not_change_event_time_order(self):
        start = datetime(2025, 1, 1)
        buffer = TelemetryDeliveryBuffer()
        packets = []
        for index in range(5):
            packets.append({
                "timestamp": (start + timedelta(seconds=index)).isoformat(),
                "data_quality": {},
            })
            buffer.enqueue(packets[-1], delay_seconds=4, now=float(index))

        first_arrivals = buffer.pop_ready(5, received_at=start + timedelta(seconds=5))
        second_arrivals = buffer.pop_ready(6, received_at=start + timedelta(seconds=6))
        later_arrivals = buffer.pop_ready(8, received_at=start + timedelta(seconds=8))
        delivered = first_arrivals + second_arrivals + later_arrivals

        self.assertEqual([p["delivery_quality"]["sequence"] for p in delivered], [1, 2, 3, 0, 4])
        self.assertEqual(delivered[3]["delivery_quality"]["status"], "OUT_OF_ORDER")
        self.assertEqual(delivered[3]["data_quality"]["delivery"], "OUT_OF_ORDER")
        self.assertEqual(buffer.out_of_order_count, 1)
        self.assertEqual(buffer.delayed_count, 5)
        self.assertEqual(buffer.pending_count, 0)

    def test_buffer_is_bounded_and_rejects_negative_delay(self):
        buffer = TelemetryDeliveryBuffer(max_pending=1)
        sample = {"timestamp": datetime(2025, 1, 1).isoformat()}
        buffer.enqueue(sample, delay_seconds=1, now=0)

        with self.assertRaises(OverflowError):
            buffer.enqueue(sample, delay_seconds=1, now=0)
        with self.assertRaises(ValueError):
            buffer.enqueue(sample, delay_seconds=-1, now=0)


class TelemetryLoopDeliveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_simulation_loop_delivers_and_marks_reordered_packets(self):
        state = telemetry_service.sim_state
        previous_interval = state.tick_interval
        state.running = True
        state.current_telemetry = None
        state.telemetry_history.clear()
        state.delivery_buffer.clear()
        state.noise_config = NoiseConfig(delay_enabled=True, delay_seconds=0.03)
        state.tick_interval = 0.01
        task = None
        try:
            with (
                patch.object(telemetry_service, "get_detector", return_value=InferenceStub()),
                patch.object(telemetry_service, "get_latest_incident_counter", return_value=0),
            ):
                task = asyncio.create_task(telemetry_service.simulation_loop())
                await asyncio.sleep(0.2)
                state.running = False
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task

            self.assertGreater(state.delivery_buffer.delayed_count, 0)
            self.assertGreater(state.delivery_buffer.out_of_order_count, 0)
            self.assertTrue(any(
                sample.get("delivery_quality", {}).get("status") == "OUT_OF_ORDER"
                for sample in state.telemetry_history
            ))
            self.assertIsNotNone(state.current_telemetry)
        finally:
            state.running = False
            state.tick_interval = previous_interval
            state.noise_config = NoiseConfig()
            state.delivery_buffer.clear()
            state.telemetry_history.clear()
            state.current_telemetry = None


if __name__ == "__main__":
    unittest.main()
