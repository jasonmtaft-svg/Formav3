"use client";

import { useState } from "react";
import { ExerciseCard } from "@/components/ui/ExerciseCard";
import type { Superset, SetLog, SetFeedback, WeightUnit, Exercise } from "@/lib/types";

interface SupersetViewProps {
  superset: Superset;
  index: number;
  total: number;
  logA: SetLog;
  logB: SetLog;
  feedback: SetFeedback;
  workoutMeta: { goal: string; equipment: string; experienceLevel: string };
  onLogAChange: (log: SetLog) => void;
  onLogBChange: (log: SetLog) => void;
  onFeedbackChange: (feedback: SetFeedback) => void;
  onSwapExercise: (slot: "a" | "b", newExercise: Exercise) => void;
  weightUnit: WeightUnit;
  prMap: Record<string, number>;
}

interface SwapState {
  slot: "a" | "b";
  exerciseName: string;
  loading: boolean;
  alternatives: Exercise[] | null;
  error: string | null;
}

export function SupersetView({
  superset,
  index,
  total,
  logA,
  logB,
  feedback,
  workoutMeta,
  onLogAChange,
  onLogBChange,
  onFeedbackChange,
  onSwapExercise,
  weightUnit,
  prMap,
}: SupersetViewProps) {
  const [swap, setSwap] = useState<SwapState | null>(null);

  async function openSwap(slot: "a" | "b") {
    const exerciseName = superset[slot].name;
    const existingNames = [superset.a.name, superset.b.name].filter((n) => n !== exerciseName);

    setSwap({ slot, exerciseName, loading: true, alternatives: null, error: null });

    try {
      const res = await fetch("/api/swap-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName,
          equipment: workoutMeta.equipment,
          goal: workoutMeta.goal,
          experienceLevel: workoutMeta.experienceLevel,
          existingNames,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        setSwap((prev) => prev ? { ...prev, loading: false, alternatives: data.alternatives } : null);
      } else {
        setSwap((prev) => prev ? { ...prev, loading: false, error: "Couldn't load alternatives. Try again." } : null);
      }
    } catch {
      setSwap((prev) => prev ? { ...prev, loading: false, error: "Couldn't load alternatives. Try again." } : null);
    }
  }

  function pickAlternative(exercise: Exercise) {
    if (!swap) return;
    onSwapExercise(swap.slot, exercise);
    setSwap(null);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted uppercase tracking-widest">
            Superset {index + 1} / {total}
          </p>
        </div>

        <ExerciseCard
          slot="A"
          name={superset.a.name}
          detail={superset.a.detail}
          prev={superset.a.prev}
          weightKg={logA.weightKg}
          reps={logA.reps}
          weightUnit={weightUnit}
          prWeightKg={prMap[superset.a.name]}
          progression={superset.a.progression}
          regression={superset.a.regression}
          form_cues={superset.a.form_cues}
          onWeightChange={(v) => onLogAChange({ ...logA, weightKg: v })}
          onRepsChange={(v) => onLogAChange({ ...logA, reps: v })}
          onSwap={() => openSwap("a")}
        />

        <ExerciseCard
          slot="B"
          name={superset.b.name}
          detail={superset.b.detail}
          prev={superset.b.prev}
          weightKg={logB.weightKg}
          reps={logB.reps}
          weightUnit={weightUnit}
          prWeightKg={prMap[superset.b.name]}
          progression={superset.b.progression}
          regression={superset.b.regression}
          form_cues={superset.b.form_cues}
          onWeightChange={(v) => onLogBChange({ ...logB, weightKg: v })}
          onRepsChange={(v) => onLogBChange({ ...logB, reps: v })}
          onSwap={() => openSwap("b")}
        />

        {/* Difficulty feedback */}
        <div className="rounded-xl border border-border-default bg-surface p-3">
          <p className="text-xs text-text-muted mb-2.5">How did that feel?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFeedbackChange(feedback === "easy" ? null : "easy")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                feedback === "easy"
                  ? "border-green-500/40 bg-green-500/15 text-green-400"
                  : "border-border-default text-text-secondary"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              Too easy
            </button>
            <button
              type="button"
              onClick={() => onFeedbackChange(feedback === "hard" ? null : "hard")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                feedback === "hard"
                  ? "border-red-500/40 bg-red-500/15 text-red-400"
                  : "border-border-default text-text-secondary"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              Too hard
            </button>
          </div>
        </div>
      </div>

      {/* Swap modal */}
      {swap && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setSwap(null); }}
        >
          <div className="w-full max-w-lg bg-surface rounded-t-2xl px-5 pt-5 pb-10 space-y-4">
            <div className="mx-auto w-10 h-1 rounded-full bg-border-default mb-1" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted">Replacing</p>
                <p className="text-base font-semibold text-text-primary">{swap.exerciseName}</p>
                <p className="text-xs text-text-muted mt-0.5">This session only — your program stays the same</p>
              </div>
              <button type="button" onClick={() => setSwap(null)} className="text-text-muted text-xl leading-none mt-0.5">×</button>
            </div>

            {swap.loading && (
              <p className="text-sm text-text-secondary py-4 text-center">Finding alternatives…</p>
            )}

            {swap.error && (
              <p className="text-sm text-red-400 text-center">{swap.error}</p>
            )}

            {swap.alternatives && !swap.loading && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Choose a replacement</p>
                {swap.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickAlternative(alt)}
                    className="w-full text-left rounded-xl border border-border-default bg-surface-elevated px-4 py-3 space-y-0.5"
                  >
                    <p className="text-sm font-semibold text-text-primary">{alt.name}</p>
                    <p className="text-xs text-text-secondary">{alt.detail}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
