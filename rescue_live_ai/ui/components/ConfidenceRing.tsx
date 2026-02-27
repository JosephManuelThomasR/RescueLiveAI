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
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#223" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#335" strokeWidth={stroke} fill="none" strokeDasharray={`${dashAcc} ${c - dashAcc}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c - dash}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="28" fill="#cfc">
        {Math.round(value)}%
      </text>
      <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="#9c9">
        ACC {Math.round(acc)}%
      </text>
    </svg>
  );
}
