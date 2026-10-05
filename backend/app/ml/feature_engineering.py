import numpy as np
from typing import List, Dict
from app.ml.preprocessing import FEATURE_COLUMNS, NORMAL_MEANS

NORMAL_STD = {
    "battery_voltage": 0.3, "battery_current": 0.2, "battery_temperature": 1.0,
    "solar_power": 0.5, "power_consumption": 0.3,
    "cpu_temperature": 2.0, "cpu_load": 5.0, "memory_usage": 3.0,
    "communication_signal": 2.0, "packet_loss": 0.2, "communication_latency": 15.0,
    "payload_temperature": 1.0, "reaction_wheel_speed": 50.0
}

def compute_subsystem_scores(telemetry: dict) -> dict:
    def zscore(field):
        val = telemetry.get(field)
        if val is None:
            return 0.0
        mean = NORMAL_MEANS.get(field, 0)
        std = NORMAL_STD.get(field, 1)
        return abs((float(val) - mean) / (std + 1e-6))

    power_score = max(
        zscore("battery_voltage"),
        zscore("battery_current"),
        zscore("battery_temperature"),
        zscore("solar_power"),
        zscore("power_consumption")
    )
    thermal_score = max(
        zscore("cpu_temperature"),
        zscore("payload_temperature")
    )
    comm_score = max(
        zscore("communication_signal"),
        zscore("packet_loss"),
        zscore("communication_latency")
    )
    compute_score = max(
        zscore("cpu_load"),
        zscore("memory_usage")
    )
    payload_score = max(
        zscore("payload_temperature"),
        zscore("reaction_wheel_speed")
    )

    def normalize(score):
        return round(float(min(1.0, score / 5.0)), 3)

    return {
        "power": normalize(power_score),
        "thermal": normalize(thermal_score),
        "communication": normalize(comm_score),
        "computing": normalize(compute_score),
        "payload": normalize(payload_score)
    }

def identify_root_cause(subsystem_scores: dict, telemetry: dict) -> tuple:
    ROOT_CAUSE_MAP = {
        "power": "Battery degradation",
        "thermal": "Thermal subsystem overload",
        "communication": "Communication link degradation",
        "computing": "Compute resource exhaustion",
        "payload": "Payload anomaly"
    }

    max_subsystem = max(subsystem_scores, key=subsystem_scores.get)
    max_score = subsystem_scores[max_subsystem]

    if max_score < 0.2:
        return "No significant anomaly", 0.3

    scores_sorted = sorted(subsystem_scores.values(), reverse=True)
    if len(scores_sorted) > 1 and scores_sorted[1] > 0:
        differentiation = scores_sorted[0] / (scores_sorted[1] + 0.01)
        confidence = min(0.99, 0.6 + (differentiation - 1) * 0.15 + max_score * 0.2)
    else:
        confidence = min(0.99, 0.7 + max_score * 0.25)

    root_cause = ROOT_CAUSE_MAP.get(max_subsystem, "Unknown anomaly")
    return root_cause, round(float(confidence), 3)
