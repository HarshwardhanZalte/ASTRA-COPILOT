from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.telemetry_service import (
    start_simulation, pause_simulation, reset_simulation,
    inject_fault, update_noise_config, sim_state
)
from app.simulator.faults import FaultType, FaultSeverity
from app.simulator.noise import NoiseConfig

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class FaultRequest(BaseModel):
    fault_type: str
    severity: str = "HIGH"

class ConditionsRequest(BaseModel):
    noise_enabled: bool = False
    noise_level: float = 0.02
    missing_enabled: bool = False
    missing_rate: float = 0.05
    delay_enabled: bool = False
    delay_seconds: float = Field(default=5.0, ge=0.0, le=120.0)
    outlier_enabled: bool = False
    outlier_rate: float = 0.01

@router.post("/start")
async def start():
    return await start_simulation()

@router.post("/pause")
async def pause():
    return await pause_simulation()

@router.post("/reset")
async def reset():
    return await reset_simulation()

@router.post("/fault")
async def inject_fault_endpoint(request: FaultRequest):
    try:
        fault_type = FaultType(request.fault_type)
        severity = FaultSeverity(request.severity.upper())
    except ValueError as e:
        return {"error": str(e)}
    if not sim_state.running:
        await start_simulation()
    return inject_fault(fault_type, severity)

@router.post("/fault/battery")
async def inject_battery_fault(severity: str = "HIGH"):
    if not sim_state.running:
        await start_simulation()
    return inject_fault(FaultType.BATTERY_DEGRADATION, FaultSeverity(severity.upper()))

@router.post("/fault/thermal")
async def inject_thermal_fault(severity: str = "HIGH"):
    if not sim_state.running:
        await start_simulation()
    return inject_fault(FaultType.THERMAL_RUNAWAY, FaultSeverity(severity.upper()))

@router.post("/fault/communication")
async def inject_communication_fault(severity: str = "HIGH"):
    if not sim_state.running:
        await start_simulation()
    return inject_fault(FaultType.COMMUNICATION_FAILURE, FaultSeverity(severity.upper()))

@router.post("/fault/sensor-drift")
async def inject_sensor_drift(severity: str = "MEDIUM"):
    if not sim_state.running:
        await start_simulation()
    return inject_fault(FaultType.SENSOR_DRIFT, FaultSeverity(severity.upper()))

@router.post("/clear-fault")
async def clear_fault():
    sim_state.fault_type = FaultType.NONE
    sim_state.fault_injected_at = None
    sim_state.scenario = "normal"
    sim_state.add_event("Fault cleared — returning to normal operations", "INFO")
    return {"status": "fault_cleared"}

@router.post("/conditions")
async def set_conditions(request: ConditionsRequest):
    config = NoiseConfig(
        noise_enabled=request.noise_enabled,
        noise_level=request.noise_level,
        missing_enabled=request.missing_enabled,
        missing_rate=request.missing_rate,
        delay_enabled=request.delay_enabled,
        delay_seconds=request.delay_seconds,
        outlier_enabled=request.outlier_enabled,
        outlier_rate=request.outlier_rate
    )
    return update_noise_config(config)

@router.get("/status")
async def get_status():
    return {
        "running": sim_state.running,
        "spacecraft_id": sim_state.spacecraft_id,
        "scenario": sim_state.scenario,
        "fault_type": sim_state.fault_type.value if sim_state.fault_type else "none",
        "fault_severity": sim_state.fault_severity.value if sim_state.fault_severity else "MEDIUM",
        "fault_active": sim_state.fault_type != FaultType.NONE,
        "noise_config": {
            "noise_enabled": sim_state.noise_config.noise_enabled,
            "missing_enabled": sim_state.noise_config.missing_enabled,
            "delay_enabled": sim_state.noise_config.delay_enabled,
            "delay_seconds": sim_state.noise_config.delay_seconds,
            "outlier_enabled": sim_state.noise_config.outlier_enabled,
        },
        "delivery": {
            "pending_packets": sim_state.delivery_buffer.pending_count,
            "delayed_packets": sim_state.delivery_buffer.delayed_count,
            "out_of_order_packets": sim_state.delivery_buffer.out_of_order_count,
        },
        "telemetry_count": len(sim_state.telemetry_history),
        "client_count": len(sim_state.websocket_clients),
        "demo_data_loaded": sim_state.demo_data_loaded
    }

@router.get("/events")
async def get_events():
    return {"events": list(sim_state.event_log)}
