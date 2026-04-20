"use client";

import { useState } from "react";
import type { WeightUnit } from "@/lib/types";

interface ExerciseCardProps {
  slot: "A" | "B";
  name: string;
  detail: string;
  prev: string;
  weightKg: string;
  reps: string;
  weightUnit: WeightUnit;
  prWeightKg?: number;
  progression?: string;
  regression?: string;
  form_cues?: string[];
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
}

const KG_TO_LBS = 2.20462;

function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

/** Parse "20 kg × 10 reps" → { weightKg: 20, reps: 10 } */
function parsePrev(prev: string): { weightKg: number | null; reps: number | null } {
  const weightMatch = prev.match(/(\d+(?:\.\d+)?)\s*kg/);
  const repsMatch = prev.match(/(\d+)\s*reps?/);
  return {
    weightKg: weightMatch ? parseFloat(weightMatch[1]) : null,
    reps: repsMatch ? parseInt(repsMatch[1], 10) : null,
  };
}

function formatPrev(prev: string, unit: WeightUnit): string {
  if (unit === "kg" || !prev || prev === "First session") return prev;
  const { weightKg, reps } = parsePrev(prev);
  const parts: string[] = [];
  if (weightKg !== null) parts.push(`${kgToLbs(weightKg)} lbs`);
  if (reps !== null) parts.push(`${reps} reps`);
  return parts.length > 0 ? parts.join(" × ") : prev;
}

function getNudge(prev: string, unit: WeightUnit): string | null {
  if (!prev || prev === "First session") return null;
  const { weightKg, reps } = parsePrev(prev);
  if (reps !== null && reps >= 10) {
    if (weightKg !== null) {
      if (unit === "lbs") {
        return `Great reps last time — try ${kgToLbs(weightKg + 2.5)} lbs today`;
      }
      return `Great reps last time — try ${weightKg + 2.5} kg today`;
    }
    return "Strong reps last time — consider adding weight";
  }
  return null;
}

export function ExerciseCard({
  slot,
  name,
  detail,
  prev,
  weightKg,
  reps,
  weightUnit,
  prWeightKg,
  progression,
  regression,
  form_cues,
  onWeightChange,
  onRepsChange,
}: ExerciseCardProps) {
  const [showAlts, setShowAlts] = useState(false);
  const [showCues, setShowCues] = useState(false);
  const nudge = getNudge(prev, weightUnit);

  const isPR = (() => {
    if (prWeightKg === undefined || !weightKg) return false;
    const entered = parseFloat(weightKg);
    if (isNaN(entered) || entered <= 0) return false;
    const enteredKg = weightUnit === "lbs" ? entered / KG_TO_LBS : entered;
    return enteredKg > prWeightKg;
  })();

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">
            Exercise {slot}
          </p>
          <p className="mt-0.5 text-base font-semibold text-text-primary">{name}</p>
          <p className="text-sm text-text-secondary">{detail}</p>
        </div>
        {isPR && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent uppercase tracking-widest">
            PR
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[11px] text-text-muted mb-1">
            Weight ({weightUnit})
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => onWeightChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] text-text-muted mb-1">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => onRepsChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
          />
        </div>
      </div>

      <p className="text-[11px] text-text-muted">Prev: {formatPrev(prev, weightUnit)}</p>

      {nudge && (
        <p className="text-[11px] text-text-secondary border-t border-border-subtle pt-2">
          {nudge}
        </p>
      )}

      {form_cues && form_cues.length > 0 && (
        <div className="border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={() => setShowCues((v) => !v)}
            className="text-[11px] text-text-muted"
          >
            {showCues ? "Hide form cues ↑" : "Form cues ↓"}
          </button>
          {showCues && (
            <ul className="mt-2 space-y-1.5">
              {form_cues.map((cue, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="shrink-0 w-4 h-4 rounded-full border border-border-default flex items-center justify-center text-[9px] font-bold text-text-muted mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-secondary leading-snug">{cue}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(progression || regression) && (
        <div className="border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={() => setShowAlts((v) => !v)}
            className="text-[11px] text-text-muted"
          >
            {showAlts ? "Hide alternatives ↑" : "Too hard / too easy? ↓"}
          </button>
          {showAlts && (
            <div className="mt-2 space-y-1.5">
              {regression && (
                <div className="flex gap-2 items-start">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-text-muted w-16 mt-0.5">Too hard</span>
                  <p className="text-xs text-text-secondary leading-snug">{regression}</p>
                </div>
              )}
              {progression && (
                <div className="flex gap-2 items-start">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-text-muted w-16 mt-0.5">Too easy</span>
                  <p className="text-xs text-text-secondary leading-snug">{progression}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
