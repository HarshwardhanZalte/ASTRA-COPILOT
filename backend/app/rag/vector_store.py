import logging
import re
import uuid
from typing import List, Optional, Dict
from pathlib import Path
from app.rag.embeddings import embed_text
import numpy as np

logger = logging.getLogger(__name__)

_docs: List[Dict] = []
_chunks: List[Dict] = []
_chunk_embeddings: List[Optional[List[float]]] = []

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
STOP_WORDS = {
    "a", "an", "and", "are", "be", "by", "can", "did", "do", "for", "from",
    "how", "i", "in", "is", "it", "me", "of", "on", "or", "our", "should",
    "the", "this", "to", "was", "we", "what", "when", "which", "with", "you",
}


def _terms(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in STOP_WORDS
    }


def _split_into_chunks(content: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", content) if part.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        while len(paragraph) > CHUNK_SIZE:
            piece, paragraph = paragraph[:CHUNK_SIZE], paragraph[CHUNK_SIZE:]
            if current:
                chunks.append(current)
                current = ""
            chunks.append(piece.strip())
        if current and len(current) + len(paragraph) + 2 > CHUNK_SIZE:
            chunks.append(current)
            current = current[-CHUNK_OVERLAP:] + "\n" + paragraph
        else:
            current = f"{current}\n{paragraph}".strip()
    if current:
        chunks.append(current)
    return chunks or [content]

def add_document(doc_id: str, title: str, content: str, doc_type: str, subsystem: Optional[str] = None):
    doc = {
        "id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "title": title,
        "content": content,
        "doc_type": doc_type,
        "subsystem": subsystem,
    }
    _docs.append(doc)
    for index, chunk_text in enumerate(_split_into_chunks(content), start=1):
        chunk = {
            "id": f"{doc_id}#chunk-{index:03d}",
            "citation_id": "",
            "doc_id": doc_id,
            "source_id": doc_id,
            "title": title,
            "content": chunk_text,
            "doc_type": doc_type,
            "subsystem": subsystem,
            "chunk_index": index,
        }
        _chunks.append(chunk)
        _chunk_embeddings.append(embed_text(chunk_text))
    return doc

def search_similar(query: str, top_k: int = 4) -> List[Dict]:
    if not _chunks:
        return []

    query_embedding = embed_text(query)
    if query_embedding is None:
        return keyword_search(query, top_k)

    q = np.array(query_embedding)
    query_terms = _terms(query)
    scored = []
    for index, emb in enumerate(_chunk_embeddings):
        if emb is None:
            cosine = 0.0
        else:
            e = np.array(emb)
            cosine = max(
                0.0,
                float(np.dot(q, e) / (np.linalg.norm(q) * np.linalg.norm(e) + 1e-8)),
            )
        chunk_terms = _terms(_chunks[index]["title"] + " " + _chunks[index]["content"])
        lexical = len(query_terms & chunk_terms) / len(query_terms) if query_terms else 0.0
        result = dict(_chunks[index])
        result["similarity_score"] = round(0.7 * cosine + 0.3 * lexical, 3)
        result["lexical_score"] = round(lexical, 3)
        scored.append(result)
    return sorted(scored, key=lambda item: item["similarity_score"], reverse=True)[:top_k]

def keyword_search(query: str, top_k: int = 4) -> List[Dict]:
    query_terms = _terms(query)
    scored = []
    for chunk in _chunks:
        chunk_terms = _terms(chunk["title"] + " " + chunk["content"])
        score = len(query_terms & chunk_terms) / len(query_terms) if query_terms else 0.0
        if score > 0:
            result = dict(chunk)
            result["similarity_score"] = round(score, 3)
            result["lexical_score"] = round(score, 3)
            scored.append(result)
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
