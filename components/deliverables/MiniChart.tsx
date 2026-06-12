"use client";

import { useId } from "react";

interface MiniChartProps {
  data: number[];
  accent?: string;
  height?: number;
  label?: string;
}

/**
 * Lightweight SVG area chart — no charting lib. Renders a real series (the
 * Data agent's computed monthly revenue) as a smooth gradient area, so the
 * "Data Intelligence" agent actually SHOWS a visualization instead of just
 * naming chart types.
 */
export function MiniChart({ data, accent = "#0D9488", height = 64, label }: MiniChartProps) {
  const gradId = useId();
  if (!data || data.length < 2) return null;

  const W = 100; // viewBox width (scales responsively)
  const H = height;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - pad * 2) + pad;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const delta = first ? ((last - first) / first) * 100 : 0;

  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
            {label}
          </span>
          <span
            className="font-mono text-[10px] tabular-nums"
            style={{ color: delta >= 0 ? "#059669" : "#E11D48" }}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* last-point dot */}
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="2"
          fill={accent}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
