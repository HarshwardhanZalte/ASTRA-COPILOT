import numpy as np
import pandas as pd
from typing import List, Optional, Dict
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "battery_voltage", "battery_current", "battery_temperature",
    "solar_power", "power_consumption",
    "cpu_temperature", "cpu_load", "memory_usage",
    "communication_signal", "packet_loss", "communication_latency",
    "payload_temperature", "reaction_wheel_speed"
]

NORMAL_MEANS = {
    "battery_voltage": 28.0, "battery_current": 5.0, "battery_temperature": 25.0,
    "solar_power": 1.5, "power_consumption": 8.5,
    "cpu_temperature": 45.0, "cpu_load": 35.0, "memory_usage": 60.0,
    "communication_signal": -75.0, "packet_loss": 0.5, "communication_latency": 250.0,
    "payload_temperature": 20.0, "reaction_wheel_speed": 3000.0
}

def impute_missing(telemetry: dict) -> dict:
    result = dict(telemetry)
    for col in FEATURE_COLUMNS:
        if result.get(col) is None:
            result[col] = NORMAL_MEANS.get(col, 0.0)
    return result

def telemetry_to_features(telemetry: dict) -> np.ndarray:
    telemetry = impute_missing(telemetry)
    return np.array([float(telemetry.get(col, NORMAL_MEANS.get(col, 0.0))) for col in FEATURE_COLUMNS])

def telemetry_list_to_df(telemetry_list: List[dict]) -> pd.DataFrame:
    rows = []
    for t in telemetry_list:
        t = impute_missing(t)
        row = {col: float(t.get(col, NORMAL_MEANS.get(col, 0.0))) for col in FEATURE_COLUMNS}
        rows.append(row)
    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)
