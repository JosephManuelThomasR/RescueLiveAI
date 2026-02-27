import React, { useEffect, useState } from "react";
import { UIState } from "../lib/internalEngine";

export function BootOverlay({ state }: { state: UIState }) {
  const steps: UIState[] = ["POWER_ON", "SYSTEM_CHECK", "CALIBRATION", "STREAM_INITIALIZED"];
  const idx = Math.max(0, steps.indexOf(state));
  const pct = ((idx + 1) / steps.length) * 100;
  const label = state === "POWER_ON"
    ? "Powering on"
    : state === "SYSTEM_CHECK"
    ? "System check"
    : state === "CALIBRATION"
    ? "Calibrating"
    : state === "STREAM_INITIALIZED"
    ? "Initializing stream"
    : "";
  return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #0b0f12, #0a1018)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ width: 360, textAlign: "center", color: "#cfe6d5" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>{label}</div>
        <div style={{ height: 8, background: "#0a1a1a", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #0a5, #0f9)", transition: "width 300ms ease" }} />
        </div>
      </div>
    </div>
  );
}
