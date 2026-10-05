from fastapi import APIRouter, HTTPException
from app.services.incident_service import (
    get_all_incidents, get_incident, get_incident_by_number,
    get_incident_events, add_incident_event
)
from app.services.evidence_service import generate_telemetry_evidence
from app.rag.retriever import retrieve_for_incident

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("")
async def list_incidents():
    incidents = get_all_incidents()
    return {"count": len(incidents), "data": incidents}

@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    incident = get_incident(incident_id)
    if incident is None:
        incident = get_incident_by_number(incident_id.upper())
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.get("/{incident_id}/timeline")
async def get_incident_timeline(incident_id: str):
    incident = get_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    events = get_incident_events(incident_id)
    return {"incident_id": incident_id, "events": events}

@router.get("/{incident_id}/evidence")
async def get_incident_evidence(incident_id: str):
    incident = get_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    tel_evidence = []
    if incident.get("telemetry_snapshot"):
        tel_evidence = generate_telemetry_evidence(
            incident["telemetry_snapshot"],
            incident.get("root_cause", "")
        )

    doc_evidence = retrieve_for_incident(incident, top_k=4)
    return {
        "incident_id": incident_id,
        "telemetry_evidence": tel_evidence,
        "document_evidence": doc_evidence
    }
