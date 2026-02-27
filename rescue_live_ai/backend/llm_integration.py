import os
from typing import Dict, List
from .document_store import get_docstore


def generate_recommendation(state: str, metrics: Dict, docs_dir: str) -> Dict:
    ds = get_docstore(docs_dir)
    citations: List[Dict] = ds.search("extraction strategy", k=3)
    strategy = "Stabilize area, deploy acoustic and radar confirmation, coordinate extraction with medical readiness."
    risks = "Aftershocks, structural collapse, dust inhalation, limited access."
    tools = "Thermal camera, cutting tools, shoring equipment, oxygen and first-aid."
    triage = "Assess airway, breathing, circulation; provide oxygen; prevent hypothermia; rapid transport."
    return {
        "state": state,
        "strategy": strategy,
        "risks": risks,
        "tools": tools,
        "triage": triage,
        "citations": citations,
    }

