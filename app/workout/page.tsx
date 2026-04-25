"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SupersetView } from "@/components/workout/SupersetView";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";
import { useWorkout } from "@/lib/workout-context";
import { createClient } from "@/lib/supabase/client";

export default function WorkoutPage() {
  const router = useRouter();
  const { session, completedWorkoutId, isLoading, loadError, weightUnit, prMap, isDeload, workoutMeta, updateLog, updateFeedback, swapSessionExercise, advanceSuperset, retryLoad } = useWorkout();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name as string | undefined;
      setUserName(name?.split(" ")[0] ?? null);
    });
  }, []);
  const superset = session?.plan.supersets[session.currentSupersetIndex];

  function handleComplete() {
    if (!session || !superset) return;
    const isLast =
      session.currentSupersetIndex === session.plan.supersets.length - 1;
    advanceSuperset();
    router.push(isLast ? "/workout/complete" : "/workout/rest");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6">
        <p className="text-text-secondary">Loading workout…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-text-secondary text-sm">{loadError}</p>
          <Button onClick={retryLoad}>Retry</Button>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!session || !superset) {
    if (completedWorkoutId) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 pb-24">
          <div className="w-full max-w-sm space-y-8 text-center">
            <Logo size="lg" />
            <div>
              <h1 className="text-2xl font-semibold">
                {userName ? `Great work, ${userName}.` : "Great work today."}
              </h1>
              <p className="text-sm text-text-secondary mt-2">
                You&apos;ve already completed your workout. Come back tomorrow!
              </p>
            </div>
            <Link
              href={`/history/${completedWorkoutId}`}
              className="block w-full rounded-xl bg-surface border border-border-default px-4 py-3 text-sm font-medium text-text-primary text-center"
            >
              See what you lifted &rarr;
            </Link>
          </div>
          <BottomNav />
        </main>
      );
    }

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 pb-24">
        <div className="w-full max-w-sm space-y-8 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">
              {userName ? `Welcome back, ${userName}.` : "Ready to train?"}
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Build today&apos;s plan and Forma will generate a personalised superset workout in seconds.
            </p>
          </div>
          <Button onClick={() => router.push("/onboarding")}>
            Build today&apos;s plan
          </Button>
        </div>
        <BottomNav />
      </main>
    );
  }

  const isLast =
    session.currentSupersetIndex === session.plan.supersets.length - 1;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <WorkoutHeader
        title={session.plan.workoutName}
        subtitle={session.plan.day}
      />

      {isDeload && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">Welcome back</p>
          <p className="text-xs text-amber-400/80 mt-0.5">
            Weights reduced to 85% to ease you back in after your time off.
          </p>
        </div>
      )}

      <div className="flex-1">
        <SupersetView
          superset={superset}
          index={session.currentSupersetIndex}
          total={session.plan.supersets.length}
          logA={session.logs[session.currentSupersetIndex].a}
          logB={session.logs[session.currentSupersetIndex].b}
          feedback={session.logs[session.currentSupersetIndex].feedback}
          workoutMeta={workoutMeta}
          onLogAChange={(log) =>
            updateLog(session.currentSupersetIndex, "a", log)
          }
          onLogBChange={(log) =>
            updateLog(session.currentSupersetIndex, "b", log)
          }
          onFeedbackChange={(fb) =>
            updateFeedback(session.currentSupersetIndex, fb)
          }
          onSwapExercise={(slot, ex) =>
            swapSessionExercise(session.currentSupersetIndex, slot, ex)
          }
          weightUnit={weightUnit}
          prMap={prMap}
        />
      </div>

      <div className="mt-8">
        <Button onClick={handleComplete}>
          {isLast ? "Finish workout" : "Complete superset"}
        </Button>
      </div>
    </main>
  );
}
