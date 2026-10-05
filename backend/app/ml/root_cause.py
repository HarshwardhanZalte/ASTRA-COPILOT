"""Root cause analysis helpers — thin wrapper used by services."""
from app.ml.feature_engineering import compute_subsystem_scores, identify_root_cause

def analyze(telemetry: dict) -> dict:
    scores = compute_subsystem_scores(telemetry)
    root_cause, confidence = identify_root_cause(scores, telemetry)
    return {
        "subsystem_scores": scores,
        "root_cause": root_cause,
        "confidence": confidence
    }
