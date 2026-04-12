"use client";

import type { Superset } from "@/lib/types";

interface RestViewProps {
  restSeconds: number;
  remaining: number;
  nextSuperset?: Superset;
}

export function RestView({ restSeconds, remaining, nextSuperset }: RestViewProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6">
      {/* Big timer */}
      <div className="text-[96px] font-light tabular-nums leading-none text-text-primary" style={{ fontWeight: 300 }}>
        {remaining}
      </div>
      <p className="text-text-secondary text-sm">Rest — catch your breath</p>

      {nextSuperset && (
        <div className="w-full rounded-xl border border-border-default bg-surface p-4 space-y-1">
          <p className="text-[11px] text-text-muted uppercase tracking-widest">Up next</p>
          <p className="text-sm font-medium text-text-primary">
            {nextSuperset.a.name} / {nextSuperset.b.name}
          </p>
        </div>
      )}

      <div className="w-full h-1 rounded-full bg-surface-elevated overflow-hidden">
        <div
          className="h-full bg-text-primary rounded-full transition-all duration-1000"
          style={{ width: `${(remaining / restSeconds) * 100}%` }}
        />
      </div>
    </div>
  );
}
