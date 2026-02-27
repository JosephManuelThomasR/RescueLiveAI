import React from "react";

export function ShutdownOverlay({ stage }: { stage: "FADE" | "SAVE" | "POWER" }) {
  const msg = stage === "FADE" ? "Shutting down" : stage === "SAVE" ? "Saving logs" : "Powering down";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ color: "#cfe6d5", textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>{msg}</div>
        <div className="spinner" style={{ width: 30, height: 30, border: "3px solid #0b3", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
      </div>
    </div>
  );
}
