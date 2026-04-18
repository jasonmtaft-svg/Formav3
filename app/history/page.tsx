import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/BottomNav";
import { StrengthChart } from "@/components/ui/StrengthChart";
import type { ChartSeries } from "@/components/ui/StrengthChart";
import type { WeightUnit } from "@/lib/types";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: workouts }, { data: profile }, { data: rawSets }] = await Promise.all([
    user
      ? supabase
          .from("workouts")
          .select("id, name, day, generated_at")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("profiles")
          .select("weight_unit")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("logged_sets")
          .select("exercise_name, weight_kg, logged_at")
          .eq("user_id", user.id)
          .not("weight_kg", "is", null)
          .order("logged_at")
      : Promise.resolve({ data: [] }),
  ]);

  const weightUnit: WeightUnit = (profile as { weight_unit?: string } | null)?.weight_unit === "lbs" ? "lbs" : "kg";

  // Build strength chart series: for each exercise, collect max weight per calendar day
  const byExercise = new Map<string, Map<string, number>>();
  for (const row of rawSets ?? []) {
    const date = (row.logged_at as string).slice(0, 10);
    if (!byExercise.has(row.exercise_name)) byExercise.set(row.exercise_name, new Map());
    const dateMap = byExercise.get(row.exercise_name)!;
    const prev = dateMap.get(date) ?? 0;
    if ((row.weight_kg as number) > prev) dateMap.set(date, row.weight_kg as number);
  }

  const chartSeries: ChartSeries[] = Array.from(byExercise.entries())
    .map(([name, dateMap]) => ({
      name,
      points: Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, maxKg]) => ({ date, maxKg })),
    }))
    // Only show exercises logged on at least 2 days (so the chart is meaningful)
    .filter((s) => s.points.length >= 1)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-24">
      <h1 className="text-xl font-semibold mb-6">History</h1>

      {/* ── Strength Progress ──────────────────────────────────────────────── */}
      {chartSeries.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[11px] uppercase tracking-widest text-text-muted mb-3">
            Strength progress
          </h2>
          <div className="rounded-xl border border-border-default bg-surface p-4">
            <StrengthChart series={chartSeries} weightUnit={weightUnit} />
          </div>
        </section>
      )}

      {/* ── Workout list ───────────────────────────────────────────────────── */}
      {!workouts?.length ? (
        <p className="text-text-secondary text-sm">
          No workouts yet. Complete your first session!
        </p>
      ) : (
        <ul className="space-y-3">
          {workouts.map((w) => (
            <li key={w.id}>
              <Link
                href={`/history/${w.id}`}
                className="block rounded-xl border border-border-default bg-surface p-4"
              >
                <p className="font-medium text-text-primary">{w.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {w.day} &middot;{" "}
                  {new Date(w.generated_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BottomNav />
    </main>
  );
}
