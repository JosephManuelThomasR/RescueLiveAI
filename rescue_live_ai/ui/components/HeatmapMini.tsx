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
    for (let i = 0; i < bins; i++) {
      const v = values[i] || 0;
      const intensity = v / maxVal;
      const x = (i / bins) * w;
      const width = w / bins + 1;
      const color = `rgba(0, 255, 100, ${Math.min(1, 0.2 + 0.8 * intensity)})`;
      ctx.fillStyle = color;
      ctx.fillRect(x, 0, width, h);
    }
  }, [bins, values]);
  return <canvas ref={ref} width={500} height={80} style={{ width: "100%", height: 80, background: "#001", borderRadius: 6 }} />;
}
