import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { DangerZone } from "@/components/ui/DangerZone";
import { updateWeightUnitAction } from "@/actions/update-weight-unit";

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

function computeStreak(loggedAts: string[]): number {
  const uniqueDates = [
    ...new Set(loggedAts.map((d) => d.slice(0, 10))),
  ].sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Start streak from today if trained; otherwise from yesterday (streak still alive)
  let expected = uniqueDates[0] === todayStr ? todayStr : yesterday;
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterday) return 0;

  let streak = 0;
  for (const date of uniqueDates) {
    if (date === expected) {
      streak++;
      const d = new Date(expected + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
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
  const streak = computeStreak(
    (setsResult.data ?? []).map((r) => r.logged_at as string),
  );

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-24">
      <div className="flex items-center gap-3 mb-10">
        <Logo />
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="space-y-4 flex-1">
        {/* Streak */}
        <div className="rounded-xl border border-border-default bg-surface p-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Current streak</p>
          <p className="text-lg font-semibold text-text-primary">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
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
