"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useWorkout } from "@/lib/workout-context";
import { logWorkoutAction } from "@/actions/log-workout";

export default function CompletePage() {
  const router = useRouter();
  const { session, weightUnit } = useWorkout();
  const logged = useRef(false);

  useEffect(() => {
    if (!session || logged.current) return;
    logged.current = true;
    logWorkoutAction(session.workoutId, session.logs, weightUnit).catch(console.error);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return null;

  const totalSupersets = session.plan.supersets.length;
  const totalExercises = totalSupersets * 2;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-8 text-center">
        <Logo size="lg" />

        <div>
          <h1 className="text-2xl font-semibold">Workout complete</h1>
          <p className="text-sm text-text-secondary mt-1">
            {session.plan.workoutName}
          </p>
        </div>

        <div className="flex justify-center gap-10">
          <div>
            <p className="text-3xl font-semibold">{totalSupersets}</p>
            <p className="text-xs text-text-muted mt-1">Supersets</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{totalExercises}</p>
            <p className="text-xs text-text-muted mt-1">Exercises</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.push("/onboarding")}>New workout</Button>
          <Button variant="secondary" onClick={() => router.push("/history")}>
            View history
          </Button>
        </div>
      </div>
    </main>
  );
}
