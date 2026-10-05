from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

def generate_telemetry_evidence(telemetry_snapshot: dict, root_cause: str) -> List[dict]:
    """Generate telemetry-based evidence for an incident."""
    evidence = []
    
    NORMAL_VALUES = {
        "battery_voltage": (28.0, "V"),
        "battery_current": (5.0, "A"),
        "battery_temperature": (25.0, "°C"),
        "solar_power": (2.0, "kW"),
        "power_consumption": (8.5, "W"),
        "cpu_temperature": (45.0, "°C"),
        "cpu_load": (35.0, "%"),
        "memory_usage": (60.0, "%"),
        "communication_signal": (-75.0, "dBm"),
        "packet_loss": (0.5, "%"),
        "communication_latency": (250.0, "ms"),
        "payload_temperature": (20.0, "°C"),
        "reaction_wheel_speed": (3000.0, "RPM"),
    }
    
    for field, (normal, unit) in NORMAL_VALUES.items():
        val = telemetry_snapshot.get(field)
        if val is None:
            continue
        
        deviation_pct = abs(val - normal) / (abs(normal) + 1e-6) * 100
        
        if deviation_pct > 5:  # Only include significant deviations
            direction = "increased" if val > normal else "decreased"
            display_name = field.replace("_", " ").title()
            
            evidence.append({
                "type": "telemetry",
                "field": field,
                "title": f"{display_name} deviation",
                "content": f"{display_name} has {direction} by {deviation_pct:.1f}% from nominal. Current: {val:.2f} {unit}. Normal: {normal:.2f} {unit}.",
                "current_value": val,
                "normal_value": normal,
                "unit": unit,
                "deviation_pct": round(deviation_pct, 1),
                "relevance_score": min(1.0, deviation_pct / 50.0)
            })
    
    # Sort by relevance
    evidence.sort(key=lambda x: x["relevance_score"], reverse=True)
    return evidence[:8]  # Top 8 pieces of evidence
