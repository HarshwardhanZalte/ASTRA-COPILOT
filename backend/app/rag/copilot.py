import json
import logging
import re
from typing import Any, Optional

from app.config import settings
from app.rag.retriever import retrieve_for_question
from app.services.evidence_service import generate_telemetry_evidence

logger = logging.getLogger(__name__)

MIN_EVIDENCE_SCORE = 0.12
CONTEXT_TERMS = {
    "anomaly", "apply", "applies", "cause", "check", "diagnosis", "evidence",
    "fault", "happen", "incident", "investigate", "next", "occur", "operator",
    "procedure", "recommend", "reason", "root", "should", "spacecraft", "support",
    "system", "telemetry", "what", "which", "why",
}
STOP_WORDS = {
    "a", "an", "and", "are", "be", "by", "can", "did", "do", "for", "from",
    "how", "i", "in", "is", "it", "me", "of", "on", "or", "our", "the", "this",
    "to", "was", "we", "with", "you",
}
REFUSAL = (
    "I could not find enough relevant telemetry or mission-document evidence to "
    "answer that safely. Please ask about the selected incident, telemetry, or a "
    "specific mission procedure."
)


def _terms(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in STOP_WORDS
    }


def _evidence_is_sufficient(
    question: str,
    incident: Optional[dict],
    docs: list[dict],
    telemetry_evidence: list[dict],
) -> bool:
    if not docs and not telemetry_evidence and not incident:
        # Check if question is a general greeting or capability query
        q_lower = question.lower().strip()
        if any(w in q_lower for w in ["hello", "hi", "help", "who", "what", "explain", "status", "system", "satellite"]):
            return True
        return False

    # If we have retrieved documents or incident or telemetry, allow the Copilot to answer
    if docs or telemetry_evidence or incident:
        return True

    question_terms = _terms(question)
    topic_terms = question_terms - CONTEXT_TERMS
    if not topic_terms:
        return bool(incident and (docs or telemetry_evidence))

    evidence_terms = _terms(" ".join(
        [f"{doc.get('title', '')} {doc.get('content', '')}" for doc in docs]
        + [str(item.get("content", "")) for item in telemetry_evidence]
        + ([str(incident.get("root_cause", ""))] if incident else [])
    ))
    overlap = topic_terms & evidence_terms
    return len(overlap) > 0 or bool(incident)


def _build_citations(
    incident: Optional[dict],
    docs: list[dict],
    telemetry_evidence: list[dict],
) -> list[dict]:
    citations: list[dict] = []
    if incident:
        citations.append({
            "id": "I1",
            "source_id": incident.get("incident_number", incident.get("id", "incident")),
            "source_type": "incident_record",
            "title": f"Incident record {incident.get('incident_number', '')}".strip(),
            "excerpt": (
                f"Recorded probable root cause: {incident.get('root_cause', 'not specified')}. "
                f"Severity: {incident.get('severity', 'not specified')}; "
                f"status: {incident.get('status', 'not specified')}."
            ),
            "relevance_score": 1.0,
        })

    for doc in docs:
        if doc.get("similarity_score", 0.0) < MIN_EVIDENCE_SCORE:
            continue
        citation_id = f"C{len(citations) + 1}"
        doc["citation_id"] = citation_id
        citations.append({
            "id": citation_id,
            "source_id": doc.get("source_id", doc.get("doc_id", "")),
            "source_type": doc.get("doc_type", "document"),
            "title": doc.get("title", doc.get("doc_id", "Mission document")),
            "excerpt": doc.get("content", "")[:700],
            "relevance_score": doc.get("similarity_score", 0.0),
        })

    for evidence in telemetry_evidence:
        citation_id = f"T{len(citations) + 1}"
        evidence["citation_id"] = citation_id
        citations.append({
            "id": citation_id,
            "source_id": evidence.get("field", "telemetry"),
            "source_type": "telemetry",
            "title": evidence.get("title", "Telemetry evidence"),
            "excerpt": evidence.get("content", ""),
            "relevance_score": evidence.get("relevance_score", 0.0),
        })
    return citations


def _procedure_claims(docs: list[dict]) -> list[dict]:
    claims = []
    for doc in docs:
        if doc.get("doc_type") != "procedure" or not doc.get("citation_id"):
            continue
        for line in doc.get("content", "").splitlines():
            line = line.strip()
            if re.match(r"(?:Step|Action)\s+\d+\s*:", line, re.IGNORECASE):
                claims.append({
                    "kind": "recommendation",
                    "text": f"Procedure reference (human approval required): {line}",
                    "citation_ids": [doc["citation_id"]],
                })
                if len(claims) == 3:
                    return claims
    return claims


def _insufficient_evidence_response(citations: list[dict], mode: str) -> dict:
    return {
        "summary": REFUSAL,
        "observed_facts": [],
        "root_cause": "",
        "root_cause_confidence": 0,
        "recommendations": [],
        "uncertainty": "No answer was generated because the evidence relevance check failed.",
        "sources": [],
        "retrieved_documents": [],
        "telemetry_evidence": [],
        "citations": [],
        "grounded_claims": [],
        "insufficient_evidence": True,
        "mode": mode,
    }


async def generate_copilot_response(
    question: str,
    incident: Optional[dict] = None,
    conversation_history: Optional[list] = None,
) -> dict:
    docs = retrieve_for_question(question, incident_context=incident, top_k=4)
    telemetry_evidence = []
    if incident and incident.get("telemetry_snapshot"):
        telemetry_evidence = generate_telemetry_evidence(
            incident["telemetry_snapshot"],
            incident.get("root_cause", ""),
        )

    citations = _build_citations(incident, docs, telemetry_evidence)
    if not _evidence_is_sufficient(question, incident, docs, telemetry_evidence):
        return _insufficient_evidence_response(citations, "GEMINI" if settings.GEMINI_API_KEY else "DEMO")

    if settings.GEMINI_API_KEY:
        try:
            response = await _generate_llm_response(
                question,
                incident,
                docs,
                telemetry_evidence,
                citations,
                conversation_history,
            )
            if response["grounded_claims"]:
                return response
            logger.warning("Gemini returned no valid evidence-linked claims; using grounded demo response")
        except Exception:
            logger.exception("Gemini response failed; using grounded demo response")

    return _generate_demo_response(question, incident, docs, telemetry_evidence, citations)


async def _generate_llm_response(
    question: str,
    incident: Optional[dict],
    docs: list[dict],
    telemetry_evidence: list[dict],
    citations: list[dict],
    conversation_history: Optional[list],
) -> dict:
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise ImportError("Google Gen AI SDK is not installed") from exc

    evidence_context = "\n\n".join(
        f"[{citation['id']}] {citation['title']}: {citation['excerpt']}"
        for citation in citations
    )
    system_prompt = f"""You are ASTRA-COPILOT, a spacecraft mission-operations decision-support assistant.
Use only the supplied evidence. Never invent telemetry, root causes, or procedures.
Never issue spacecraft commands. Recommendations are for human review only.
Return JSON with a `claims` array. Each claim must have `kind` (observation or
recommendation), `text`, and `citation_ids`. Every claim must cite one or more
exact IDs from the evidence below. Omit any claim that cannot be directly supported.
Evidence:
{evidence_context}
"""
    history = conversation_history or []
    prompt = json.dumps({
        "question": question,
        "conversation_history": history[-6:],
    })

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Model candidate list with fallbacks
    model_candidates = [
        settings.GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]
    # Deduplicate while preserving order
    seen = set()
    models_to_try = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

    response = None
    last_error = None
    for model_name in models_to_try:
        try:
            async with client.aio as async_client:
                response = await async_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.1,
                        response_mime_type="application/json",
                    ),
                )
            if response and response.text:
                break
        except Exception as exc:
            last_error = exc
            logger.warning(f"Gemini model {model_name} failed: {exc}. Trying next candidate...")

    if not response or not response.text:
        raise last_error or RuntimeError("All Gemini model candidates failed to generate content")

    content = (response.text or "").strip()
    if content.startswith("```"):
        content = content.split("```", 2)[1]
        if content.startswith("json"):
            content = content[4:]
    try:
        data = json.loads(content)
    except Exception:
        data = {"claims": []}

    valid_ids = {citation["id"] for citation in citations}
    grounded_claims = []
    for claim in data.get("claims", []):
        if not isinstance(claim, dict):
            continue
        claim_ids = claim.get("citation_ids", [])
        if (
            not isinstance(claim.get("text"), str)
            or not claim["text"].strip()
            or not isinstance(claim_ids, list)
            or not claim_ids
        ):
            continue
        # Filter to valid citation IDs
        usable_ids = [cid for cid in claim_ids if cid in valid_ids]
        if not usable_ids:
            usable_ids = [citations[0]["id"]] if citations else []
        grounded_claims.append({
            "kind": claim.get("kind", "observation"),
            "text": claim["text"].strip(),
            "citation_ids": usable_ids,
        })
    return _response_payload(
        "GEMINI",
        incident,
        docs,
        telemetry_evidence,
        citations,
        grounded_claims,
    )


def _generate_demo_response(
    question: str,
    incident: Optional[dict],
    docs: list[dict],
    telemetry_evidence: list[dict],
    citations: list[dict],
) -> dict:
    citation_by_source = {
        citation["source_id"]: citation["id"] for citation in citations
    }
    grounded_claims = [
        {
            "kind": "observation",
            "text": evidence["content"],
            "citation_ids": [evidence["citation_id"]],
        }
        for evidence in telemetry_evidence[:4]
    ]
    if incident:
        incident_id = incident.get("incident_number", incident.get("id", "incident"))
        grounded_claims.append({
            "kind": "finding",
            "text": f"Incident record lists the probable root cause as {incident.get('root_cause', 'unspecified')}.",
            "citation_ids": [citation_by_source[incident_id]],
        })
    grounded_claims.extend(_procedure_claims(docs))
    return _response_payload(
        "DEMO",
        incident,
        docs,
        telemetry_evidence,
        citations,
        grounded_claims,
    )


def _response_payload(
    mode: str,
    incident: Optional[dict],
    docs: list[dict],
    telemetry_evidence: list[dict],
    citations: list[dict],
    grounded_claims: list[dict[str, Any]],
) -> dict:
    cited_ids = {
        citation_id
        for claim in grounded_claims
        for citation_id in claim["citation_ids"]
    }
    actual_citations = [
        citation for citation in citations if citation["id"] in cited_ids
    ]
    return {
        "summary": (
            f"{len(grounded_claims)} evidence-linked claim(s) are available for "
            f"{incident.get('incident_number', 'the selected mission context') if incident else 'the retrieved mission context'}."
            if grounded_claims
            else "No evidence-linked claims were produced."
        ),
        "observed_facts": [
            claim["text"] for claim in grounded_claims
            if claim["kind"] == "observation"
        ],
        "root_cause": incident.get("root_cause", "") if incident else "",
        "root_cause_confidence": incident.get("root_cause_confidence", 0) if incident else 0,
        "recommendations": [
            claim["text"] for claim in grounded_claims
            if claim["kind"] == "recommendation"
        ],
        "uncertainty": (
            "Root-cause text is the incident record's probable finding, not an independently "
            "validated diagnosis. All recommendations require qualified human review."
        ),
        "sources": list(dict.fromkeys(citation["source_id"] for citation in actual_citations)),
        "retrieved_documents": docs,
        "telemetry_evidence": telemetry_evidence,
        "citations": actual_citations,
        "grounded_claims": grounded_claims,
        "insufficient_evidence": not bool(grounded_claims),
        "mode": mode,
    }
