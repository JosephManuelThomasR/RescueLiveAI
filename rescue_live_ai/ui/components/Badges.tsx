import React from "react";

export function Badges() {
  const style = { padding: "2px 6px", borderRadius: 6, fontSize: 10, color: "#cfe6d5", background: "#0b1a14", border: "1px solid #0d2", marginLeft: 6 };
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={style as any}>UART Compatible</span>
      <span style={style as any}>ESP32 Ready</span>
      <span style={style as any}>HLK‑LD2410S Compatible</span>
      <span style={{ ...(style as any), borderColor: "#0b7", background: "#0b1420" }}>Powered by Pathway Streaming Engine</span>
    </div>
  );
}
