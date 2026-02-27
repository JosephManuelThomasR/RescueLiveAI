import os
from typing import List, Dict

try:
    import pathway as pw  # noqa: F401
    XPACKS_AVAILABLE = True
except Exception:
    XPACKS_AVAILABLE = False


class SimpleDocStore:
    def __init__(self, docs_dir: str):
        self.docs_dir = docs_dir
        self.index: Dict[str, str] = {}
        self.refresh()

    def refresh(self):
        self.index.clear()
        if not os.path.isdir(self.docs_dir):
            return
        for root, _, files in os.walk(self.docs_dir):
            for f in files:
                if f.lower().endswith((".txt", ".md", ".pdf")):
                    path = os.path.join(root, f)
                    self.index[path] = f

    def search(self, query: str, k: int = 3) -> List[Dict]:
        res = []
        for path, title in list(self.index.items())[:k]:
            res.append({"title": title, "path": path, "snippet": "See document"})
        return res


def get_docstore(docs_dir: str) -> SimpleDocStore:
    return SimpleDocStore(docs_dir)

