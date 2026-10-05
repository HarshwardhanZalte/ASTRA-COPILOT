from fastapi import APIRouter
from app.services.telemetry_service import sim_state

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

@router.get("")
async def get_anomalies(limit: int = 50):
    anomalies = []
    with sim_state._lock:
        history = list(sim_state.telemetry_history)

    for t in history:
        ml = t.get("ml", {})
        if ml.get("is_anomaly", False):
            anomalies.append({
                "timestamp": t.get("timestamp"),
                "spacecraft_id": t.get("spacecraft_id"),
                "anomaly_score": ml.get("anomaly_score"),
                "severity": ml.get("severity"),
                "confidence": ml.get("confidence"),
                "root_cause": ml.get("root_cause"),
                "subsystem_scores": ml.get("subsystem_scores")
            })

    return {"count": len(anomalies), "data": anomalies[-limit:]}

@router.get("/latest")
async def get_latest_anomaly():
    if sim_state.current_telemetry is None:
        return {"status": "no_data", "data": None}
    ml = sim_state.current_telemetry.get("ml", {})
    return {"status": "ok", "is_anomaly": ml.get("is_anomaly", False), "data": ml}
