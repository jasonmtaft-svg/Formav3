"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RestView } from "@/components/workout/RestView";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { Button } from "@/components/ui/Button";
import { useWorkout } from "@/lib/workout-context";

export default function RestPage() {
  const router = useRouter();
  const { session } = useWorkout();
  const [remaining, setRemaining] = useState<number | null>(null);

  // advanceSuperset was called before navigating here, so currentSupersetIndex
  // already points to the next superset. The one we just completed is at index - 1.
  const completedIndex = (session?.currentSupersetIndex ?? 1) - 1;
  const completedSuperset = session?.plan.supersets[completedIndex];
  const nextSuperset = session?.plan.supersets[session!.currentSupersetIndex];
  const restSeconds = completedSuperset?.restSeconds ?? 90;

  useEffect(() => {
    setRemaining(restSeconds);
  }, [restSeconds]);

  // Countdown — auto-advance to workout when it hits 0
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      router.push("/workout");
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, router]);

  if (!session || remaining === null) return null;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <WorkoutHeader title="Rest" subtitle="Catch your breath" />
      <RestView
        restSeconds={restSeconds}
        remaining={remaining}
        nextSuperset={nextSuperset}
      />
      <div className="px-6 mt-6">
        <Button variant="secondary" onClick={() => router.push("/workout")}>
          Skip rest
        </Button>
      </div>
    </main>
  );
}
