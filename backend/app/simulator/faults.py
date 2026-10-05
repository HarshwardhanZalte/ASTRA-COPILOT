from enum import Enum

class FaultType(str, Enum):
    NONE = "none"
    BATTERY_DEGRADATION = "battery_degradation"
    THERMAL_RUNAWAY = "thermal_runaway"
    COMMUNICATION_FAILURE = "communication_failure"
    SENSOR_DRIFT = "sensor_drift"

class FaultSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

SEVERITY_MULTIPLIERS = {
    FaultSeverity.LOW: 0.25,
    FaultSeverity.MEDIUM: 0.5,
    FaultSeverity.HIGH: 0.75,
    FaultSeverity.CRITICAL: 1.0
}

def apply_battery_degradation(telemetry: dict, severity: FaultSeverity, elapsed_seconds: float) -> dict:
    """Degrade battery: voltage down, current up, temperature up."""
    m = SEVERITY_MULTIPLIERS[severity]
    t = min(elapsed_seconds / 60.0, 1.0)  # 0→1 over 1 minute
    
    result = dict(telemetry)
    if result.get("battery_voltage") is not None:
        result["battery_voltage"] *= (1 - 0.20 * m * t)  # up to 20% drop
    if result.get("battery_current") is not None:
        result["battery_current"] *= (1 + 0.40 * m * t)  # up to 40% increase
    if result.get("battery_temperature") is not None:
        result["battery_temperature"] += 15 * m * t  # up to +15°C
    if result.get("power_consumption") is not None:
        result["power_consumption"] *= (1 + 0.15 * m * t)
    return result

def apply_thermal_runaway(telemetry: dict, severity: FaultSeverity, elapsed_seconds: float) -> dict:
    """Thermal runaway: CPU and payload temps rise sharply."""
    m = SEVERITY_MULTIPLIERS[severity]
    t = min(elapsed_seconds / 45.0, 1.0)  # faster progression
    
    result = dict(telemetry)
    if result.get("cpu_temperature") is not None:
        result["cpu_temperature"] += 30 * m * t
    if result.get("payload_temperature") is not None:
        result["payload_temperature"] += 25 * m * t
    if result.get("power_consumption") is not None:
        result["power_consumption"] *= (1 + 0.30 * m * t)
    if result.get("cpu_load") is not None:
        result["cpu_load"] = min(100, result["cpu_load"] + 40 * m * t)
    return result

def apply_communication_failure(telemetry: dict, severity: FaultSeverity, elapsed_seconds: float) -> dict:
    """Communication degradation: signal drops, packet loss rises."""
    m = SEVERITY_MULTIPLIERS[severity]
    t = min(elapsed_seconds / 50.0, 1.0)
    
    result = dict(telemetry)
    if result.get("communication_signal") is not None:
        result["communication_signal"] *= (1 + 0.60 * m * t)
    if result.get("packet_loss") is not None:
        result["packet_loss"] = min(100, result["packet_loss"] + 45 * m * t)
    if result.get("communication_latency") is not None:
        result["communication_latency"] *= (1 + 3.0 * m * t)
    return result

def apply_sensor_drift(telemetry: dict, severity: FaultSeverity, elapsed_seconds: float) -> dict:
    """Sensor drift: values gradually and consistently diverge."""
    m = SEVERITY_MULTIPLIERS[severity]
    t = elapsed_seconds / 120.0  # slow drift over 2 minutes
    
    result = dict(telemetry)
    # Battery voltage drifts high (sensor reads wrong)
    if result.get("battery_voltage") is not None:
        drift = 0.15 * m * t
        result["battery_voltage"] *= (1 + drift)
    # CPU temp drifts low (sensor reads too cool)
    if result.get("cpu_temperature") is not None:
        drift = 0.10 * m * t
        result["cpu_temperature"] *= (1 - drift)
    return result

def apply_fault(telemetry: dict, fault_type: FaultType, severity: FaultSeverity, elapsed_seconds: float) -> dict:
    """Apply the appropriate fault to telemetry."""
    if fault_type == FaultType.BATTERY_DEGRADATION:
        return apply_battery_degradation(telemetry, severity, elapsed_seconds)
    elif fault_type == FaultType.THERMAL_RUNAWAY:
        return apply_thermal_runaway(telemetry, severity, elapsed_seconds)
    elif fault_type == FaultType.COMMUNICATION_FAILURE:
        return apply_communication_failure(telemetry, severity, elapsed_seconds)
    elif fault_type == FaultType.SENSOR_DRIFT:
        return apply_sensor_drift(telemetry, severity, elapsed_seconds)
    return telemetry
