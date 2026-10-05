import logging
from typing import List, Dict, Optional
from app.config import settings
from app.rag.retriever import retrieve_for_question
from app.services.evidence_service import generate_telemetry_evidence

logger = logging.getLogger(__name__)

DEMO_RESPONSES = {
    "why": {
        "summary": "A power system anomaly was detected based on progressive battery degradation patterns.",
        "observed_facts": [
            "Battery voltage decreased significantly below nominal (28.0V)",
            "Battery current increased above baseline indicating compensation",
            "Battery temperature elevated above normal operating range",
            "Power consumption increased due to inefficient energy delivery"
        ],
        "root_cause": "Battery degradation — progressive reduction in cell capacity and increased internal resistance",
        "root_cause_confidence": 0.91,
        "recommendations": [
            "Verify battery voltage against secondary sensor reading",
            "Review solar power generation and charging circuit status",
            "Consult Power Management Procedure (PWR-PROC-001)",
            "Consider reducing non-essential payload power consumption",
            "Monitor battery temperature trend over next 10 minutes"
        ],
        "uncertainty": "Root cause confidence is 91%. Sensor drift has not been fully excluded as a contributing factor."
    },
    "evidence": {
        "summary": "Multiple telemetry parameters provide corroborating evidence of battery degradation.",
        "observed_facts": [
            "Battery voltage deviation: significant decrease from 28.0V nominal",
            "Battery current increase: compensating for reduced cell efficiency",
            "Battery temperature rise: consistent with increased internal resistance",
            "Historical incident HIST-0021 shows identical signature"
        ],
        "root_cause": "Correlated multi-parameter deviation consistent with battery cell degradation",
        "root_cause_confidence": 0.91,
        "recommendations": [
            "Review historical battery capacity trend since commissioning",
            "Compare current voltage curve with HIST-0021 baseline",
            "Calculate current State of Health (SoH) per PWR-PROC-001 Section 4"
        ],
        "uncertainty": "Independent sensor verification recommended before corrective action."
    },
    "investigate": {
        "summary": "Recommended investigation sequence for power subsystem anomaly.",
        "observed_facts": [
            "Primary indicator: voltage decline with current increase",
            "Secondary indicator: elevated battery temperature",
            "ML anomaly score: HIGH confidence detection"
        ],
        "root_cause": "Battery degradation (highest probability)",
        "root_cause_confidence": 0.91,
        "recommendations": [
            "Step 1: Verify battery voltage against backup sensor (Rule out sensor fault)",
            "Step 2: Check solar panel output and charging circuit status",
            "Step 3: Review 24-hour battery voltage trend for degradation pattern",
            "Step 4: Consult PWR-PROC-001 Section 5 for degradation diagnostic",
            "Step 5: Assess impact on mission operations and plan load shedding if needed"
        ],
        "uncertainty": "Steps 1 and 2 must be completed before diagnostic conclusion."
    }
}

async def generate_copilot_response(
    question: str,
    incident: Optional[dict] = None,
    conversation_history: Optional[List] = None
) -> dict:
    docs = retrieve_for_question(question, incident_context=incident, top_k=4)

    telemetry_evidence = []
    if incident and incident.get("telemetry_snapshot"):
        telemetry_evidence = generate_telemetry_evidence(
            incident["telemetry_snapshot"],
            incident.get("root_cause", "")
        )

    if settings.GEMINI_API_KEY:
        try:
            return await _generate_llm_response(question, incident, docs, telemetry_evidence, conversation_history)
        except Exception as e:
            logger.error(f"Gemini response failed: {e}")
            logger.info("Falling back to demo mode")

    return _generate_demo_response(question, incident, docs, telemetry_evidence)

async def _generate_llm_response(
    question: str,
    incident: Optional[dict],
    docs: List[dict],
    telemetry_evidence: List[dict],
    conversation_history: Optional[List]
) -> dict:
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("Google Gen AI SDK is not installed")

    doc_context = "\n\n".join([
        f"SOURCE [{d['doc_id']}]:\n{d['content'][:500]}"
        for d in docs[:3]
    ])

    telemetry_context = "\n".join([
        f"- {e['title']}: {e['content']}"
        for e in telemetry_evidence[:5]
    ])

    incident_context = ""
    if incident:
        incident_context = f"""
INCIDENT: {incident.get('incident_number', 'N/A')}
ROOT CAUSE: {incident.get('root_cause', 'Unknown')}
CONFIDENCE: {incident.get('root_cause_confidence', 0):.0%}
SEVERITY: {incident.get('severity', 'UNKNOWN')}
"""

    system_prompt = f"""You are ASTRA-COPILOT, a spacecraft mission operations decision-support AI.

IMPORTANT RULES:
1. Always ground your analysis in the provided telemetry evidence and retrieved documents
2. Never recommend direct spacecraft commands — always state HUMAN APPROVAL REQUIRED
3. Be precise and technical
4. Acknowledge uncertainty explicitly

CURRENT INCIDENT CONTEXT:
{incident_context}

TELEMETRY EVIDENCE:
{telemetry_context}

RETRIEVED DOCUMENTS:
{doc_context}

Respond in this exact JSON structure:
{{
  "summary": "Brief 1-2 sentence summary",
  "observed_facts": ["list of observed telemetry facts"],
  "root_cause": "identified root cause",
  "root_cause_confidence": 0.91,
  "recommendations": ["numbered action items"],
  "uncertainty": "what is uncertain or requires verification",
  "sources": ["doc_id_1", "doc_id_2"]
}}"""

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    async with client.aio as async_client:
        response = await async_client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

    import json
    try:
        content = (response.text or "").strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        data = json.loads(content)
        data["mode"] = "GEMINI"
        data["sources"] = [d["doc_id"] for d in docs]
        data["retrieved_documents"] = docs
        data["telemetry_evidence"] = telemetry_evidence
        return data
    except json.JSONDecodeError:
        return {
            "summary": (response.text or "Gemini returned an empty response.")[:500],
            "observed_facts": [],
            "root_cause": incident.get("root_cause", "") if incident else "",
            "root_cause_confidence": incident.get("root_cause_confidence", 0) if incident else 0,
            "recommendations": ["Review mission procedures"],
            "uncertainty": "Response parsing error",
            "sources": [d["doc_id"] for d in docs],
            "mode": "GEMINI",
            "retrieved_documents": docs,
            "telemetry_evidence": telemetry_evidence
        }

def _generate_demo_response(
    question: str,
    incident: Optional[dict],
    docs: List[dict],
    telemetry_evidence: List[dict]
) -> dict:
    question_lower = question.lower()

    if any(word in question_lower for word in ["why", "cause", "happen", "reason", "occur"]):
        template = DEMO_RESPONSES["why"]
    elif any(word in question_lower for word in ["evidence", "support", "data", "confirm", "telemetry"]):
        template = DEMO_RESPONSES["evidence"]
    elif any(word in question_lower for word in ["investigate", "next", "should", "recommend", "check", "procedure"]):
        template = DEMO_RESPONSES["investigate"]
    else:
        template = DEMO_RESPONSES["why"]

    actual_root_cause = template["root_cause"]
    actual_confidence = template["root_cause_confidence"]

    if incident:
        actual_root_cause = incident.get("root_cause", template["root_cause"])
        actual_confidence = incident.get("root_cause_confidence", template["root_cause_confidence"])

    observed_facts = template["observed_facts"]
    if telemetry_evidence:
        observed_facts = [e["content"] for e in telemetry_evidence[:4]]

    recommendations = (
        incident.get("recommendations", template["recommendations"])
        if incident
        else template["recommendations"]
    )
    summary = template["summary"]
    if incident:
        summary = (
            f"{incident.get('root_cause', 'A spacecraft anomaly')} was identified "
            f"for {incident.get('incident_number', 'the selected incident')}."
        )

    return {
        "summary": summary,
        "observed_facts": observed_facts,
        "root_cause": actual_root_cause,
        "root_cause_confidence": actual_confidence,
        "recommendations": recommendations,
        "uncertainty": template["uncertainty"],
        "sources": [d["doc_id"] for d in docs],
        "retrieved_documents": docs[:3],
        "telemetry_evidence": telemetry_evidence[:5],
        "mode": "DEMO"
    }
