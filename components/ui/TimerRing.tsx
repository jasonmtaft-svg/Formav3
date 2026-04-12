"use client";

interface TimerRingProps {
  /** Total duration in seconds */
  total: number;
  /** Remaining seconds */
  remaining: number;
  /** Diameter of the SVG ring in px */
  size?: number;
}

export function TimerRing({ total, remaining, size = 80 }: TimerRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2e2e2e"
          strokeWidth={4}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f5f5f5"
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="absolute text-sm font-medium tabular-nums text-text-primary">
        {remaining}
      </span>
    </div>
  );
}
