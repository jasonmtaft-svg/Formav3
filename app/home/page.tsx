import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import Link from "next/link";

// ─── constants ───────────────────────────────────────────────────────────────

const AWARDS = [
  { weeks: 3,  label: "3 weeks",  emoji: "🥉" },
  { weeks: 6,  label: "6 weeks",  emoji: "🥈" },
  { weeks: 9,  label: "9 weeks",  emoji: "🥇" },
  { weeks: 12, label: "12 weeks", emoji: "🏆" },
];

const TRAINING_PATTERNS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

// One message per day of the week (Sun=0 … Sat=6)
const MINDSET_MESSAGES = [
  { headline: "Rest is part of the work.",      sub: "Recovery is where growth happens." },
  { headline: "New week, new opportunity.",      sub: "Start strong and build momentum." },
  { headline: "Progress is built session by session.", sub: "Trust the process." },
  { headline: "Halfway through. Stay the course.", sub: "Consistency compounds." },
  { headline: "Every rep counts.",               sub: "Small efforts add up to big results." },
  { headline: "Finish the week strong.",         sub: "You've come too far to slow down now." },
  { headline: "Earned your rest today.",         sub: "Reflect on the week. You showed up." },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function computeWeekStats(loggedAts: string[], daysPerWeek: number) {
  const uniqueDates = [...new Set(loggedAts.map((d) => d.slice(0, 10)))];
  const nowWeekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  const weekMap = new Map<string, Set<string>>();
  for (const date of uniqueDates) {
    const ws = getWeekStart(new Date(date + "T12:00:00Z")).toISOString().slice(0, 10);
    if (!weekMap.has(ws)) weekMap.set(ws, new Set());
    weekMap.get(ws)!.add(date);
  }

  const weekSessions = Math.min(weekMap.get(nowWeekStart)?.size ?? 0, daysPerWeek);

  let completedWeeks = 0;
  for (const days of weekMap.values()) {
    if (days.size >= daysPerWeek) completedWeeks++;
  }

  return { weekSessions, completedWeeks };
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: allSets }, { data: recentWorkouts }] =
    await Promise.all([
      user
        ? supabase.from("profiles").select("*").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("logged_sets")
            .select("logged_at, workout_id")
            .eq("user_id", user.id)
            .order("logged_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("workouts")
            .select("id, name, day, generated_at")
            .eq("user_id", user.id)
            .order("generated_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  const daysPerWeek = (profile?.days_per_week as number | null) ?? 3;
  const hasProgramSet = !!profile?.current_program_id;

  // Today
  const todayStr = new Date().toISOString().slice(0, 10);
  const dow = new Date().getDay();
  const mondayBased = dow === 0 ? 6 : dow - 1;
  const isTodayTraining = (
    TRAINING_PATTERNS[daysPerWeek] ?? TRAINING_PATTERNS[3]
  ).includes(mondayBased);

  const todayWorkout = (recentWorkouts ?? []).find(
    (w) => (w.generated_at as string).slice(0, 10) === todayStr,
  );
  const todayCompleted = todayWorkout
    ? (allSets ?? []).some((s) => s.workout_id === todayWorkout.id)
    : false;

  // Week stats + awards
  const { weekSessions, completedWeeks } = computeWeekStats(
    (allSets ?? []).map((s) => s.logged_at as string),
    daysPerWeek,
  );

  // Mindset: rotate by day of week
  const mindset = MINDSET_MESSAGES[dow];

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Logo />
        <h1 className="text-xl font-semibold">Home</h1>
      </div>

      <div className="space-y-4">

        {/* ── 1. WORKOUT ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border-default bg-surface p-5">
          <p className="text-[11px] uppercase tracking-widest text-text-secondary mb-3">
            Workout
          </p>

          {!hasProgramSet ? (
            <>
              <p className="text-base font-semibold mb-1">Build your program</p>
              <p className="text-sm text-text-secondary mb-4">
                Answer a few questions and Forma generates your personalised
                12-week plan.
              </p>
              <Link
                href="/onboarding"
                className="block text-center rounded-xl bg-accent text-white py-3 text-sm font-semibold"
              >
                Get started →
              </Link>
            </>
          ) : isTodayTraining && !todayCompleted ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Ready to train</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Training day
                </p>
              </div>
              <Link
                href="/workout"
                className="shrink-0 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-semibold"
              >
                Train now →
              </Link>
            </div>
          ) : isTodayTraining && todayCompleted ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Session complete 🎉</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Great work today
                </p>
              </div>
              {todayWorkout && (
                <Link
                  href={`/history/${todayWorkout.id}`}
                  className="shrink-0 rounded-xl border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary"
                >
                  Review →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold">Rest day</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Next session coming up
                </p>
              </div>
              <Link
                href="/program"
                className="shrink-0 rounded-xl border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary"
              >
                Schedule →
              </Link>
            </div>
          )}
        </div>

        {/* ── 2. NUTRITION ────────────────────────────────────────────────── */}
        <Link
          href="/nutrition"
          className="flex items-center justify-between rounded-xl border border-border-default bg-surface p-5"
        >
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-secondary mb-3">
              Nutrition
            </p>
            <p className="text-base font-semibold">Meal plan &amp; macros</p>
            <p className="text-xs text-text-secondary mt-0.5">
              AI-generated recipes tailored to your goal
            </p>
          </div>
          <span className="text-text-disabled text-lg shrink-0 ml-4">→</span>
        </Link>

        {/* ── 3. MINDSET ──────────────────────────────────────────────────── */}
        <Link
          href="/mindset"
          className="flex items-center justify-between rounded-xl border border-border-default bg-surface p-5"
        >
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-secondary mb-3">
              Mindset
            </p>
            <p className="text-base font-semibold">{mindset.headline}</p>
            <p className="text-xs text-text-secondary mt-1">{mindset.sub}</p>
          </div>
          <span className="text-text-disabled text-lg shrink-0 ml-4">→</span>
        </Link>

        {/* ── 4. AWARDS ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border-default bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest text-text-secondary">
              Awards
            </p>
            {completedWeeks > 0 && (
              <p className="text-[11px] text-text-secondary">
                {completedWeeks} week{completedWeeks === 1 ? "" : "s"} completed
              </p>
            )}
          </div>

          {/* Weekly progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-1.5 flex-1">
              {Array.from({ length: daysPerWeek }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i < weekSessions ? "bg-accent" : "bg-border-default"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-text-secondary shrink-0">
              {weekSessions}/{daysPerWeek} this week
            </p>
          </div>

          {/* Badge grid */}
          <div className="grid grid-cols-4 gap-2">
            {AWARDS.map(({ weeks, label, emoji }) => {
              const unlocked = completedWeeks >= weeks;
              return (
                <div
                  key={weeks}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-3 ${
                    unlocked
                      ? "bg-accent-subtle border border-accent"
                      : "bg-surface-elevated border border-border-subtle"
                  }`}
                >
                  <span
                    className={`text-2xl leading-none ${
                      unlocked ? "" : "opacity-50 grayscale"
                    }`}
                  >
                    {emoji}
                  </span>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      unlocked ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {completedWeeks === 0 && (
            <p className="text-xs text-text-secondary mt-3 text-center">
              Complete your first full week to earn your first award
            </p>
          )}
        </div>

      </div>

      <BottomNav />
    </main>
  );
}
