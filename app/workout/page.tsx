"use client";

import { useRouter } from "next/navigation";
import { SupersetView } from "@/components/workout/SupersetView";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";
import { useWorkout } from "@/lib/workout-context";

export default function WorkoutPage() {
  const router = useRouter();
  const { session, completedWorkoutId, isLoading, weightUnit, prMap, updateLog, advanceSuperset } = useWorkout();
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

  if (!session || !superset) {
    if (completedWorkoutId) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 pb-24">
          <div className="w-full max-w-sm space-y-8 text-center">
            <Logo size="lg" />
            <div>
              <h1 className="text-2xl font-semibold">Great work today.</h1>
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
            <h1 className="text-2xl font-semibold">Ready to train?</h1>
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

      <div className="flex-1">
        <SupersetView
          superset={superset}
          index={session.currentSupersetIndex}
          total={session.plan.supersets.length}
          logA={session.logs[session.currentSupersetIndex].a}
          logB={session.logs[session.currentSupersetIndex].b}
          onLogAChange={(log) =>
            updateLog(session.currentSupersetIndex, "a", log)
          }
          onLogBChange={(log) =>
            updateLog(session.currentSupersetIndex, "b", log)
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
