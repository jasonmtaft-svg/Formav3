import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/BottomNav";
import { WorkoutDayCard } from "@/components/program/WorkoutDayCard";
import type { WorkoutPlan, ProgramBlueprint } from "@/lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BLOCK_THEMES = ["Foundation", "Intensification", "Peak"];

function weekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

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

  // Load profile + current program meta in parallel
  const [{ data: profile }, { data: rawWorkouts }] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("days_per_week, current_program_id")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("workouts")
          .select("id, name, generated_at, payload, week_number, block_number, program_id")
          .eq("user_id", user.id)
          .gte("generated_at", monday.toISOString())
          .lt("generated_at", sunday.toISOString())
          .order("generated_at")
      : Promise.resolve({ data: [] }),
  ]);

  const currentProgramId: string | null = profile?.current_program_id ?? null;

  // Load blueprint so we can show upcoming day templates
  let blueprint: ProgramBlueprint | null = null;
  if (currentProgramId) {
    const { data: prog } = await supabase
      .from("programs")
      .select("blueprint")
      .eq("id", currentProgramId)
      .single();
    blueprint = prog?.blueprint ?? null;
  }

  const workouts = rawWorkouts ?? [];
  const daysPerWeek: number = profile?.days_per_week ?? 3;

  // Which workouts this week are completed (have logged sets)?
  const completedIds = new Set<string>();
  if (workouts.length > 0) {
    const { data: sets } = await supabase
      .from("logged_sets")
      .select("workout_id")
      .in("workout_id", workouts.map((w) => w.id));
    for (const s of sets ?? []) completedIds.add(s.workout_id);
  }

  // ── Program position ──────────────────────────────────────────────────────
  let currentWeek = 1;
  let currentBlock = 1;
  let totalSessions = 0;

  if (currentProgramId) {
    // Count all workout rows in the current program to derive position
    const { count } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("program_id", currentProgramId);

    totalSessions = count ?? 0;
    currentWeek = Math.min(Math.floor(totalSessions / daysPerWeek) + 1, 12);
    currentBlock = Math.min(Math.ceil(currentWeek / 4), 3);
  }

  const weeksRemainingInBlock = 4 - ((currentWeek - 1) % 4);

  // ── Build the weekly day array ────────────────────────────────────────────
  const trainingDayIndices = TRAINING_PATTERNS[daysPerWeek] ?? TRAINING_PATTERNS[3];

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

  // ── Next workout callout ──────────────────────────────────────────────────
  const todayIdx = days.findIndex((d) => d.isToday);
  const nextDay = days.slice(todayIdx).find((d) => d.isTraining && !d.isCompleted);

  let nextLabel = "";
  let nextSub = "";

  if (nextDay) {
    const daysAway = nextDay.idx - todayIdx;
    if (daysAway === 0) {
      nextLabel = "Today";
      nextSub = nextDay.workout ? nextDay.workout.name : "Ready to train";
    } else if (daysAway === 1) {
      nextLabel = "Tomorrow";
      nextSub = `${nextDay.label} · training day`;
    } else {
      nextLabel = nextDay.label;
      nextSub = `in ${daysAway} days`;
    }
  } else {
    const firstNext = trainingDayIndices[0];
    const daysAway = 7 - todayIdx + firstNext;
    nextLabel = DAY_LABELS[firstNext];
    nextSub = `in ${daysAway} day${daysAway === 1 ? "" : "s"}`;
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-28">

      {/* ── 12-week program header ─────────────────────────────────────────── */}
      {currentProgramId ? (
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
            Your program
          </p>
          <h1 className="text-xl font-semibold text-text-primary">
            Block {currentBlock} — {BLOCK_THEMES[currentBlock - 1]}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Week {currentWeek} of 12 ·{" "}
            {currentWeek <= 12
              ? `${weeksRemainingInBlock} week${weeksRemainingInBlock === 1 ? "" : "s"} left in this block`
              : "Program complete"}
          </p>

          {/* 12-dot progress row */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: 12 }, (_, i) => {
              const w = i + 1;
              const isCurrent = w === currentWeek;
              const isDone = w < currentWeek;
              return (
                <div
                  key={w}
                  className={[
                    "h-1.5 flex-1 rounded-full",
                    isDone
                      ? "bg-text-primary"
                      : isCurrent
                      ? "bg-text-primary opacity-40"
                      : "bg-border-default",
                  ].join(" ")}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <h1 className="text-xl font-semibold mb-6">Program</h1>
      )}

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
            href={nextDay.workout ? "/workout" : "/workout"}
            className="rounded-xl bg-text-primary text-bg px-4 py-2 text-sm font-medium"
          >
            {nextDay.workout ? "Train now" : "Train now"}
          </Link>
        )}
        {!currentProgramId && (
          <Link
            href="/onboarding"
            className="rounded-xl bg-text-primary text-bg px-4 py-2 text-sm font-medium"
          >
            Start program
          </Link>
        )}
      </div>

      {/* ── Week strip ─────────────────────────────────────────────────────── */}
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3">
        This week
      </p>
      <div className="flex justify-between mb-8">
        {days.map((day) => {
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
            <div key={day.dateStr} className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                {day.label}
              </p>
              <div className={circleClass}>
                {day.isCompleted ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3">
        This week&apos;s workouts
      </p>
      <div className="space-y-3">
        {days.map((day) => {
          // Skip rest days with no workout
          if (!day.isTraining && !day.workout) return null;
          if (day.isPast && !day.workout) return null;

          // Today — workout auto-created from blueprint
          if (day.isToday && !day.workout) {
            const dayTemplateIdx = trainingDayIndices.indexOf(day.idx);
            const dayTemplate = blueprint?.blocks[currentBlock - 1]?.days[dayTemplateIdx];
            if (!currentProgramId || !dayTemplate) {
              return (
                <div key={day.dateStr} className="rounded-xl border border-border-default bg-surface p-4">
                  <p className="text-sm text-text-secondary">
                    {currentProgramId ? "Loading your session…" : "No program set up yet."}
                  </p>
                  {!currentProgramId && (
                    <Link href="/onboarding" className="mt-2 text-xs text-text-secondary underline underline-offset-4 block">
                      Set up your program →
                    </Link>
                  )}
                </div>
              );
            }
            return (
              <WorkoutDayCard
                key={day.dateStr}
                dayLabel={day.label}
                dayNum={day.dayNum}
                workoutName={dayTemplate.dayLabel}
                dayTemplate={dayTemplate.dayLabel}
                supersets={dayTemplate.supersets}
                status="today"
                blockWeekLabel={`Block ${currentBlock} · Week ${currentWeek}`}
                defaultOpen
              />
            );
          }

          // Future training day — pull from blueprint
          if (!day.isPast && !day.isToday && !day.workout) {
            const dayTemplateIdx = trainingDayIndices.indexOf(day.idx);
            const dayTemplate = blueprint?.blocks[currentBlock - 1]?.days[dayTemplateIdx];
            if (!dayTemplate) return null;
            return (
              <WorkoutDayCard
                key={day.dateStr}
                dayLabel={day.label}
                dayNum={day.dayNum}
                workoutName={dayTemplate.dayLabel}
                dayTemplate={dayTemplate.dayLabel}
                supersets={dayTemplate.supersets}
                status="upcoming"
              />
            );
          }

          if (!day.workout) return null;

          const plan = day.workout.payload as WorkoutPlan;
          const blk = day.workout.block_number;
          const wk = day.workout.week_number;
          const blockLabel = blk ? `Block ${blk} · Week ${wk}` : undefined;

          // Completed past workout
          if (day.isPast && day.isCompleted) {
            return (
              <WorkoutDayCard
                key={day.dateStr}
                dayLabel={day.label}
                dayNum={day.dayNum}
                workoutName={day.workout.name}
                dayTemplate={plan.day}
                supersets={plan.supersets}
                status="completed"
                blockWeekLabel={blockLabel}
                historyId={day.workout.id}
              />
            );
          }

          // Missed past workout
          if (day.isPast && !day.isCompleted) {
            return (
              <WorkoutDayCard
                key={day.dateStr}
                dayLabel={day.label}
                dayNum={day.dayNum}
                workoutName={day.workout.name}
                dayTemplate={plan.day}
                supersets={plan.supersets}
                status="missed"
                blockWeekLabel={blockLabel}
                historyId={day.workout.id}
              />
            );
          }

          // Today's workout (already created in DB)
          return (
            <WorkoutDayCard
              key={day.dateStr}
              dayLabel={day.label}
              dayNum={day.dayNum}
              workoutName={day.workout.name}
              dayTemplate={plan.day}
              supersets={plan.supersets}
              status="today"
              blockWeekLabel={blockLabel}
              defaultOpen
            />
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
