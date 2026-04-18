import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LoggedSet } from "@/lib/types";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, name, day, generated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workout) return notFound();

  const { data: sets } = await supabase
    .from("logged_sets")
    .select("superset_index, slot, exercise_name, weight_kg, reps")
    .eq("workout_id", id)
    .order("superset_index")
    .order("slot");

  type SetRow = Pick<LoggedSet, "superset_index" | "slot" | "exercise_name" | "weight_kg" | "reps">;
  const grouped: Record<number, { a?: SetRow; b?: SetRow }> = {};
  for (const set of (sets ?? []) as SetRow[]) {
    if (!grouped[set.superset_index]) grouped[set.superset_index] = {};
    grouped[set.superset_index][set.slot] = set;
  }

  const supersets = Object.entries(grouped).sort(([a], [b]) => +a - +b);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <Link
        href="/history"
        className="text-sm text-text-secondary mb-6 inline-block"
      >
        &larr; History
      </Link>

      <h1 className="text-xl font-semibold">{workout.name}</h1>
      <p className="text-xs text-text-muted mt-0.5 mb-8">
        {workout.day} &middot;{" "}
        {new Date(workout.generated_at).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {supersets.length === 0 ? (
        <p className="text-sm text-text-secondary">No sets logged for this workout.</p>
      ) : (
        <ul className="space-y-4">
          {supersets.map(([index, superset]) => (
            <li
              key={index}
              className="rounded-xl border border-border-default bg-surface p-4 space-y-3"
            >
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                Superset {+index + 1}
              </p>
              {(["a", "b"] as const).map((slot) => {
                const s = superset[slot];
                if (!s) return null;
                return (
                  <div key={slot} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary">
                      {s.exercise_name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {s.weight_kg != null ? `${s.weight_kg} kg` : "—"}{" "}
                      &middot;{" "}
                      {s.reps != null ? `${s.reps} reps` : "—"}
                    </p>
                  </div>
                );
              })}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
