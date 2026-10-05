import logging
from typing import List, Optional
from app.config import settings
import numpy as np

logger = logging.getLogger(__name__)

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            _model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return None
    return _model

def embed_text(text: str) -> Optional[List[float]]:
    model = get_embedding_model()
    if model is None:
        return None
    try:
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return None

def embed_texts(texts: List[str]) -> Optional[List[List[float]]]:
    model = get_embedding_model()
    if model is None:
        return None
    try:
        embeddings = model.encode(texts, convert_to_numpy=True, batch_size=32)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Batch embedding error: {e}")
        return None
