"use client";

import { useState } from "react";
import Link from "next/link";
import type { Superset } from "@/lib/types";

interface WorkoutDayCardProps {
  dayLabel: string;     // "Mon", "Tue", etc.
  dayNum: number;       // date number
  workoutName: string;  // e.g. "Foundation · Push A"
  dayTemplate: string;  // e.g. "Push A"
  supersets: Superset[];
  status: "today" | "upcoming" | "completed" | "missed";
  blockWeekLabel?: string; // e.g. "Block 1 · Week 1"
  historyId?: string;   // workout id — for completed/missed links to history
  defaultOpen?: boolean;
}

export function WorkoutDayCard({
  dayLabel,
  dayNum,
  workoutName,
  dayTemplate,
  supersets,
  status,
  blockWeekLabel,
  historyId,
  defaultOpen = false,
}: WorkoutDayCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const statusLabel =
    status === "today"
      ? "Today"
      : status === "completed"
      ? "Done"
      : status === "missed"
      ? "Missed"
      : dayLabel;

  const borderClass =
    status === "today"
      ? "border-border-default"
      : status === "completed"
      ? "border-border-default"
      : status === "missed"
      ? "border-border-subtle opacity-60"
      : "border-border-subtle opacity-80";

  return (
    <div className={`rounded-xl border bg-surface overflow-hidden ${borderClass}`}>
      {/* Header — always visible, tappable to expand */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Day badge */}
          <div className="shrink-0 w-9 h-9 rounded-lg bg-surface-elevated flex flex-col items-center justify-center">
            <p className="text-[9px] uppercase tracking-wide text-text-muted leading-none">{dayLabel}</p>
            <p className="text-sm font-semibold text-text-primary leading-tight">{dayNum}</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {blockWeekLabel && (
                <p className="text-[10px] uppercase tracking-widest text-text-muted shrink-0">
                  {blockWeekLabel}
                </p>
              )}
              {status === "completed" && (
                <span className="text-[10px] uppercase tracking-widest text-text-muted">· Done</span>
              )}
              {status === "missed" && (
                <span className="text-[10px] uppercase tracking-widest text-text-muted">· Missed</span>
              )}
            </div>
            <p className="text-sm font-semibold text-text-primary truncate">{workoutName}</p>
            <p className="text-xs text-text-secondary">{supersets.length} supersets</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {status === "today" && (
            <Link
              href="/workout"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-lg bg-text-primary text-bg text-xs font-medium"
            >
              Train
            </Link>
          )}
          {(status === "completed" || status === "missed") && historyId && (
            <Link
              href={`/history/${historyId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-text-muted underline underline-offset-2"
            >
              View
            </Link>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Superset breakdown — revealed on expand */}
      {open && (
        <div className="border-t border-border-subtle divide-y divide-border-subtle">
          {supersets.map((superset, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted mb-2">
                Superset {i + 1}
              </p>
              <div className="space-y-2">
                {(["a", "b"] as const).map((slot) => {
                  const ex = superset[slot];
                  return (
                    <div key={slot} className="flex items-start gap-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted w-3 shrink-0 mt-1">
                        {slot.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                        <p className="text-xs text-text-secondary">{ex.detail}</p>
                        {(ex.regression || ex.progression) && (
                          <div className="mt-1 space-y-0.5">
                            {ex.regression && (
                              <p className="text-[11px] text-text-muted">
                                <span className="font-medium">Too hard:</span> {ex.regression}
                              </p>
                            )}
                            {ex.progression && (
                              <p className="text-[11px] text-text-muted">
                                <span className="font-medium">Too easy:</span> {ex.progression}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
