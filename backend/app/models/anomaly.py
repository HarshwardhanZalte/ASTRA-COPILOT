from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class AnomalyRecord(Base):
    __tablename__ = "anomalies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    spacecraft_id = Column(String(50), nullable=False)
    detected_at = Column(DateTime, nullable=False, index=True)
    
    anomaly_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # LOW/MEDIUM/HIGH/CRITICAL
    
    subsystem_scores = Column(JSON, nullable=True)  # {power: 0.9, thermal: 0.2, ...}
    root_cause = Column(String(100), nullable=True)
    root_cause_confidence = Column(Float, nullable=True)
    
    telemetry_snapshot = Column(JSON, nullable=True)
    features = Column(JSON, nullable=True)
    
    incident_id = Column(UUID(as_uuid=True), nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
