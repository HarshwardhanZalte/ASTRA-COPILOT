"""Reproducible synthetic holdout evaluation for the telemetry detector."""

from datetime import datetime, timedelta
from typing import Any

import numpy as np

from app.ml.anomaly_detector import AnomalyDetector
from app.ml.preprocessing import FEATURE_COLUMNS, NORMAL_MEANS
from app.simulator.faults import FaultSeverity, FaultType, apply_fault
from app.simulator.generator import generate_base_telemetry
from app.simulator.noise import NoiseConfig, process_telemetry_with_noise
from app.ml.preprocessing import telemetry_to_features

TRAIN_SEED = 2718
TEST_SEED = 31415
FAULT_CLASSES = (
    FaultType.BATTERY_DEGRADATION,
    FaultType.THERMAL_RUNAWAY,
    FaultType.COMMUNICATION_FAILURE,
    FaultType.SENSOR_DRIFT,
)
FAULT_LABELS = {
    FaultType.BATTERY_DEGRADATION: "battery_degradation",
    FaultType.THERMAL_RUNAWAY: "thermal_runaway",
    FaultType.COMMUNICATION_FAILURE: "communication_failure",
    FaultType.SENSOR_DRIFT: "sensor_drift",
}


def _make_samples(
    seed: int,
    count_per_class: int,
    include_faults: bool,
) -> tuple[list[dict[str, Any]], list[str]]:
    rng = np.random.default_rng(seed)
    numpy_state = np.random.get_state()
    np.random.seed(seed)
    telemetry_samples: list[dict[str, Any]] = []
    labels: list[str] = []
    base_time = datetime(2025, 1, 1)
    noise = NoiseConfig(
        noise_enabled=include_faults,
        noise_level=0.015,
        missing_enabled=include_faults,
        missing_rate=0.04,
    )

    try:
        classes: tuple[FaultType | None, ...] = (
            (None, *FAULT_CLASSES) if include_faults else (None,)
        )
        sample_index = 0
        for fault_type in classes:
            label = FAULT_LABELS[fault_type] if fault_type else "normal"
            for offset in range(count_per_class):
                timestamp = base_time + timedelta(seconds=sample_index * 45)
                telemetry = generate_base_telemetry("SAT-01", timestamp)
                if fault_type:
                    telemetry = apply_fault(
                        telemetry,
                        fault_type,
                        FaultSeverity.HIGH,
                        90 + offset * 9,
                    )
                else:
                    for field in NORMAL_MEANS:
                        value = telemetry.get(field)
                        if value is not None:
                            telemetry[field] = round(
                                float(value + rng.normal(0, abs(value) * 0.002)),
                                3,
                            )
                telemetry = process_telemetry_with_noise(telemetry, noise)
                telemetry_samples.append(telemetry)
                labels.append(label)
                sample_index += 1
    finally:
        np.random.set_state(numpy_state)

    return telemetry_samples, labels


def calculate_binary_metrics(
    actual: list[bool] | tuple[bool, ...],
    predicted: list[bool] | tuple[bool, ...],
) -> dict[str, Any]:
    if len(actual) != len(predicted):
        raise ValueError("Actual and predicted labels must have equal lengths")
    if not actual:
        raise ValueError("At least one evaluation sample is required")

    true_positive = sum(expected and observed for expected, observed in zip(actual, predicted))
    true_negative = sum(not expected and not observed for expected, observed in zip(actual, predicted))
    false_positive = sum(not expected and observed for expected, observed in zip(actual, predicted))
    false_negative = sum(expected and not observed for expected, observed in zip(actual, predicted))
    precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
    recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    nominal_count = true_negative + false_positive

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "false_alert_rate": round(false_positive / nominal_count, 4) if nominal_count else 0.0,
        "confusion_matrix": {
            "labels": ["nominal", "fault"],
            "matrix": [
                [true_negative, false_positive],
                [false_negative, true_positive],
            ],
            "tn": true_negative,
            "fp": false_positive,
            "fn": false_negative,
            "tp": true_positive,
        },
    }


_evaluation_cache: dict[str, Any] | None = None


def evaluate_detector() -> dict[str, Any]:
    """Train on one deterministic synthetic set and score a disjoint holdout set."""
    global _evaluation_cache
    if _evaluation_cache is not None:
        return _evaluation_cache

    training_samples, _ = _make_samples(TRAIN_SEED, 1000, include_faults=False)
    test_samples, labels = _make_samples(TEST_SEED, 100, include_faults=True)
    detector = AnomalyDetector()
    detector.train(np.array([telemetry_to_features(sample) for sample in training_samples]))

    predictions = [detector.predict(sample)["is_anomaly"] for sample in test_samples]
    actual_faults = [label != "normal" for label in labels]
    counts = {label: labels.count(label) for label in sorted(set(labels))}
    per_fault = {
        fault_label: {
            "samples": counts[fault_label],
            "detected": sum(
                predicted
                for predicted, label in zip(predictions, labels)
                if label == fault_label
            ),
            "recall": round(
                sum(
                    predicted
                    for predicted, label in zip(predictions, labels)
                    if label == fault_label
                )
                / counts[fault_label],
                4,
            ),
        }
        for fault_label in FAULT_LABELS.values()
    }

    _evaluation_cache = {
        **calculate_binary_metrics(actual_faults, predictions),
        "dataset": "synthetic_holdout",
        "training_samples": len(training_samples),
        "test_samples": len(test_samples),
        "class_counts": counts,
        "per_fault_detection": per_fault,
        "method": (
            "A separately trained Isolation Forest and production scoring path; fixed "
            "seeds; held-out nominal and four fault classes; holdout has 1.5% "
            "multiplicative noise and 4% missing-value injection."
        ),
        "warning": (
            "Synthetic simulation benchmark only; not a real-mission dataset or "
            "operational qualification."
        ),
    }
    return _evaluation_cache
