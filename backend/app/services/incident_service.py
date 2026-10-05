import logging
from datetime import datetime
from typing import List, Optional, Dict
import uuid
from collections import OrderedDict

logger = logging.getLogger(__name__)

# In-memory incident store (used when DB is unavailable)
_incidents: OrderedDict = OrderedDict()
_events: Dict[str, List] = {}

def create_incident_from_anomaly(ml_result: dict, telemetry: dict, counter: int) -> dict:
    """Create an incident from a detected anomaly."""
    incident_id = str(uuid.uuid4())
    incident_number = f"INC-{counter:04d}"
    
    root_cause = ml_result.get("root_cause", "Unknown anomaly")
    severity = ml_result.get("severity", "MEDIUM")
    subsystem_scores = ml_result.get("subsystem_scores", {})
    
    # Determine which subsystem is most affected
    if subsystem_scores:
        max_sub = max(subsystem_scores, key=subsystem_scores.get)
        subsystem_name = max_sub.upper()
    else:
        subsystem_name = "SYSTEM"
    
    title = f"{subsystem_name} subsystem anomaly — {root_cause}"
    
    incident = {
        "id": incident_id,
        "incident_number": incident_number,
        "spacecraft_id": telemetry.get("spacecraft_id", "SAT-01"),
        "title": title,
        "severity": severity,
        "status": "OPEN",
        "root_cause": root_cause,
        "root_cause_confidence": ml_result.get("root_cause_confidence", 0.0),
        "detected_at": datetime.utcnow().isoformat(),
        "anomaly_score": ml_result.get("anomaly_score", 0.0),
        "subsystem_scores": subsystem_scores,
        "telemetry_snapshot": {
            k: v for k, v in telemetry.items()
            if k not in ["ml", "statuses", "data_quality"]
        },
        "created_at": datetime.utcnow().isoformat()
    }
    
    _incidents[incident_id] = incident
    
    # Create timeline events
    events = [
        {
            "id": str(uuid.uuid4()),
            "incident_id": incident_id,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "detection",
            "title": "Anomaly detected by ML system",
            "description": f"Isolation Forest anomaly score: {ml_result.get('anomaly_score', 0):.2f}",
            "severity": severity,
            "actor": "ML_SYSTEM"
        },
        {
            "id": str(uuid.uuid4()),
            "incident_id": incident_id,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "analysis",
            "title": f"Root cause identified: {root_cause}",
            "description": f"Confidence: {ml_result.get('root_cause_confidence', 0):.0%}",
            "severity": severity,
            "actor": "ROOT_CAUSE_ENGINE"
        },
        {
            "id": str(uuid.uuid4()),
            "incident_id": incident_id,
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "incident_creation",
            "title": f"Incident {incident_number} created",
            "description": "Incident record created and operator notification sent.",
            "severity": severity,
            "actor": "SYSTEM"
        }
    ]
    _events[incident_id] = events
    
    logger.info(f"Created incident {incident_number}: {title}")
    return incident

def get_all_incidents() -> List[dict]:
    return list(reversed(list(_incidents.values())))

def clear_incidents() -> None:
    _incidents.clear()
    _events.clear()

def get_latest_incident_counter() -> int:
    counters = []
    for incident in _incidents.values():
        incident_number = incident.get("incident_number", "")
        prefix, separator, number = incident_number.partition("-")
        if prefix == "INC" and separator and number.isdigit():
            counters.append(int(number))
    return max(counters, default=0)

def get_incident(incident_id: str) -> Optional[dict]:
    return _incidents.get(incident_id)

def get_incident_by_number(number: str) -> Optional[dict]:
    for inc in _incidents.values():
        if inc["incident_number"] == number:
            return inc
    return None

def get_incident_events(incident_id: str) -> List[dict]:
    return _events.get(incident_id, [])

def add_incident_event(incident_id: str, event: dict):
    if incident_id not in _events:
        _events[incident_id] = []
    event["id"] = str(uuid.uuid4())
    event["incident_id"] = incident_id
    event["timestamp"] = datetime.utcnow().isoformat()
    _events[incident_id].append(event)
    return event
