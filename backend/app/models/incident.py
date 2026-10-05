from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_number = Column(String(20), nullable=False, unique=True)  # INC-0042
    spacecraft_id = Column(String(50), nullable=False)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), default="OPEN")  # OPEN/INVESTIGATING/RESOLVED/CLOSED
    
    root_cause = Column(String(100), nullable=True)
    root_cause_confidence = Column(Float, nullable=True)
    
    detected_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    anomaly_id = Column(UUID(as_uuid=True), nullable=True)
    telemetry_snapshot = Column(JSON, nullable=True)
    subsystem_scores = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentEvent(Base):
    __tablename__ = "incident_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    timestamp = Column(DateTime, nullable=False)
    event_type = Column(String(50), nullable=False)  # detection/analysis/recommendation/action
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=True)
    actor = Column(String(50), default="SYSTEM")  # SYSTEM/OPERATOR/AI
    
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
