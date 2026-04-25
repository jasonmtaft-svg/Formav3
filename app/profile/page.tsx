import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { DangerZone } from "@/components/ui/DangerZone";
import { updateWeightUnitAction } from "@/actions/update-weight-unit";
import Link from "next/link";
import type { StrengthAssessment } from "@/lib/types";

const GOAL_LABELS: Record<string, string> = {
  build_muscle: "Build muscle",
  lose_fat: "Lose fat",
  improve_fitness: "Improve fitness",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  full_gym: "Full gym",
  dumbbells_only: "Dumbbells only",
  bodyweight: "Bodyweight",
};

const AWARDS = [
  { weeks: 3,  label: "3 weeks",  emoji: "🥉" },
  { weeks: 6,  label: "6 weeks",  emoji: "🥈" },
  { weeks: 9,  label: "9 weeks",  emoji: "🥇" },
  { weeks: 12, label: "12 weeks", emoji: "🏆" },
];

/** Return the Monday of whichever week `date` falls in (UTC). */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getUTCDay(); // 0 = Sun
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function computeWeekStats(loggedAts: string[], daysPerWeek: number) {
  const uniqueDates = [...new Set(loggedAts.map((d) => d.slice(0, 10)))];

  const nowWeekStart = getWeekStart(new Date()).toISOString().slice(0, 10);

  // Group distinct training days by their week-start string
  const weekMap = new Map<string, Set<string>>();
  for (const date of uniqueDates) {
    const ws = getWeekStart(new Date(date + "T12:00:00Z")).toISOString().slice(0, 10);
    if (!weekMap.has(ws)) weekMap.set(ws, new Set());
    weekMap.get(ws)!.add(date);
  }

  // Sessions logged so far in the current week (capped at the plan)
  const thisWeekDays = weekMap.get(nowWeekStart)?.size ?? 0;
  const weekSessions = Math.min(thisWeekDays, daysPerWeek);

  // Count every week (including current) where the user hit their target
  let completedWeeks = 0;
  for (const days of weekMap.values()) {
    if (days.size >= daysPerWeek) completedWeeks++;
  }

  return { weekSessions, completedWeeks };
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, setsResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("*").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("logged_sets")
          .select("logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const profile = profileResult.data;
  const weightUnit = (profile?.weight_unit ?? "kg") as "kg" | "lbs";
  const daysPerWeek = (profile?.days_per_week as number | null) ?? 3;
  const { weekSessions, completedWeeks } = computeWeekStats(
    (setsResult.data ?? []).map((r) => r.logged_at as string),
    daysPerWeek,
  );

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-24">
      <div className="flex items-center gap-3 mb-10">
        <Logo />
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="space-y-4 flex-1">
        {/* Weekly progress */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-muted uppercase tracking-widest">
              This week
            </p>
            <p className="text-sm text-text-secondary">
              {weekSessions}/{daysPerWeek} sessions
            </p>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: daysPerWeek }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < weekSessions ? "bg-accent" : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>
          {weekSessions === daysPerWeek && (
            <p className="text-xs text-accent mt-2 font-medium">
              Week complete 🎉
            </p>
          )}
        </div>

        {/* Awards */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
            Awards
          </p>
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
                      unlocked ? "" : "opacity-25 grayscale"
                    }`}
                  >
                    {emoji}
                  </span>
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      unlocked ? "text-accent" : "text-text-disabled"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
            Account
          </p>
          <p className="text-sm text-text-primary">{user?.email ?? "—"}</p>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
            Training preferences
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Goal</span>
              <span className="text-text-primary">
                {profile?.goal ? GOAL_LABELS[profile.goal] ?? profile.goal : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Days / week</span>
              <span className="text-text-primary">
                {profile?.days_per_week ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Equipment</span>
              <span className="text-text-primary">
                {profile?.equipment
                  ? EQUIPMENT_LABELS[profile.equipment] ?? profile.equipment
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Weight unit toggle */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
            Weight unit
          </p>
          <div className="flex rounded-lg overflow-hidden border border-border-default">
            <form action={updateWeightUnitAction} className="flex-1">
              <input type="hidden" name="unit" value="kg" />
              <button
                type="submit"
                className={`w-full py-2 text-sm font-medium transition-colors ${
                  weightUnit === "kg"
                    ? "bg-text-primary text-surface"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                kg
              </button>
            </form>
            <div className="w-px bg-border-default" />
            <form action={updateWeightUnitAction} className="flex-1">
              <input type="hidden" name="unit" value="lbs" />
              <button
                type="submit"
                className={`w-full py-2 text-sm font-medium transition-colors ${
                  weightUnit === "lbs"
                    ? "bg-text-primary text-surface"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                lbs
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {/* Strength assessment */}
        <Link
          href="/assessment"
          className="block rounded-xl border border-border-default bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest mb-1">
                Strength Assessment
              </p>
              {(profile?.strength_assessment as StrengthAssessment | null)?.assessedAt ? (
                <p className="text-sm text-text-primary">
                  View your starting weights guide →
                </p>
              ) : (
                <p className="text-sm text-text-primary">
                  Get AI-estimated starting weights →
                </p>
              )}
              <p className="text-xs text-text-muted mt-0.5">
                Upload a photo · rough guide only
              </p>
            </div>
          </div>
        </Link>

        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">
            Install app
          </p>
          <p className="text-sm text-text-secondary">
            On iPhone: tap the share icon in Safari, then{" "}
            <span className="text-text-primary">Add to Home Screen</span>.
          </p>
        </div>

        <DangerZone />

        <SignOutButton />
      </div>

      <BottomNav />
    </main>
  );
}
