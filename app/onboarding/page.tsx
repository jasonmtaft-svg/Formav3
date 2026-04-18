"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { generateWorkoutAction } from "@/actions/generate-workout";
import type { Goal, Equipment } from "@/lib/types";

const GOALS: { value: Goal; label: string }[] = [
  { value: "build_muscle", label: "Build muscle" },
  { value: "lose_fat", label: "Lose fat" },
  { value: "improve_fitness", label: "Improve fitness" },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "full_gym", label: "Full gym" },
  { value: "dumbbells_only", label: "Dumbbells only" },
  { value: "bodyweight", label: "Bodyweight" },
];

const DAYS = [2, 3, 4, 5, 6];

const LOADING_MESSAGES = [
  "Analysing your preferences…",
  "Selecting exercises…",
  "Pairing supersets…",
  "Finalising your plan…",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = goal && days && equipment;

  async function handleGenerate() {
    if (!goal || !days || !equipment) return;
    setLoading(true);
    setLoadingStep(0);
    setError(null);

    // Cycle through loading messages while waiting
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
    }, 1200);

    try {
      await generateWorkoutAction({ goal, daysPerWeek: days, equipment });
      router.push("/workout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    } finally {
      clearInterval(interval);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 gap-8">
        <Logo size="lg" />

        {/* Pulsing skeleton cards */}
        <div className="w-full max-w-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border-default bg-surface p-4 space-y-2 animate-pulse"
            >
              <div
                className="h-3 rounded bg-surface-elevated"
                style={{ width: `${50 + i * 15}%` }}
              />
              <div className="h-3 rounded bg-surface-elevated w-1/3" />
            </div>
          ))}
        </div>

        <p className="text-sm text-text-secondary">
          {LOADING_MESSAGES[loadingStep]}
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <Logo />

      <div className="mt-10 space-y-10 flex-1">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">What&apos;s your goal?</h2>
            <p className="text-sm text-text-secondary mt-1">
              We&apos;ll tailor every session around it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={goal === g.value}
                onSelect={() => setGoal(g.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">How many days per week?</h2>
            <p className="text-sm text-text-secondary mt-1">
              Be realistic — consistency beats intensity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <Chip
                key={d}
                label={`${d} days`}
                selected={days === d}
                onSelect={() => setDays(d)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">
              What equipment do you have?
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              We&apos;ll only program what you can actually use.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((e) => (
              <Chip
                key={e.value}
                label={e.label}
                selected={equipment === e.value}
                onSelect={() => setEquipment(e.value)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      <div className="mt-8">
        <Button onClick={handleGenerate} disabled={!canGenerate}>
          Generate workout
        </Button>
      </div>
    </main>
  );
}
