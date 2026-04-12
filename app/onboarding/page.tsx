"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
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

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!goal || !days || !equipment) return;
    setLoading(true);
    setError(null);
    try {
      await generateWorkoutAction({ goal, daysPerWeek: days, equipment });
      router.push("/workout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <Logo />
        <ProgressBar total={3} current={step} />
      </div>

      <div className="flex-1 space-y-6">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-xl font-semibold">What&apos;s your goal?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll tailor every session around it.</p>
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
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-xl font-semibold">How many days per week?</h2>
              <p className="text-sm text-text-secondary mt-1">Be realistic — consistency beats intensity.</p>
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
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-xl font-semibold">What equipment do you have?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll only program what you can actually use.</p>
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

            {error && <p className="text-sm text-error">{error}</p>}
          </>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {step < 2 ? (
          <Button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={
              (step === 0 && !goal) ||
              (step === 1 && !days)
            }
          >
            Continue
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={!equipment || loading}>
            {loading ? "Building your plan…" : "Generate workout"}
          </Button>
        )}

        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
      </div>
    </main>
  );
}
