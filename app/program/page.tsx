import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/BottomNav";
import type { WorkoutPlan } from "@/lib/types";

// ─── week helpers ────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Returns Monday 00:00:00 of the week containing `date`. */
function weekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

/** Days-per-week → which weekday indices (0=Mon…6=Sun) are training days. */
const TRAINING_PATTERNS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

// ─── page ────────────────────────────────────────────────────────────────────

export default async function ProgramPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const monday = weekMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  const todayStr = now.toISOString().slice(0, 10);

  const [{ data: profile }, { data: rawWorkouts }] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("days_per_week")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("workouts")
          .select("id, name, generated_at, payload")
          .eq("user_id", user.id)
          .gte("generated_at", monday.toISOString())
          .lt("generated_at", sunday.toISOString())
          .order("generated_at")
      : Promise.resolve({ data: [] }),
  ]);

  const workouts = rawWorkouts ?? [];

  // Which workouts are completed (have at least one logged set)?
  const completedIds = new Set<string>();
  if (workouts.length > 0) {
    const { data: sets } = await supabase
      .from("logged_sets")
      .select("workout_id")
      .in(
        "workout_id",
        workouts.map((w) => w.id),
      );
    for (const s of sets ?? []) completedIds.add(s.workout_id);
  }

  const daysPerWeek: number = profile?.days_per_week ?? 3;
  const trainingDayIndices = TRAINING_PATTERNS[daysPerWeek] ?? TRAINING_PATTERNS[3];

  // Build the 7-day array
  type DayEntry = {
    idx: number;
    label: string;
    dateStr: string;
    dayNum: number;
    isToday: boolean;
    isPast: boolean;
    isTraining: boolean;
    workout: (typeof workouts)[number] | undefined;
    isCompleted: boolean;
  };

  const days: DayEntry[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const workout = workouts.find((w) => w.generated_at.slice(0, 10) === dateStr);
    return {
      idx: i,
      label: DAY_LABELS[i],
      dateStr,
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isTraining: trainingDayIndices.includes(i),
      workout,
      isCompleted: workout ? completedIds.has(workout.id) : false,
    };
  });

  // ── Next workout callout ─────────────────────────────────────────────────
  const todayIdx = days.findIndex((d) => d.isToday);

  // Find the first training day from today onward that isn't already completed
  const nextDay = days
    .slice(todayIdx)
    .find((d) => d.isTraining && !d.isCompleted);

  let nextLabel = "";
  let nextSub = "";

  if (nextDay) {
    const daysAway = nextDay.idx - todayIdx;
    if (daysAway === 0) {
      nextLabel = "Today";
      nextSub = nextDay.workout ? nextDay.workout.name : "Ready to generate";
    } else if (daysAway === 1) {
      nextLabel = "Tomorrow";
      nextSub = `${nextDay.label} · training day`;
    } else {
      nextLabel = nextDay.label;
      nextSub = `in ${daysAway} days`;
    }
  } else {
    // All training days this week done — next is first training day of next week
    const firstNextWeekIdx = trainingDayIndices[0];
    const daysAway = 7 - todayIdx + firstNextWeekIdx;
    nextLabel = DAY_LABELS[firstNextWeekIdx];
    nextSub = `in ${daysAway} day${daysAway === 1 ? "" : "s"}`;
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-28">
      <h1 className="text-xl font-semibold mb-6">This week</h1>

      {/* ── Next workout callout ───────────────────────────────────────────── */}
      <div className="rounded-xl bg-surface border border-border-default p-4 flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">
            Next workout
          </p>
          <p className="text-lg font-semibold text-text-primary">{nextLabel}</p>
          <p className="text-xs text-text-secondary mt-0.5">{nextSub}</p>
        </div>
        {nextDay?.isToday && (
          <Link
            href={nextDay.workout ? "/workout" : "/onboarding"}
            className="rounded-xl bg-text-primary text-bg px-4 py-2 text-sm font-medium"
          >
            {nextDay.workout ? "Train now" : "Generate"}
          </Link>
        )}
      </div>

      {/* ── Week strip ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between mb-8">
        {days.map((day) => {
          const base = "flex flex-col items-center gap-1.5";
          let circleClass =
            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium ";

          if (day.isCompleted) {
            circleClass += "bg-text-primary text-bg";
          } else if (day.isToday) {
            circleClass += "ring-2 ring-text-primary text-text-primary";
          } else if (!day.isPast && day.isTraining) {
            circleClass += "border border-border-default text-text-secondary";
          } else {
            circleClass += "text-text-disabled";
          }

          return (
            <div key={day.dateStr} className={base}>
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                {day.label}
              </p>
              <div className={circleClass}>
                {day.isCompleted ? (
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 6.5l3 3 5-5" />
                  </svg>
                ) : (
                  day.dayNum
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Day cards ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {days.map((day) => {
          // Rest day with no workout — skip
          if (!day.isTraining && !day.workout && !day.isToday) return null;
          // Past rest day — skip
          if (day.isPast && !day.workout) return null;

          // ── Today, no workout generated yet ──
          if (day.isToday && !day.workout) {
            return (
              <div
                key={day.dateStr}
                className="rounded-xl border border-border-default bg-surface p-4"
              >
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
                  Today
                </p>
                <p className="text-sm font-medium text-text-primary mb-3">
                  No workout generated yet
                </p>
                <Link
                  href="/onboarding"
                  className="text-xs text-text-secondary underline underline-offset-4"
                >
                  Generate today&apos;s workout →
                </Link>
              </div>
            );
          }

          // ── Future training day, no workout ──
          if (!day.isPast && !day.isToday && !day.workout) {
            return (
              <div
                key={day.dateStr}
                className="rounded-xl border border-border-subtle bg-surface p-4 opacity-50"
              >
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
                  {day.label}
                </p>
                <p className="text-sm text-text-secondary">Training day</p>
              </div>
            );
          }

          if (!day.workout) return null;

          const plan = day.workout.payload as WorkoutPlan;

          // ── Past completed workout ──
          if (day.isPast && day.isCompleted) {
            return (
              <Link
                key={day.dateStr}
                href={`/history/${day.workout.id}`}
                className="block rounded-xl border border-border-default bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">
                      {day.label} · Done
                    </p>
                    <p className="text-sm font-semibold text-text-primary">
                      {day.workout.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{plan.day}</p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-muted shrink-0"
                  >
                    <path d="M6 12l4-4-4-4" />
                  </svg>
                </div>
              </Link>
            );
          }

          // ── Past missed workout (generated but not logged) ──
          if (day.isPast && !day.isCompleted) {
            return (
              <Link
                key={day.dateStr}
                href={`/history/${day.workout.id}`}
                className="block rounded-xl border border-border-subtle bg-surface p-4 opacity-60"
              >
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">
                  {day.label} · Missed
                </p>
                <p className="text-sm text-text-secondary">{day.workout.name}</p>
              </Link>
            );
          }

          // ── Today's workout (expanded) ──
          return (
            <div
              key={day.dateStr}
              className="rounded-xl border border-border-default bg-surface overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">
                  Today
                </p>
                <p className="text-sm font-semibold text-text-primary">
                  {day.workout.name}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{plan.day}</p>
              </div>

              {/* Exercise list with progressions/regressions */}
              <div className="border-t border-border-subtle divide-y divide-border-subtle">
                {plan.supersets.map((superset, i) => (
                  <div key={i} className="px-4 py-3 space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted">
                      Superset {i + 1}
                    </p>
                    {(["a", "b"] as const).map((slot) => {
                      const ex = superset[slot];
                      return (
                        <div key={slot} className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted mr-1.5">
                                {slot.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-text-primary">
                                {ex.name}
                              </span>
                              <p className="text-xs text-text-secondary mt-0.5">
                                {ex.detail}
                              </p>
                            </div>
                          </div>
                          {(ex.regression || ex.progression) && (
                            <div className="pl-4 space-y-1">
                              {ex.regression && (
                                <p className="text-[11px] text-text-muted">
                                  <span className="font-medium">Too hard:</span>{" "}
                                  {ex.regression}
                                </p>
                              )}
                              {ex.progression && (
                                <p className="text-[11px] text-text-muted">
                                  <span className="font-medium">Too easy:</span>{" "}
                                  {ex.progression}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <p className="text-sm text-text-secondary mt-4">
          Sign in to see your weekly program.
        </p>
      )}

      <BottomNav />
    </main>
  );
}
