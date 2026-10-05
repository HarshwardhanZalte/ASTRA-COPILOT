import numpy as np
from datetime import datetime
import time
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Normal operating ranges (realistic spacecraft values)
NORMAL_RANGES = {
    "battery_voltage": {"mean": 28.0, "std": 0.3, "min": 26.0, "max": 30.0},
    "battery_current": {"mean": 5.0, "std": 0.2, "min": 4.0, "max": 7.0},
    "battery_temperature": {"mean": 25.0, "std": 1.0, "min": 15.0, "max": 35.0},
    "solar_power": {"mean": 2.0, "std": 0.1, "min": 0.0, "max": 3.0},
    "power_consumption": {"mean": 8.5, "std": 0.3, "min": 6.0, "max": 12.0},
    "cpu_temperature": {"mean": 45.0, "std": 2.0, "min": 30.0, "max": 70.0},
    "cpu_load": {"mean": 35.0, "std": 5.0, "min": 5.0, "max": 95.0},
    "memory_usage": {"mean": 60.0, "std": 3.0, "min": 20.0, "max": 90.0},
    "communication_signal": {"mean": -75.0, "std": 2.0, "min": -95.0, "max": -60.0},
    "packet_loss": {"mean": 0.5, "std": 0.2, "min": 0.0, "max": 3.0},
    "communication_latency": {"mean": 250.0, "std": 15.0, "min": 100.0, "max": 500.0},
    "payload_temperature": {"mean": 20.0, "std": 1.0, "min": 10.0, "max": 40.0},
    "reaction_wheel_speed": {"mean": 3000.0, "std": 50.0, "min": 2500.0, "max": 3500.0},
}

# Add slow orbital variations (sinusoidal)
ORBITAL_PERIOD = 90 * 60  # 90-minute orbit in seconds

def generate_base_telemetry(spacecraft_id: str, timestamp: Optional[datetime] = None) -> dict:
    """Generate a single realistic telemetry reading."""
    if timestamp is None:
        timestamp = datetime.utcnow()
    
    t_seconds = timestamp.timestamp()
    orbital_phase = (t_seconds % ORBITAL_PERIOD) / ORBITAL_PERIOD  # 0 to 1
    orbital_factor = np.sin(2 * np.pi * orbital_phase)  # -1 to 1
    
    telemetry = {"spacecraft_id": spacecraft_id, "timestamp": timestamp.isoformat()}
    
    for field, params in NORMAL_RANGES.items():
        base = params["mean"]
        
        # Add orbital variation for certain fields
        if field == "solar_power":
            # Solar power varies with orbit (eclipse periods)
            base = params["mean"] * max(0, np.sin(2 * np.pi * orbital_phase))
        elif field == "battery_voltage":
            # Slightly lower during eclipse
            base = params["mean"] + 0.3 * orbital_factor
        elif field == "cpu_temperature":
            # Slightly higher during operations
            base = params["mean"] + 2 * abs(orbital_factor)
        
        # Add Gaussian noise
        value = base + np.random.normal(0, params["std"])
        # Clip to realistic range
        value = np.clip(value, params["min"], params["max"])
        
        telemetry[field] = round(float(value), 3)
    
    return telemetry

def get_parameter_status(field: str, value: float, fault_active: bool = False) -> str:
    """Determine status of a telemetry parameter."""
    if value is None:
        return "MISSING"
    
    params = NORMAL_RANGES.get(field)
    if params is None:
        return "UNKNOWN"
    
    mean = params["mean"]
    std = params["std"]
    min_val = params["min"]
    max_val = params["max"]
    
    # Check against thresholds
    deviation = abs(value - mean) / (std + 1e-6)
    
    if value < min_val or value > max_val:
        return "CRITICAL"
    elif deviation > 3:
        return "WARNING"
    else:
        return "NORMAL"

def get_all_statuses(telemetry: dict) -> dict:
    """Get status for all telemetry parameters."""
    statuses = {}
    for field in NORMAL_RANGES.keys():
        val = telemetry.get(field)
        if val is None:
            statuses[field] = "MISSING"
        else:
            statuses[field] = get_parameter_status(field, val)
    return statuses
