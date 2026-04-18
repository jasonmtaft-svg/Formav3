"use client";

import { useState } from "react";

export type ChartSeries = {
  name: string;
  points: { date: string; maxKg: number }[];
};

interface Props {
  series: ChartSeries[];
  weightUnit: "kg" | "lbs";
}

// Chart canvas dimensions (SVG viewBox units)
const W = 320;
const H = 140;
const PAD = { top: 10, right: 12, bottom: 28, left: 36 };
const CW = W - PAD.left - PAD.right; // chart width
const CH = H - PAD.top - PAD.bottom; // chart height

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function StrengthChart({ series, weightUnit }: Props) {
  const [selected, setSelected] = useState(series[0]?.name ?? "");

  const active = series.find((s) => s.name === selected);

  if (!series.length) {
    return (
      <p className="text-sm text-text-secondary">
        No strength data yet. Log a workout to see your progress.
      </p>
    );
  }

  const renderChart = () => {
    if (!active || active.points.length === 0) {
      return (
        <p className="text-sm text-text-secondary py-6 text-center">
          No data for this exercise yet.
        </p>
      );
    }

    if (active.points.length === 1) {
      const pt = active.points[0];
      const display = weightUnit === "lbs"
        ? `${(pt.maxKg * 2.20462).toFixed(1)} lbs`
        : `${pt.maxKg} kg`;
      return (
        <div className="py-6 text-center">
          <p className="text-2xl font-semibold text-text-primary">{display}</p>
          <p className="text-xs text-text-muted mt-1">{formatDate(pt.date)} · first session</p>
        </div>
      );
    }

    const weights = active.points.map((p) => p.maxKg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;

    const toX = (i: number) =>
      PAD.left + (i / (active.points.length - 1)) * CW;
    const toY = (w: number) =>
      PAD.top + CH - ((w - minW) / range) * CH;

    const pathD = active.points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.maxKg).toFixed(1)}`)
      .join(" ");

    // Y-axis labels: min, mid, max
    const mid = (minW + maxW) / 2;
    const yLabels = [
      { val: maxW, y: toY(maxW) },
      { val: mid, y: toY(mid) },
      { val: minW, y: toY(minW) },
    ];

    // X-axis: show first, middle, last
    const xIndices =
      active.points.length <= 3
        ? active.points.map((_, i) => i)
        : [0, Math.floor((active.points.length - 1) / 2), active.points.length - 1];

    const convert = (kg: number) =>
      weightUnit === "lbs" ? +(kg * 2.20462).toFixed(1) : kg;

    // Determine trend
    const first = weights[0];
    const last = weights[weights.length - 1];
    const diff = convert(last) - convert(first);
    const trendColor =
      diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-text-muted";
    const trendLabel =
      diff > 0
        ? `+${diff.toFixed(1)} ${weightUnit}`
        : diff < 0
        ? `${diff.toFixed(1)} ${weightUnit}`
        : "No change";

    return (
      <div className="space-y-2">
        {/* Trend badge */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Best: <span className="text-text-primary font-medium">{convert(maxW)} {weightUnit}</span>
          </p>
          <p className={`text-xs font-medium ${trendColor}`}>{trendLabel} overall</p>
        </div>

        {/* SVG Chart */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "140px" }}
          aria-label={`Strength progress for ${selected}`}
        >
          {/* Grid lines */}
          {yLabels.map(({ y }, i) => (
            <line
              key={i}
              x1={PAD.left}
              y1={y.toFixed(1)}
              x2={W - PAD.right}
              y2={y.toFixed(1)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border-subtle"
              strokeDasharray="3 3"
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map(({ val, y }, i) => (
            <text
              key={i}
              x={PAD.left - 4}
              y={y + 4}
              textAnchor="end"
              fontSize="8"
              className="fill-text-muted"
            >
              {convert(val)}
            </text>
          ))}

          {/* X-axis labels */}
          {xIndices.map((idx) => (
            <text
              key={idx}
              x={toX(idx).toFixed(1)}
              y={H - 4}
              textAnchor="middle"
              fontSize="8"
              className="fill-text-muted"
            >
              {formatDate(active.points[idx].date)}
            </text>
          ))}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-primary"
          />

          {/* Dots */}
          {active.points.map((p, i) => (
            <circle
              key={i}
              cx={toX(i).toFixed(1)}
              cy={toY(p.maxKg).toFixed(1)}
              r="3"
              className="fill-text-primary"
            />
          ))}

          {/* Latest value label */}
          {(() => {
            const last = active.points[active.points.length - 1];
            const lx = toX(active.points.length - 1);
            const ly = toY(last.maxKg);
            return (
              <text
                x={lx - 4}
                y={ly - 7}
                textAnchor="end"
                fontSize="9"
                fontWeight="600"
                className="fill-text-primary"
              >
                {convert(last.maxKg)} {weightUnit}
              </text>
            );
          })()}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Exercise picker */}
      <div className="flex gap-2 flex-wrap">
        {series.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelected(s.name)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              s.name === selected
                ? "bg-text-primary text-bg"
                : "border border-border-default text-text-secondary"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {renderChart()}
    </div>
  );
}
