import unittest

from app.simulator.faults import (
    FaultSeverity,
    apply_communication_failure,
)


class CommunicationFailureTests(unittest.TestCase):
    def test_signal_degrades_and_packet_loss_increases(self):
        telemetry = {
            "communication_signal": -75.0,
            "packet_loss": 0.5,
            "communication_latency": 250.0,
        }

        result = apply_communication_failure(
            telemetry,
            FaultSeverity.HIGH,
            elapsed_seconds=50,
        )

        self.assertLess(result["communication_signal"], telemetry["communication_signal"])
        self.assertGreater(result["packet_loss"], telemetry["packet_loss"])
        self.assertGreater(result["communication_latency"], telemetry["communication_latency"])
        self.assertEqual(telemetry["communication_signal"], -75.0)


if __name__ == "__main__":
    unittest.main()
