import React, { useEffect, useRef } from "react";

export function Waveform({ data }: { data: number[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#0f6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const n = data.length;
    if (n === 0) return;
    const min = -1, max = 1;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = h - ((data[i] - min) / (max - min)) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [data]);
  return <canvas ref={ref} width={500} height={150} style={{ width: "100%", height: 150, background: "#001", borderRadius: 6 }} />;
}
