import os
from typing import Optional


def start_docstore_if_available(docs_dir: str) -> Optional[object]:
    try:
        import pathway as pw
        from pathway.xpacks.llm import utils as llm_utils  # type: ignore
    except Exception:
        return None
    if not os.path.isdir(docs_dir):
        os.makedirs(docs_dir, exist_ok=True)
    table = pw.io.fs.read(docs_dir, format="binary", with_metadata=True)
    _ = table  # placeholder to bind the pipeline
    return object()

