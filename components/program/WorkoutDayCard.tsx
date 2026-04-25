"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Superset, Exercise } from "@/lib/types";
import { swapExerciseAction } from "@/actions/swap-exercise";

interface WorkoutDayCardProps {
  dayLabel: string;
  dayNum: number;
  workoutName: string;
  dayTemplate: string;
  supersets: Superset[];
  status: "today" | "upcoming" | "completed" | "missed";
  blockWeekLabel?: string;
  historyId?: string;
  defaultOpen?: boolean;
  // Swap context — swap button is hidden when any of these are absent
  programId?: string;
  blockIndex?: number;
  dayIndex?: number;
  goal?: string;
  equipment?: string;
  experienceLevel?: string;
}

interface SwapTarget {
  supersetIndex: number;
  slot: "a" | "b";
  exerciseName: string;
  existingNames: string[];
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
  programId,
  blockIndex,
  dayIndex,
  goal,
  equipment,
  experienceLevel,
}: WorkoutDayCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  // Swap state
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
  const [alternatives, setAlternatives] = useState<Exercise[] | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [savingSwap, setSavingSwap] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  const canSwap =
    programId !== undefined &&
    blockIndex !== undefined &&
    dayIndex !== undefined &&
    goal !== undefined &&
    equipment !== undefined &&
    experienceLevel !== undefined &&
    status !== "completed" &&
    status !== "missed";

  async function handleSwapRequest(
    supersetIndex: number,
    slot: "a" | "b",
    exerciseName: string,
  ) {
    if (!canSwap) return;
    const existingNames = supersets
      .flatMap((s) => [s.a.name, s.b.name])
      .filter((n) => n !== exerciseName);

    setSwapTarget({ supersetIndex, slot, exerciseName, existingNames });
    setAlternatives(null);
    setSwapError(null);
    setSwapLoading(true);

    try {
      const res = await fetch("/api/swap-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName,
          equipment,
          goal,
          experienceLevel,
          existingNames,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        setAlternatives(data.alternatives);
      } else {
        setSwapError("Couldn't load alternatives. Try again.");
      }
    } catch {
      setSwapError("Couldn't load alternatives. Try again.");
    } finally {
      setSwapLoading(false);
    }
  }

  async function handlePickAlternative(exercise: Exercise) {
    if (
      !swapTarget ||
      programId === undefined ||
      blockIndex === undefined ||
      dayIndex === undefined
    )
      return;

    setSavingSwap(true);
    setSwapError(null);

    const result = await swapExerciseAction({
      programId,
      blockIndex,
      dayIndex,
      supersetIndex: swapTarget.supersetIndex,
      slot: swapTarget.slot,
      newExercise: exercise,
    });

    setSavingSwap(false);

    if (result.ok) {
      setSwapTarget(null);
      setAlternatives(null);
      router.refresh();
    } else {
      setSwapError(result.error);
    }
  }

  function closeModal() {
    setSwapTarget(null);
    setAlternatives(null);
    setSwapError(null);
    setSwapLoading(false);
  }

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
    <>
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
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium"
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                            {canSwap && (
                              <button
                                type="button"
                                onClick={() => handleSwapRequest(i, slot, ex.name)}
                                className="shrink-0 text-[11px] font-medium text-accent border border-accent/30 rounded-md px-2 py-0.5 leading-none"
                              >
                                Swap
                              </button>
                            )}
                          </div>
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

      {/* Swap modal */}
      {swapTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg bg-surface rounded-t-2xl px-5 pt-5 pb-10 space-y-4">
            {/* Handle */}
            <div className="mx-auto w-10 h-1 rounded-full bg-border-default mb-1" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted">
                  Replacing
                </p>
                <p className="text-base font-semibold text-text-primary">
                  {swapTarget.exerciseName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-text-muted text-xl leading-none mt-0.5"
              >
                ×
              </button>
            </div>

            {swapLoading && (
              <p className="text-sm text-text-secondary py-4 text-center">
                Finding alternatives…
              </p>
            )}

            {swapError && (
              <p className="text-sm text-red-400 text-center">{swapError}</p>
            )}

            {alternatives && !swapLoading && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
                  Choose a replacement
                </p>
                {alternatives.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={savingSwap}
                    onClick={() => handlePickAlternative(alt)}
                    className="w-full text-left rounded-xl border border-border-default bg-surface-elevated px-4 py-3 space-y-0.5 disabled:opacity-50"
                  >
                    <p className="text-sm font-semibold text-text-primary">{alt.name}</p>
                    <p className="text-xs text-text-secondary">{alt.detail}</p>
                  </button>
                ))}
                {savingSwap && (
                  <p className="text-xs text-text-muted text-center pt-1">Saving…</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
