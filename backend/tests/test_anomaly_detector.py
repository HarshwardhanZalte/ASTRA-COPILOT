import unittest

import numpy as np

from app.ml.anomaly_detector import AnomalyDetector
from app.ml.preprocessing import FEATURE_COLUMNS, NORMAL_MEANS


class AnomalyDetectorTests(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(13)
        means = np.array([NORMAL_MEANS[field] for field in FEATURE_COLUMNS])
        standard_deviations = np.array([
            0.3, 0.2, 1.0, 0.5, 0.3, 2.0, 5.0, 3.0, 2.0, 0.2, 15.0, 1.0, 50.0
        ])
        training_data = rng.normal(
            loc=means,
            scale=standard_deviations,
            size=(300, len(FEATURE_COLUMNS)),
        )
        self.detector = AnomalyDetector(n_estimators=50)
        self.detector.train(training_data)

    def test_nominal_telemetry_is_not_flagged_as_an_anomaly(self):
        telemetry = dict(NORMAL_MEANS)

        result = self.detector.predict(telemetry)

        self.assertFalse(result["is_anomaly"])
        self.assertEqual(result["severity"], "NORMAL")

    def test_extreme_battery_telemetry_is_detected(self):
        telemetry = dict(NORMAL_MEANS)
        telemetry.update({
            "battery_voltage": 19.0,
            "battery_current": 13.0,
            "battery_temperature": 48.0,
            "power_consumption": 14.0,
        })

        result = self.detector.predict(telemetry)

        self.assertTrue(result["is_anomaly"])
        self.assertEqual(result["root_cause"], "Battery degradation")
        self.assertGreaterEqual(result["anomaly_score"], 0.4)


if __name__ == "__main__":
    unittest.main()
