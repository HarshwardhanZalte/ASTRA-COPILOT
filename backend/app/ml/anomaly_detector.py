import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Optional
import logging
import threading
from collections import deque

from app.ml.preprocessing import FEATURE_COLUMNS, NORMAL_MEANS, telemetry_to_features
from app.ml.feature_engineering import compute_subsystem_scores, identify_root_cause

logger = logging.getLogger(__name__)

SEVERITY_THRESHOLDS = {
    "LOW": 0.4,
    "MEDIUM": 0.55,
    "HIGH": 0.7,
    "CRITICAL": 0.85
}
ANOMALY_SCORE_SCALE = 0.2

def score_to_severity(score: float) -> str:
    for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        if score >= SEVERITY_THRESHOLDS[severity]:
            return severity
    return "NORMAL"

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05, n_estimators: int = 100):
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.is_trained = False
        self.normal_score_threshold = 0.0
        self.contamination = contamination
        self._lock = threading.Lock()
        self._history = deque(maxlen=200)

    def _generate_normal_training_data(self, n_samples: int = 1000) -> np.ndarray:
        from app.simulator.generator import generate_base_telemetry
        samples = []
        for i in range(n_samples):
            t = generate_base_telemetry("SAT-01")
            features = telemetry_to_features(t)
            samples.append(features)
        return np.array(samples)

    def train(self, training_data: Optional[np.ndarray] = None):
        with self._lock:
            if training_data is None:
                logger.info("Generating synthetic training data...")
                training_data = self._generate_normal_training_data(1000)
            logger.info(f"Training anomaly detector on {len(training_data)} samples")
            scaled = self.scaler.fit_transform(training_data)
            self.model.fit(scaled)
            training_scores = self.model.score_samples(scaled)
            self.normal_score_threshold = float(
                np.percentile(training_scores, self.contamination * 100)
            )
            self.is_trained = True
            logger.info("Anomaly detector trained successfully")

    def predict(self, telemetry: dict) -> dict:
        if not self.is_trained:
            self.train()

        features = telemetry_to_features(telemetry)
        self._history.append(features)

        with self._lock:
            features_2d = features.reshape(1, -1)
            scaled = self.scaler.transform(features_2d)
            raw_score = self.model.score_samples(scaled)[0]
            anomaly_score = max(
                0.0,
                min(
                    1.0,
                    (self.normal_score_threshold - raw_score)
                    / ANOMALY_SCORE_SCALE,
                ),
            )

        subsystem_scores = compute_subsystem_scores(telemetry)
        root_cause, root_cause_confidence = identify_root_cause(subsystem_scores, telemetry)

        max_subsystem_score = max(subsystem_scores.values())
        combined_score = 0.6 * anomaly_score + 0.4 * max_subsystem_score
        combined_score = round(float(combined_score), 3)

        severity = score_to_severity(combined_score)
        is_anomaly = combined_score >= SEVERITY_THRESHOLDS["LOW"]

        return {
            "anomaly_score": combined_score,
            "raw_isolation_score": round(float(anomaly_score), 3),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "confidence": round(float(min(0.99, combined_score + 0.05)), 3),
            "subsystem_scores": subsystem_scores,
            "root_cause": root_cause,
            "root_cause_confidence": root_cause_confidence
        }

_detector: Optional[AnomalyDetector] = None
_detector_lock = threading.Lock()

def get_detector() -> AnomalyDetector:
    global _detector
    with _detector_lock:
        if _detector is None:
            _detector = AnomalyDetector()
            _detector.train()
    return _detector
