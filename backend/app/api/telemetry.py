from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.telemetry_service import sim_state

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])
stream_router = APIRouter(tags=["telemetry"])

@router.get("/latest")
async def get_latest_telemetry():
    if sim_state.current_telemetry is None:
        return {"status": "no_data", "data": None}
    return {"status": "ok", "data": sim_state.current_telemetry}

@router.get("/history")
async def get_telemetry_history(limit: int = 100):
    with sim_state._lock:
        history = list(sim_state.telemetry_history)[-max(0, min(limit, 500)):]
    return {"status": "ok", "count": len(history), "data": history}

@router.websocket("/ws")
@stream_router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    sim_state.websocket_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        sim_state.websocket_clients.discard(websocket)
    except Exception:
        sim_state.websocket_clients.discard(websocket)
