"""Utility for saving/loading trained models to disk."""
import joblib
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent.parent / "ml" / "models"

def save_detector(detector, filename: str = "isolation_forest.joblib"):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    path = MODEL_DIR / filename
    joblib.dump({"scaler": detector.scaler, "model": detector.model}, path)
    logger.info(f"Model saved to {path}")

def load_detector(filename: str = "isolation_forest.joblib"):
    path = MODEL_DIR / filename
    if not path.exists():
        return None
    data = joblib.load(path)
    return data
