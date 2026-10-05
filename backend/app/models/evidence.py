from sqlalchemy import Column, String, Float, DateTime, Boolean, JSON, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    Vector = None

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id = Column(String(100), nullable=False, unique=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    doc_type = Column(String(50), nullable=False)  # procedure/incident/log
    subsystem = Column(String(50), nullable=True)
    chunk_index = Column(Integer, default=0)
    total_chunks = Column(Integer, default=1)
    
    # pgvector embedding - 384 dims for all-MiniLM-L6-v2
    embedding = Column(Vector(384) if HAS_PGVECTOR and Vector else JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    evidence_type = Column(String(50), nullable=False)  # telemetry/document
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    relevance_score = Column(Float, nullable=True)
    
    source_id = Column(String(100), nullable=True)
    source_type = Column(String(50), nullable=True)
    
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
