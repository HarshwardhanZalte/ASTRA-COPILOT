from typing import List, Dict, Optional
from app.rag.vector_store import search_similar
import logging

logger = logging.getLogger(__name__)

def retrieve_for_incident(incident: dict, top_k: int = 4) -> List[Dict]:
    root_cause = incident.get("root_cause", "")
    subsystem_scores = incident.get("subsystem_scores", {})
    max_subsystem = max(subsystem_scores, key=subsystem_scores.get) if subsystem_scores else "system"
    query = f"{root_cause} {max_subsystem} subsystem anomaly spacecraft procedure"
    return search_similar(query, top_k=top_k)

def retrieve_for_question(question: str, incident_context: Optional[dict] = None, top_k: int = 4) -> List[Dict]:
    if incident_context:
        root_cause = incident_context.get("root_cause", "")
        subsystem_scores = incident_context.get("subsystem_scores", {})
        subsystem = (
            max(subsystem_scores, key=subsystem_scores.get)
            if subsystem_scores
            else ""
        )
        query = f"{question} {root_cause} {subsystem}"
    else:
        query = question
    return search_similar(query, top_k=top_k)
