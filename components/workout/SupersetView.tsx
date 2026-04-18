"use client";

import { ExerciseCard } from "@/components/ui/ExerciseCard";
import { TimerRing } from "@/components/ui/TimerRing";
import type { Superset, SetLog, WeightUnit } from "@/lib/types";

interface SupersetViewProps {
  superset: Superset;
  index: number;
  total: number;
  logA: SetLog;
  logB: SetLog;
  onLogAChange: (log: SetLog) => void;
  onLogBChange: (log: SetLog) => void;
  timerRemaining: number;
  timerRunning: boolean;
  weightUnit: WeightUnit;
  prMap: Record<string, number>;
}

export function SupersetView({
  superset,
  index,
  total,
  logA,
  logB,
  onLogAChange,
  onLogBChange,
  timerRemaining,
  timerRunning,
  weightUnit,
  prMap,
}: SupersetViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted uppercase tracking-widest">
          Superset {index + 1} / {total}
        </p>
        {timerRunning && (
          <TimerRing
            total={superset.a.timerSeconds}
            remaining={timerRemaining}
          />
        )}
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
      />
    </div>
  );
}
