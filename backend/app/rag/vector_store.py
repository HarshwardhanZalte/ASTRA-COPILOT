import logging
import uuid
from typing import List, Optional, Dict
from pathlib import Path
from app.rag.embeddings import embed_text
import numpy as np

logger = logging.getLogger(__name__)

_docs: List[Dict] = []
_embeddings: List[Optional[List[float]]] = []

def add_document(doc_id: str, title: str, content: str, doc_type: str, subsystem: Optional[str] = None):
    embedding = embed_text(content)
    doc = {
        "id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "title": title,
        "content": content,
        "doc_type": doc_type,
        "subsystem": subsystem,
    }
    _docs.append(doc)
    _embeddings.append(embedding)
    return doc

def search_similar(query: str, top_k: int = 4) -> List[Dict]:
    if not _docs:
        return []

    query_embedding = embed_text(query)
    if query_embedding is None:
        return keyword_search(query, top_k)

    q = np.array(query_embedding)
    scores = []
    for emb in _embeddings:
        if emb is None:
            scores.append(0.0)
        else:
            e = np.array(emb)
            sim = float(np.dot(q, e) / (np.linalg.norm(q) * np.linalg.norm(e) + 1e-8))
            scores.append(sim)

    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    results = []
    for i in top_indices:
        doc = dict(_docs[i])
        doc["similarity_score"] = round(scores[i], 3)
        results.append(doc)

    return results

def keyword_search(query: str, top_k: int = 4) -> List[Dict]:
    query_lower = query.lower()
    scored = []
    for doc in _docs:
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()
        words = query_lower.split()
        score = sum(1 for w in words if w in content_lower or w in title_lower)
        if score > 0:
            d = dict(doc)
            d["similarity_score"] = score / len(words)
            scored.append(d)
    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored[:top_k]

def load_all_documents():
    data_dir = Path(__file__).parent.parent.parent / "data"
    logger.info(f"Loading documents from {data_dir}")

    count = 0
    for txt_file in data_dir.rglob("*.txt"):
        try:
            with open(txt_file, "r", encoding="utf-8") as f:
                content = f.read().strip()

            rel_path = txt_file.relative_to(data_dir)
            parts = rel_path.parts

            if "procedures" in parts:
                doc_type = "procedure"
            elif "incidents" in parts:
                doc_type = "incident"
            elif "logs" in parts:
                doc_type = "log"
            else:
                doc_type = "document"

            subsystem = None
            name_lower = txt_file.stem.lower()
            if "power" in name_lower or "battery" in name_lower:
                subsystem = "power"
            elif "thermal" in name_lower:
                subsystem = "thermal"
            elif "communication" in name_lower or "comms" in name_lower:
                subsystem = "communication"
            elif "safe" in name_lower:
                subsystem = "all"

            title = txt_file.stem.replace("_", " ").title()
            add_document(
                doc_id=txt_file.stem,
                title=title,
                content=content,
                doc_type=doc_type,
                subsystem=subsystem
            )
            count += 1
            logger.info(f"Loaded document: {txt_file.stem}")
        except Exception as e:
            logger.error(f"Failed to load {txt_file}: {e}")

    logger.info(f"Loaded {count} documents into vector store")
    return count

def get_all_documents() -> List[Dict]:
    return _docs
