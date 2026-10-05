import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, create_tables
from app.rag.vector_store import load_all_documents
from app.ml.anomaly_detector import get_detector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ASTRA-COPILOT starting up")

    db_connected = init_db()
    if db_connected:
        create_tables()
        logger.info("Database initialized")
    else:
        logger.warning("Running without database \u2014 using in-memory storage")

    logger.info("Initializing ML anomaly detector...")
    detector = get_detector()
    logger.info("ML detector ready")

    logger.info("Loading knowledge base...")
    try:
        count = load_all_documents()
        logger.info(f"Knowledge base loaded: {count} documents")
    except Exception as e:
        logger.warning(f"Knowledge base loading failed: {e}")

    from app.services.mock_data import seed_mock_data
    mock_data_status = seed_mock_data()
    logger.info(
        "Demo data ready: %s telemetry samples, %s incidents",
        mock_data_status["telemetry_records"],
        mock_data_status["incidents"],
    )

    logger.info("ASTRA-COPILOT ready")
    yield

    logger.info("ASTRA-COPILOT shutting down")
    from app.services.telemetry_service import sim_state
    sim_state.running = False

app = FastAPI(
    title="ASTRA-COPILOT",
    description="Explainable Spacecraft Anomaly Detection & Mission Operations Copilot",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import telemetry, anomalies, incidents, copilot, simulator
app.include_router(telemetry.router)
app.include_router(telemetry.stream_router)
app.include_router(anomalies.router)
app.include_router(incidents.router)
app.include_router(copilot.router)
app.include_router(simulator.router)

@app.get("/api/health")
async def health():
    from app.services.telemetry_service import sim_state
    return {
        "status": "healthy",
        "service": "ASTRA-COPILOT",
        "version": "1.0.0",
        "simulation_running": sim_state.running
    }

@app.get("/api/system/status")
async def system_status():
    from app.services.telemetry_service import sim_state
    from app.ml.anomaly_detector import _detector
    from app.rag.vector_store import get_all_documents
    docs = get_all_documents()
    return {
        "spacecraft_id": "SAT-01",
        "simulation": {
            "running": sim_state.running,
            "scenario": sim_state.scenario,
            "fault_active": sim_state.fault_type.value != "none",
            "telemetry_count": len(sim_state.telemetry_history),
            "demo_data_loaded": sim_state.demo_data_loaded
        },
        "ml": {
            "detector_trained": _detector is not None and _detector.is_trained,
            "model_type": "Isolation Forest"
        },
        "rag": {
            "documents_loaded": len(docs),
            "copilot_mode": "GEMINI" if settings.GEMINI_API_KEY else "DEMO"
        },
        "database": {
            "connected": False
        }
    }
