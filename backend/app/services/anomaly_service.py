from typing import List, Optional
from collections import deque
import threading

_anomalies = deque(maxlen=200)
_lock = threading.Lock()

def store_anomaly(anomaly: dict):
    with _lock:
        _anomalies.append(anomaly)

def get_anomalies(limit: int = 50) -> List[dict]:
    with _lock:
        return list(_anomalies)[-limit:]

def get_latest_anomaly() -> Optional[dict]:
    with _lock:
        if _anomalies:
            return _anomalies[-1]
        return None
