"use client";

interface ExerciseCardProps {
  slot: "A" | "B";
  name: string;
  detail: string;
  prev: string;
  weightKg: string;
  reps: string;
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
}

export function ExerciseCard({
  slot,
  name,
  detail,
  prev,
  weightKg,
  reps,
  onWeightChange,
  onRepsChange,
}: ExerciseCardProps) {
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
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[11px] text-text-muted mb-1">Weight (kg)</label>
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

      <p className="text-[11px] text-text-muted">Prev: {prev}</p>
    </div>
  );
}
