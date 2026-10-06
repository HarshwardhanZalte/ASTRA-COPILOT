import unittest
from unittest.mock import patch

from app.rag import vector_store


class VectorStoreTests(unittest.TestCase):
    def setUp(self):
        vector_store._docs.clear()
        vector_store._chunks.clear()
        vector_store._chunk_embeddings.clear()

    def tearDown(self):
        vector_store._docs.clear()
        vector_store._chunks.clear()
        vector_store._chunk_embeddings.clear()

    def test_chunks_preserve_source_document_and_chunk_index(self):
        content = "\n\n".join(
            f"Battery procedure section {index}: verify battery voltage and current."
            for index in range(40)
        )
        with patch("app.rag.vector_store.embed_text", return_value=None):
            vector_store.add_document(
                "power-proc",
                "Power Procedure",
                content,
                "procedure",
                "power",
            )
            result = vector_store.search_similar("battery voltage")

        self.assertGreater(len(vector_store._chunks), 1)
        self.assertEqual(
            {chunk["source_id"] for chunk in vector_store._chunks},
            {"power-proc"},
        )
        self.assertEqual(
            [chunk["chunk_index"] for chunk in vector_store._chunks],
            list(range(1, len(vector_store._chunks) + 1)),
        )
        self.assertEqual(result[0]["source_id"], "power-proc")
        self.assertTrue(result[0]["id"].startswith("power-proc#chunk-"))


if __name__ == "__main__":
    unittest.main()
