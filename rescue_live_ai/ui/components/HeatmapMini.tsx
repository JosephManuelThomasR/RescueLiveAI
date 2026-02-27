import React, { useEffect, useRef } from "react";

export function HeatmapMini({ bins, values }: { bins: number; values: number[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const maxVal = Math.max(1e-6, ...values);
    // background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#070c10");
    bgGrad.addColorStop(1, "#0a0f14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < bins; i++) {
      const v = values[i] || 0;
      const intensity = v / maxVal;
      const x = (i / bins) * w;
      const width = w / bins + 1;
      const alpha = Math.min(1, 0.25 + 0.75 * intensity);
      ctx.fillStyle = `rgba(0, 255, 140, ${alpha})`;
      const radius = 6;
      // rounded bar
      const rx = x + 1, ry = 4, rw = width - 2, rh = h - 8;
      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, radius);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, radius);
      ctx.arcTo(rx, ry + rh, rx, ry, radius);
      ctx.arcTo(rx, ry, rx + rw, ry, radius);
      ctx.closePath();
      ctx.fill();
    }
    // grid stroke
    ctx.strokeStyle = "rgba(0,255,140,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < bins; i++) {
      const gx = (i / bins) * w;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
  }, [bins, values]);
  return <canvas ref={ref} width={500} height={80} style={{ width: "100%", height: 80, borderRadius: 12 }} />;
}
