import React, { useEffect, useRef, useState } from "react";
import { UIState } from "../lib/internalEngine";

type Rec = {
  strategy: string;
  risks: string;
  tools: string;
  triage: string;
  citations: { title: string; path?: string }[];
};

function typeIn(text: string, setText: (s: string) => void) {
  let i = 0;
  const id = setInterval(() => {
    i += Math.max(1, Math.floor(text.length / 60));
    setText(text.slice(0, Math.min(i, text.length)));
    if (i >= text.length) clearInterval(id);
  }, 30);
}

export function AiPanel({ connected, backendBase, state, metrics }: { connected: boolean; backendBase?: string; state: UIState; metrics: any }) {
  const [rec, setRec] = useState<Rec | null>(null);
  const [typedStrategy, setTypedStrategy] = useState("");
  const [typedRisks, setTypedRisks] = useState("");
  const [typedTools, setTypedTools] = useState("");
  const [typedTriage, setTypedTriage] = useState("");
  const fetching = useRef(false);

  useEffect(() => {
    if (state !== "LIFE_DETECTED" && state !== "POSSIBLE_LIFE") return;
    if (fetching.current) return;
    fetching.current = true;
    (async () => {
      let out: Rec | null = null;
      if (connected && backendBase) {
        try {
          const res = await fetch(`${backendBase}/ai-recommendation`);
          if (res.ok) {
            const json = await res.json();
            out = {
              strategy: json.strategy || "",
              risks: json.risks || "",
              tools: json.tools || "",
              triage: json.triage || "",
              citations: (json.citations || []).map((c: any) => ({ title: c.title || "Reference" }))
            };
          }
        } catch {}
      }
      if (!out) {
        const citations = [
          { title: "Disaster Rescue SOP" },
          { title: "Earthquake Extraction Guidelines" },
          { title: "Structural Collapse Manual" }
        ];
        out = {
          strategy: "Stabilize structure, confirm signals, coordinate extraction with medical readiness. Use shoring and controlled access.",
          risks: "Aftershocks, secondary collapse, dust inhalation, limited access routes, unseen hazards.",
          tools: "Shoring equipment, cutting tools, thermal support, oxygen kit, first‑aid supplies.",
          triage: "Assess airway, breathing, circulation. Provide oxygen, prevent hypothermia, prepare rapid transport.",
          citations
        };
      }
      setRec(out);
      typeIn(out.strategy, setTypedStrategy);
      setTimeout(() => typeIn(out.risks, setTypedRisks), 600);
      setTimeout(() => typeIn(out.tools, setTypedTools), 1200);
      setTimeout(() => typeIn(out.triage, setTypedTriage), 1800);
    })();
  }, [state, connected, backendBase]);

  if (!rec) return (
    <div style={{ color: "#cfe6d5", fontSize: 12 }}>
      <div style={{ opacity: 0.6, marginBottom: 6 }}>AI Analysis</div>
      <div className="spinner" style={{ width: 20, height: 20, border: "2px solid #0b3", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ color: "#cfe6d5", fontSize: 12 }}>
      <div style={{ opacity: 0.6, marginBottom: 6 }}>AI Analysis</div>
      <div><strong>Strategy</strong>: {typedStrategy}</div>
      <div style={{ marginTop: 6 }}><strong>Risks</strong>: {typedRisks}</div>
      <div style={{ marginTop: 6 }}><strong>Tools</strong>: {typedTools}</div>
      <div style={{ marginTop: 6 }}><strong>Triage</strong>: {typedTriage}</div>
      <div style={{ marginTop: 8, opacity: 0.7 }}>
        {rec.citations.map((c, i) => (
          <span key={i} style={{ marginRight: 8, background: "#0b1420", border: "1px solid #0b7", padding: "2px 6px", borderRadius: 6 }}>{c.title}</span>
        ))}
      </div>
    </div>
  );
}
