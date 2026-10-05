from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class TelemetryRecord(Base):
    __tablename__ = "telemetry"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    spacecraft_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Power
    battery_voltage = Column(Float, nullable=True)
    battery_current = Column(Float, nullable=True)
    battery_temperature = Column(Float, nullable=True)
    solar_power = Column(Float, nullable=True)
    power_consumption = Column(Float, nullable=True)
    
    # Computing
    cpu_temperature = Column(Float, nullable=True)
    cpu_load = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    
    # Communication
    communication_signal = Column(Float, nullable=True)
    packet_loss = Column(Float, nullable=True)
    communication_latency = Column(Float, nullable=True)
    
    # Payload
    payload_temperature = Column(Float, nullable=True)
    reaction_wheel_speed = Column(Float, nullable=True)
    
    # Metadata
    scenario = Column(String(50), default="normal")
    fault_active = Column(Boolean, default=False)
    data_quality = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
