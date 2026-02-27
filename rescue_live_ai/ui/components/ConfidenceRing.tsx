import React from "react";

export function ConfidenceRing({ value, acc, color }: { value: number; acc: number; color: string }) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const pctAcc = Math.max(0, Math.min(100, acc));
  const dash = (pct / 100) * c;
  const dashAcc = (pctAcc / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d084" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#1a2230" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#2a3344" strokeWidth={stroke} fill="none" strokeDasharray={`${dashAcc} ${c - dashAcc}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ringGrad)" strokeLinecap="round" strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c - dash}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size / 2} cy={size / 2} r={r - stroke/2 + 2} stroke="#0c1820" strokeWidth={2} fill="none" strokeDasharray="2 10" opacity={0.4} />
      <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fontSize="30" fill="#cfe6d5" style={{ fontWeight: 700 }}>
        {Math.round(value)}%
      </text>
      <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fill="#8fd6b6">
        ACC {Math.round(acc)}%
      </text>
    </svg>
  );
}
