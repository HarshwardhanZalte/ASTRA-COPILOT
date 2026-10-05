"""Seed an in-memory demo history so dashboards are populated before simulation."""

import logging
from datetime import datetime, timedelta
from typing import Any

import numpy as np

from app.ml.anomaly_detector import get_detector
from app.services.incident_service import (
    create_incident_from_anomaly,
    get_all_incidents,
    get_incident_events,
)
from app.services.telemetry_service import sim_state
from app.simulator.faults import FaultSeverity, FaultType, apply_fault
from app.simulator.generator import get_all_statuses, generate_base_telemetry
from app.simulator.noise import process_telemetry_with_noise

logger = logging.getLogger(__name__)

SAMPLE_COUNT = 240
SAMPLE_INTERVAL_SECONDS = 15

INCIDENT_SCENARIOS: list[dict[str, Any]] = [
    {
        "incident_number": "INC-0039",
        "fault_type": FaultType.SENSOR_DRIFT,
        "start": 36,
        "end": 48,
        "root_cause": "Sensor measurement drift",
        "severity": "LOW",
        "status": "CLOSED",
        "confidence": 0.78,
        "subsystem": "computing",
        "scores": {"power": 0.35, "thermal": 0.42, "communication": 0.12, "computing": 0.48, "payload": 0.17},
        "recommendations": [
            "Compare the battery-voltage and CPU-temperature channels with redundant sensors.",
            "Review sensor calibration history and recent thermal cycles.",
            "Continue monitoring before returning the affected channel to primary use.",
        ],
    },
    {
        "incident_number": "INC-0040",
        "fault_type": FaultType.COMMUNICATION_FAILURE,
        "start": 84,
        "end": 96,
        "root_cause": "Communication link degradation",
        "severity": "MEDIUM",
        "status": "RESOLVED",
        "confidence": 0.86,
        "subsystem": "communication",
        "scores": {"power": 0.11, "thermal": 0.09, "communication": 0.88, "computing": 0.14, "payload": 0.1},
        "recommendations": [
            "Compare signal strength with the ground-station link budget.",
            "Review packet-loss and latency trends across recent contacts.",
            "Consult the Communication Recovery Procedure before any operational change.",
        ],
    },
    {
        "incident_number": "INC-0041",
        "fault_type": FaultType.THERMAL_RUNAWAY,
        "start": 132,
        "end": 144,
        "root_cause": "Thermal subsystem overload",
        "severity": "HIGH",
        "status": "RESOLVED",
        "confidence": 0.9,
        "subsystem": "thermal",
        "scores": {"power": 0.28, "thermal": 0.94, "communication": 0.1, "computing": 0.54, "payload": 0.79},
        "recommendations": [
            "Compare CPU and payload temperatures with independent sensors.",
            "Review recent compute load and thermal-management telemetry.",
            "Consult the Thermal Management Procedure and assess mission impact.",
        ],
    },
    {
        "incident_number": "INC-0042",
        "fault_type": FaultType.BATTERY_DEGRADATION,
        "start": 180,
        "end": 192,
        "root_cause": "Battery degradation",
        "severity": "HIGH",
        "status": "OPEN",
        "confidence": 0.91,
        "subsystem": "power",
        "scores": {"power": 0.94, "thermal": 0.48, "communication": 0.08, "computing": 0.16, "payload": 0.2},
        "recommendations": [
            "Verify battery voltage against a secondary sensor reading.",
            "Check solar generation and the battery charging telemetry.",
            "Review the Power Management Procedure and monitor temperature trend.",
        ],
    },
]

_seeded = False


def _scenario_for_sample(index: int) -> dict[str, Any] | None:
    return next(
        (scenario for scenario in INCIDENT_SCENARIOS if scenario["start"] <= index < scenario["end"]),
        None,
    )


def _make_sample(
    index: int,
    timestamp: datetime,
    rng: np.random.Generator,
) -> dict[str, Any]:
    sample_time = timestamp + timedelta(seconds=index * SAMPLE_INTERVAL_SECONDS)
    telemetry = generate_base_telemetry("SAT-01", sample_time)
    scenario = _scenario_for_sample(index)

    if scenario:
        elapsed_seconds = (index - scenario["start"]) * SAMPLE_INTERVAL_SECONDS
        severity = (
            FaultSeverity.MEDIUM
            if scenario["fault_type"] == FaultType.SENSOR_DRIFT
            else FaultSeverity.HIGH
        )
        telemetry = apply_fault(
            telemetry,
            scenario["fault_type"],
            severity,
            elapsed_seconds,
        )

    for field, value in telemetry.items():
        if isinstance(value, (int, float)) and field != "timestamp":
            telemetry[field] = round(float(value + rng.normal(0, abs(value) * 0.002)), 3)

    telemetry = process_telemetry_with_noise(telemetry, sim_state.noise_config)
    telemetry["scenario"] = scenario["fault_type"].value if scenario else "normal"
    telemetry["fault_active"] = scenario is not None
    telemetry["data_origin"] = "SIMULATED_DEMO"
    telemetry["statuses"] = get_all_statuses(telemetry)
    telemetry["ml"] = get_detector().predict(telemetry)
    return telemetry


def _seed_incident(scenario: dict[str, Any], telemetry: dict[str, Any]) -> None:
    subsystem_scores = scenario["scores"]
    ml_result = {
        "root_cause": scenario["root_cause"],
        "severity": scenario["severity"],
        "root_cause_confidence": scenario["confidence"],
        "anomaly_score": max(subsystem_scores.values()),
        "confidence": scenario["confidence"],
        "subsystem_scores": subsystem_scores,
    }
    incident = create_incident_from_anomaly(
        ml_result,
        telemetry,
        int(scenario["incident_number"].split("-")[1]),
    )
    incident["incident_number"] = scenario["incident_number"]
    incident["title"] = f"{scenario['subsystem'].upper()} subsystem anomaly — {scenario['root_cause']}"
    incident["status"] = scenario["status"]
    incident["data_origin"] = "SIMULATED_DEMO"
    incident["recommendations"] = scenario["recommendations"]

    detected_at = datetime.fromisoformat(telemetry["timestamp"])
    incident["detected_at"] = detected_at.isoformat()
    incident["created_at"] = detected_at.isoformat()

    timeline = get_incident_events(incident["id"])
    timeline_titles = [
        ("detection", "Anomaly detected by telemetry monitoring", "ML_SYSTEM"),
        ("analysis", f"Probable cause: {scenario['root_cause']}", "ROOT_CAUSE_ENGINE"),
        ("evidence", "Telemetry snapshot and supporting evidence attached", "EVIDENCE_SERVICE"),
        ("status", f"Incident status: {scenario['status']}", "MISSION_OPERATIONS"),
    ]
    for event, (event_type, title, actor), minutes_before in zip(
        timeline[:3],
        timeline_titles[:3],
        (2, 1, 0),
    ):
        event["event_type"] = event_type
        event["title"] = title
        event["actor"] = actor
        event["timestamp"] = (detected_at + timedelta(minutes=minutes_before)).isoformat()
    timeline.append({
        "id": f"{incident['id']}-status",
        "incident_id": incident["id"],
        "timestamp": (detected_at + timedelta(minutes=3)).isoformat(),
        "event_type": "status",
        "title": f"Incident status: {scenario['status']}",
        "description": "Simulated historical mission event.",
        "severity": scenario["severity"],
        "actor": "MISSION_OPERATIONS",
    })


def seed_mock_data() -> dict[str, int | bool]:
    """Populate one deterministic set of telemetry and incident demo records."""
    global _seeded
    if _seeded or sim_state.telemetry_history or get_all_incidents():
        return {"seeded": False, "telemetry_records": len(sim_state.telemetry_history), "incidents": len(get_all_incidents())}

    rng = np.random.default_rng(42)
    start_time = datetime.utcnow() - timedelta(
        seconds=(SAMPLE_COUNT - 1) * SAMPLE_INTERVAL_SECONDS
    )
    numpy_state = np.random.get_state()
    try:
        np.random.seed(42)
        samples = [
            _make_sample(index, start_time, rng)
            for index in range(SAMPLE_COUNT)
        ]
    finally:
        np.random.set_state(numpy_state)

    for sample in samples:
        sim_state.telemetry_history.append(sample)
    sim_state.current_telemetry = samples[-1]

    for scenario in INCIDENT_SCENARIOS:
        _seed_incident(scenario, samples[scenario["end"] - 1])

    scenario_events = []
    for scenario in INCIDENT_SCENARIOS:
        detected_at = datetime.fromisoformat(
            samples[scenario["end"] - 1]["timestamp"]
        )
        scenario_events.extend([
            {
                "timestamp": (detected_at - timedelta(minutes=2)).isoformat(),
                "message": f"{scenario['fault_type'].value.replace('_', ' ').title()} signature observed",
                "type": "FAULT",
            },
            {
                "timestamp": (detected_at - timedelta(minutes=1)).isoformat(),
                "message": f"{scenario['root_cause']} analysis completed",
                "type": "ANALYSIS",
            },
            {
                "timestamp": detected_at.isoformat(),
                "message": f"Incident {scenario['incident_number']} recorded ({scenario['status']})",
                "type": "INCIDENT",
            },
        ])
    sim_state.event_log.extend(scenario_events[-sim_state.event_log.maxlen:])
    sim_state.demo_data_loaded = True

    _seeded = True
    logger.info(
        "Seeded demo history with %s telemetry samples and %s incidents",
        len(samples),
        len(INCIDENT_SCENARIOS),
    )
    return {
        "seeded": True,
        "telemetry_records": len(samples),
        "incidents": len(INCIDENT_SCENARIOS),
    }


def reset_mock_data_seed() -> None:
    global _seeded
    _seeded = False
