"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ConfidenceRing } from "../components/ConfidenceRing";
import { Waveform } from "../components/Waveform";
import { HeatmapMini } from "../components/HeatmapMini";
import { BootOverlay } from "../components/BootOverlay";
import { ShutdownOverlay } from "../components/ShutdownOverlay";
import { Badges } from "../components/Badges";
import { AiPanel } from "../components/AiPanel";
import { InternalEngine, Metrics as LocalMetrics, UIState as LocalUIState } from "../lib/internalEngine";

type UIState = LocalUIState;
type Metrics = LocalMetrics;

function bgForState(s: UIState): string {
  if (s === "LIFE_DETECTED") return "radial-gradient(#051, #021)";
  if (s === "POSSIBLE_LIFE") return "radial-gradient(#551, #221)";
  if (s === "NO_LIFE") return "radial-gradient(#511, #211)";
  if (s === "SCANNING" || s === "ANALYZING" || s === "STREAM_INITIALIZED") return "radial-gradient(#112, #08131a)";
  if (s === "LOW_BATTERY") return "radial-gradient(#330, #200)";
  if (s === "FAULT") return "radial-gradient(#311, #200)";
  return "radial-gradient(#101416, #0b1014)";
}

export default function Page() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [uiState, setUiState] = useState<UIState>("POWER_ON");
  const [connected, setConnected] = useState(false);
  const [shutdownStage, setShutdownStage] = useState<"FADE" | "SAVE" | "POWER" | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const engineRef = useRef<InternalEngine | null>(null);
  const waveformBuf = useRef<number[]>([]);
  const backendBase = useRef<string>("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevStateRef = useRef<UIState | null>(null);

  const ding = (freq: number, ms: number, gain: number) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g).connect(ctx.destination);
      const t0 = ctx.currentTime;
      o.start();
      o.stop(t0 + ms / 1000);
    } catch {}
  };

  useEffect(() => {
    engineRef.current = new InternalEngine();
    engineRef.current.start((m) => {
      setMetrics(m);
      setUiState(m.state);
      waveformBuf.current = [...waveformBuf.current.slice(-200), m.micro_signal];
    });
    backendBase.current = (typeof window !== "undefined") ? `${location.protocol}//${location.host}` : "";
    let es: EventSource | null = null;
    try {
      es = new EventSource("/sse");
      es.onopen = () => { setConnected(true); };
      es.onmessage = (e) => {
        try {
          const data: Metrics = JSON.parse(e.data);
          setMetrics(data);
          setUiState(data.state as UIState);
          waveformBuf.current = [...waveformBuf.current.slice(-200), data.micro_signal];
        } catch {}
      };
      es.onerror = () => {};
    } catch {}
    return () => {
      try { es && es.close(); } catch {}
      engineRef.current?.stop();
    };
  }, []);

  const ringColor = useMemo(() => {
    if (!metrics) return "#0a0";
    return uiState === "LIFE_DETECTED" ? "#0f0" : uiState === "POSSIBLE_LIFE" ? "#ff0" : "#f33";
  }, [metrics, uiState]);

  const setRapid = async () => {
    if (!audioCtxRef.current) { try { audioCtxRef.current = new (window as any).AudioContext(); } catch {} }
    if (connected) {
      try { await fetch(`${backendBase.current}/scan-mode/RAPID`, { method: "POST" }); } catch {}
    } else {
      engineRef.current?.setMode("RAPID");
    }
    if (!metrics?.silent_mode) ding(880, 60, 0.02);
  };
  const setDeep = async () => {
    if (!audioCtxRef.current) { try { audioCtxRef.current = new (window as any).AudioContext(); } catch {} }
    if (connected) {
      try { await fetch(`${backendBase.current}/scan-mode/DEEP`, { method: "POST" }); } catch {}
    } else {
      engineRef.current?.setMode("DEEP");
    }
    if (!metrics?.silent_mode) ding(660, 60, 0.02);
  };
  const toggleSilent = async () => {
    if (!audioCtxRef.current) { try { audioCtxRef.current = new (window as any).AudioContext(); } catch {} }
    if (connected) {
      try { await fetch(`${backendBase.current}/toggle-silent`, { method: "POST" }); } catch {}
    } else {
      engineRef.current?.toggleSilent();
      const m = metrics && { ...metrics, silent_mode: !metrics.silent_mode } as Metrics;
      if (m) setMetrics(m);
    }
  };
  const shutdown = () => {
    setShutdownStage("FADE");
    setTimeout(() => setShutdownStage("SAVE"), 800);
    setTimeout(() => setShutdownStage("POWER"), 1600);
    setTimeout(() => {
      engineRef.current?.shutdown((m) => setMetrics(m));
    }, 2200);
  };

  const showBoot = uiState === "POWER_ON" || uiState === "SYSTEM_CHECK" || uiState === "CALIBRATION" || uiState === "STREAM_INITIALIZED";

  useEffect(() => {
    if (!metrics) return;
    const prev = prevStateRef.current;
    const curr = uiState;
    if (prev !== curr) {
      if (!metrics.silent_mode) {
        if (curr === "LIFE_DETECTED") ding(1200, 90, 0.025);
        else if (curr === "POSSIBLE_LIFE") ding(900, 70, 0.02);
        else if (curr === "NO_LIFE") ding(400, 120, 0.02);
        else if (curr === "SCANNING") ding(700, 50, 0.015);
      }
      prevStateRef.current = curr;
    }
  }, [metrics, uiState]);

  const battPct = useMemo(() => {
    const v = metrics?.battery_voltage ?? 8.0;
    const pct = Math.max(0, Math.min(100, Math.round(((v - 6.6) / (8.4 - 6.6)) * 100)));
    return isFinite(pct) ? pct : 100;
  }, [metrics]);

  return (
    <div style={{ background: bgForState(uiState), color: "#cfe6d5", height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.6, fontSize: 18 }}>RescueLiveAI</div>
          <Badges />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="pill" style={{ borderColor: "#0b7" }}>
            {uiState.replaceAll("_", " ")}
          </span>
          <span className="pill" title="Battery">
            🔋 {battPct}%
          </span>
          <button onClick={setRapid}>Rapid</button>
          <button onClick={setDeep}>Deep</button>
          <button onClick={toggleSilent}>{metrics?.silent_mode ? "Unmute" : "Silent"}</button>
          <button onClick={shutdown}>Power</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, flex: 1 }}>
        <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ConfidenceRing value={(metrics?.confidence ?? 0) * 100} acc={(metrics?.acc_confidence ?? 0) * 100} color={ringColor} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <Waveform data={waveformBuf.current} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <HeatmapMini bins={32} values={metrics?.heatmap ?? []} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <AiPanel connected={connected} backendBase={backendBase.current} state={uiState} metrics={metrics} />
        </div>
      </div>
      {showBoot ? <BootOverlay state={uiState} /> : null}
      {shutdownStage ? <ShutdownOverlay stage={shutdownStage} /> : null}
    </div>
  );
}
