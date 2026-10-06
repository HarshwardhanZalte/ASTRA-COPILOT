import asyncio
import logging
from datetime import datetime
from typing import Optional, Set
from collections import deque
import threading
from app.simulator.generator import generate_base_telemetry, get_all_statuses
from app.simulator.faults import FaultType, FaultSeverity, apply_fault
from app.simulator.noise import NoiseConfig, process_telemetry_with_noise
from app.simulator.delivery import TelemetryDeliveryBuffer
from app.ml.anomaly_detector import get_detector
from app.services.incident_service import (
    create_incident_from_anomaly,
    get_latest_incident_counter,
)

logger = logging.getLogger(__name__)

class SimulationState:
    def __init__(self):
        self.running = False
        self.spacecraft_id = "SAT-01"
        self.scenario = "normal"
        self.fault_type = FaultType.NONE
        self.fault_severity = FaultSeverity.MEDIUM
        self.fault_injected_at: Optional[datetime] = None
        self.noise_config = NoiseConfig()
        self.telemetry_history: deque = deque(maxlen=500)
        self.current_telemetry: Optional[dict] = None
        self.event_log: deque = deque(maxlen=100)
        self.demo_data_loaded = False
        self.websocket_clients: Set = set()
        self.start_time: Optional[datetime] = None
        self._lock = threading.Lock()
        self.tick_interval = 1.0
        self._task: Optional[asyncio.Task] = None
        self.delivery_buffer = TelemetryDeliveryBuffer()

    def add_event(self, message: str, event_type: str = "INFO"):
        self.event_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
            "type": event_type
        })

    def get_elapsed_fault_seconds(self) -> float:
        if self.fault_injected_at is None:
            return 0.0
        return (datetime.utcnow() - self.fault_injected_at).total_seconds()

sim_state = SimulationState()

async def simulation_loop():
    logger.info("Simulation loop started")
    sim_state.add_event("Simulation started", "INFO")

    detector = get_detector()
    incident_counter = [get_latest_incident_counter()]
    last_anomaly_reported = [False]
    event_loop = asyncio.get_running_loop()
    if sim_state.current_telemetry:
        timestamp = sim_state.current_telemetry.get("timestamp")
        if timestamp:
            sim_state.delivery_buffer.latest_event_time = datetime.fromisoformat(timestamp)

    while sim_state.running:
        try:
            now = datetime.utcnow()
            telemetry = generate_base_telemetry(sim_state.spacecraft_id, now)

            fault_active = sim_state.fault_type != FaultType.NONE
            if fault_active:
                elapsed = sim_state.get_elapsed_fault_seconds()
                telemetry = apply_fault(
                    telemetry,
                    sim_state.fault_type,
                    sim_state.fault_severity,
                    elapsed
                )

            telemetry = process_telemetry_with_noise(telemetry, sim_state.noise_config)
            statuses = get_all_statuses(telemetry)
            telemetry["statuses"] = statuses
            telemetry["fault_active"] = fault_active
            telemetry["scenario"] = sim_state.scenario

            config = sim_state.noise_config
            delay = config.delay_seconds if config.delay_enabled else 0.0
            sim_state.delivery_buffer.enqueue(telemetry, delay, event_loop.time())

            for arrived in sim_state.delivery_buffer.pop_ready(event_loop.time()):
                event_time = datetime.fromisoformat(arrived["timestamp"])

                ml_result = detector.predict(arrived)
                arrived["ml"] = ml_result

                if ml_result["is_anomaly"] and not last_anomaly_reported[0]:
                    last_anomaly_reported[0] = True
                    sim_state.add_event(
                        f"ML anomaly detected (score: {ml_result['anomaly_score']:.2f})",
                        "ANOMALY",
                    )
                    sim_state.add_event(f"{ml_result['root_cause']} identified", "ANALYSIS")
                    incident_counter[0] += 1
                    create_incident_from_anomaly(ml_result, arrived, incident_counter[0])
                    sim_state.add_event(
                        f"Incident INC-{incident_counter[0]:04d} created", "INCIDENT"
                    )
                elif not ml_result["is_anomaly"]:
                    last_anomaly_reported[0] = False

                with sim_state._lock:
                    sim_state.telemetry_history.append(arrived)
                    if (
                        sim_state.delivery_buffer.latest_event_time == event_time
                        or sim_state.current_telemetry is None
                    ):
                        sim_state.current_telemetry = arrived

                await broadcast_telemetry(arrived)

        except Exception as e:
            logger.error(f"Simulation loop error: {e}")

        await asyncio.sleep(sim_state.tick_interval)

    logger.info("Simulation loop stopped")
    sim_state.add_event("Simulation stopped", "INFO")

async def broadcast_telemetry(telemetry: dict):
    import json
    if not sim_state.websocket_clients:
        return

    message = json.dumps(telemetry, default=str)
    disconnected = set()

    for ws in sim_state.websocket_clients:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)

    sim_state.websocket_clients -= disconnected

async def start_simulation():
    if sim_state.running:
        return {"status": "already_running"}
    sim_state.running = True
    sim_state.start_time = datetime.utcnow()
    sim_state._task = asyncio.create_task(simulation_loop())
    return {"status": "started"}

async def pause_simulation():
    sim_state.running = False
    if sim_state._task:
        sim_state._task.cancel()
    sim_state.add_event("Simulation paused", "INFO")
    return {"status": "paused"}

async def reset_simulation():
    sim_state.running = False
    if sim_state._task:
        sim_state._task.cancel()
    sim_state.fault_type = FaultType.NONE
    sim_state.fault_injected_at = None
    sim_state.scenario = "normal"
    sim_state.telemetry_history.clear()
    sim_state.delivery_buffer.clear()
    sim_state.event_log.clear()
    sim_state.current_telemetry = None
    from app.services.incident_service import clear_incidents
    from app.services.mock_data import reset_mock_data_seed, seed_mock_data
    clear_incidents()
    sim_state.demo_data_loaded = False
    reset_mock_data_seed()
    demo_data = seed_mock_data()
    sim_state.add_event("Simulation reset; demo history restored", "INFO")
    return {"status": "reset", "demo_data": demo_data}

def inject_fault(fault_type: FaultType, severity: FaultSeverity):
    sim_state.fault_type = fault_type
    sim_state.fault_severity = severity
    sim_state.fault_injected_at = datetime.utcnow()
    sim_state.scenario = fault_type.value
    msg = f"{fault_type.value.replace('_', ' ').title()} fault injected (severity: {severity.value})"
    sim_state.add_event(msg, "FAULT")
    return {"status": "injected", "fault_type": fault_type, "severity": severity}

def update_noise_config(config: NoiseConfig):
    sim_state.noise_config = config
    return {"status": "updated"}
