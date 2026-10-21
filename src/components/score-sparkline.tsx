"use client";

import { useState } from "react";

export type SparkPoint = { pct: number; label: string };

const WIDTH = 200;
const HEIGHT = 44;
const PAD_X = 6;
const PAD_Y = 6;

/**
 * Score percentage over successive attempts on a fixed 0–100% scale, so every topic's sparkline is
 * comparable. Hovering a point shows its date, test type and score.
 */
export function ScoreSparkline({ points, topic }: { points: SparkPoint[]; topic: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return null;

  const x = (i: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (i * (WIDTH - PAD_X * 2)) / (points.length - 1);
  const y = (pct: number) => PAD_Y + ((100 - Math.min(Math.max(pct, 0), 100)) * (HEIGHT - PAD_Y * 2)) / 100;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.pct).toFixed(1)}`).join(" ");
  const hit = Math.max(10, (WIDTH - PAD_X * 2) / Math.max(points.length - 1, 1));

  return (
    <div className="relative w-full max-w-[200px]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-11 w-full overflow-visible"
        role="img"
        aria-label={`${topic} scores by attempt: ${points.map((p) => `${p.pct}%`).join(", ")}`}
        onMouseLeave={() => setActive(null)}
      >
        {/* 0% and 100% guides, kept recessive */}
        <line x1={0} x2={WIDTH} y1={y(100)} y2={y(100)} stroke="var(--viz-track)" strokeDasharray="2 3" />
        <line x1={0} x2={WIDTH} y1={y(0)} y2={y(0)} stroke="var(--viz-track)" />
        {points.length > 1 && (
          <path d={path} fill="none" stroke="var(--viz-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.pct)}
              r={active === i ? 5 : 4}
              fill="var(--viz-line)"
              className="stroke-white dark:stroke-slate-900"
              strokeWidth={2}
            />
            <rect
              x={x(i) - hit / 2}
              y={0}
              width={hit}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              aria-label={`${p.label}: ${p.pct}%`}
              className="cursor-default outline-none"
            />
          </g>
        ))}
      </svg>
      {active !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          style={{ left: `${(x(active) / WIDTH) * 100}%` }}
        >
          <span className="font-semibold tabular-nums">{points[active].pct}%</span> · {points[active].label}
        </div>
      )}
    </div>
  );
}
