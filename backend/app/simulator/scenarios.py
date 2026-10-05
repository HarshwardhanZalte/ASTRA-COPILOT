from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from app.simulator.faults import FaultType, FaultSeverity
from app.simulator.noise import NoiseConfig

@dataclass
class SimulationScenario:
    name: str
    fault_type: FaultType = FaultType.NONE
    severity: FaultSeverity = FaultSeverity.MEDIUM
    description: str = ""

SCENARIOS = {
    "normal": SimulationScenario(
        name="Normal Mission",
        fault_type=FaultType.NONE,
        description="Nominal spacecraft operations. All systems nominal."
    ),
    "battery_degradation": SimulationScenario(
        name="Battery Degradation",
        fault_type=FaultType.BATTERY_DEGRADATION,
        severity=FaultSeverity.HIGH,
        description="Progressive battery degradation with voltage drop and temperature rise."
    ),
    "thermal_runaway": SimulationScenario(
        name="Thermal Runaway",
        fault_type=FaultType.THERMAL_RUNAWAY,
        severity=FaultSeverity.HIGH,
        description="Uncontrolled thermal increase in CPU and payload subsystems."
    ),
    "communication_failure": SimulationScenario(
        name="Communication Failure",
        fault_type=FaultType.COMMUNICATION_FAILURE,
        severity=FaultSeverity.HIGH,
        description="Progressive signal degradation with increasing packet loss."
    ),
    "sensor_drift": SimulationScenario(
        name="Sensor Drift",
        fault_type=FaultType.SENSOR_DRIFT,
        severity=FaultSeverity.MEDIUM,
        description="Gradual sensor drift causing systematic measurement error."
    ),
}
