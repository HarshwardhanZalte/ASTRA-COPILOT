import numpy as np
from typing import Optional

class NoiseConfig:
    def __init__(
        self,
        noise_enabled: bool = False,
        noise_level: float = 0.02,
        missing_enabled: bool = False,
        missing_rate: float = 0.05,
        delay_enabled: bool = False,
        delay_seconds: float = 5.0,
        outlier_enabled: bool = False,
        outlier_rate: float = 0.01
    ):
        self.noise_enabled = noise_enabled
        self.noise_level = noise_level
        self.missing_enabled = missing_enabled
        self.missing_rate = missing_rate
        self.delay_enabled = delay_enabled
        self.delay_seconds = delay_seconds
        self.outlier_enabled = outlier_enabled
        self.outlier_rate = outlier_rate

def apply_noise(value: float, noise_level: float = 0.02) -> float:
    """Add Gaussian noise to a sensor value."""
    return value * (1 + np.random.normal(0, noise_level))

def apply_missing(value: float, missing_rate: float = 0.05) -> Optional[float]:
    """Randomly make a value missing."""
    if np.random.random() < missing_rate:
        return None
    return value

def apply_outlier(value: float, outlier_rate: float = 0.01, magnitude: float = 5.0) -> float:
    """Occasionally inject an unrealistic outlier."""
    if np.random.random() < outlier_rate:
        direction = 1 if np.random.random() > 0.5 else -1
        return value + direction * value * magnitude * np.random.random()
    return value

def process_telemetry_with_noise(telemetry: dict, config: NoiseConfig) -> dict:
    """Apply all configured noise to a telemetry reading."""
    result = dict(telemetry)
    numeric_fields = [
        "battery_voltage", "battery_current", "battery_temperature",
        "solar_power", "power_consumption", "cpu_temperature",
        "cpu_load", "memory_usage", "communication_signal",
        "packet_loss", "communication_latency", "payload_temperature",
        "reaction_wheel_speed"
    ]
    
    quality_flags = {}
    
    for field in numeric_fields:
        if field not in result or result[field] is None:
            continue
        
        val = result[field]
        field_quality = "NOMINAL"
        
        if config.noise_enabled:
            val = apply_noise(val, config.noise_level)
            field_quality = "NOISY"
        
        if config.outlier_enabled:
            new_val = apply_outlier(val, config.outlier_rate)
            if new_val != val:
                field_quality = "OUTLIER"
            val = new_val
        
        if config.missing_enabled:
            val = apply_missing(val, config.missing_rate)
            if val is None:
                field_quality = "MISSING"
        
        result[field] = val
        quality_flags[field] = field_quality
    
    result["data_quality"] = quality_flags
    return result
