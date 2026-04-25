import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProgramBlueprint, ProgramRecord } from "@/lib/types";

const BLOCK_WEEKS = ["Weeks 1–4", "Weeks 5–8", "Weeks 9–12"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGoal(goal: string): string {
  return (
    { build_muscle: "build muscle", lose_fat: "lose fat", improve_fitness: "improve fitness" }[goal] ??
    goal.replace(/_/g, " ")
  );
}

function formatEquipment(equipment: string): string {
  return (
    { full_gym: "a full gym", dumbbells_only: "dumbbells only", bodyweight: "bodyweight only" }[equipment] ??
    equipment.replace(/_/g, " ")
  );
}

function formatExperience(level: string): string {
  return (
    { beginner: "new to the gym", intermediate: "at an intermediate level", advanced: "at an advanced level" }[level] ??
    level.replace(/_/g, " ")
  );
}

function formatDuration(mins: number | null | undefined): string {
  if (!mins) return "your sessions";
  return `${mins}-minute sessions`;
}

function getDayDescription(dayLabel: string): string {
  const label = dayLabel.toLowerCase().trim();

  if (label === "full body a")
    return "Every major muscle group in one session — compound movements form the foundation here";
  if (label === "full body b")
    return "A second full-body rotation — varied exercises to hit the same muscles from fresh angles";
  if (label === "full body c")
    return "Your third full-body variation — different movement patterns keep adaptation in check";
  if (label.startsWith("full body"))
    return "Trains every major muscle group in a single session";

  if (label === "upper a")
    return "Chest, back, shoulders and arms — compound pressing and pulling patterns";
  if (label === "upper b")
    return "Second upper body day — varied angles to complement Upper A";
  if (label === "upper")
    return "Chest, back, shoulders and arms in one session";

  if (label === "lower a")
    return "Quad-dominant lower body — squat patterns and knee-drive movements";
  if (label === "lower b")
    return "Hip-dominant lower body — deadlifts, hip hinges and glute-focused work";
  if (label === "lower")
    return "Full lower body — quads, hamstrings and glutes";

  if (label === "push a")
    return "Chest, shoulders and triceps — all the muscles involved in pressing movements";
  if (label === "push b")
    return "Second push day — varied angles for chest, shoulders and triceps";
  if (label === "push")
    return "Chest, shoulders and triceps — all your pushing muscles";

  if (label === "pull a")
    return "Back and biceps — rowing, pulling and vertical pull patterns";
  if (label === "pull b")
    return "Second pull day — varied back and bicep angles to complement Pull A";
  if (label === "pull")
    return "Back and biceps — all your pulling muscles";

  if (label === "legs a")
    return "Quad-focused lower session — squats, lunges and knee-dominant work";
  if (label === "legs b")
    return "Hamstring and glute-focused session — deadlifts and hip-hinge patterns";
  if (label === "legs")
    return "Full lower body — quads, hamstrings, glutes and calves";

  return "";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgramOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "current_program_id, experience_level, specific_focus, session_duration_minutes, activity_level, injuries"
    )
    .eq("id", user.id)
    .single();

  if (!profile?.current_program_id) redirect("/onboarding");

  const { data: program } = await supabase
    .from("programs")
    .select("blueprint, goal, equipment, days_per_week")
    .eq("id", profile.current_program_id)
    .single<ProgramRecord>();

  if (!program) redirect("/onboarding");

  const blueprint = program.blueprint as ProgramBlueprint;

  // Build personalisation copy
  const focusAreas: string[] =
    typeof profile.specific_focus === "string" && profile.specific_focus.trim()
      ? profile.specific_focus.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
  const hasInjuries =
    typeof profile.injuries === "string" &&
    profile.injuries.trim() &&
    profile.injuries.toLowerCase() !== "none";

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-32">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
          Your 12-week program
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">
          {blueprint.programName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {program.days_per_week} days/week · {formatEquipment(program.equipment)} · {formatGoal(program.goal)}
        </p>
      </div>

      {/* Personalisation card */}
      <div className="rounded-xl border border-border-default bg-surface px-4 py-4 mb-8 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
          Why this program
        </p>
        <p className="text-sm text-text-primary leading-relaxed">
          Based on your assessment — {profile.experience_level ? formatExperience(profile.experience_level) + ", " : ""}training{" "}
          {program.days_per_week} days a week using {formatEquipment(program.equipment)} — your goal is to{" "}
          <span className="font-medium">{formatGoal(program.goal)}</span>.{" "}
          {formatDuration(profile.session_duration_minutes)} have been set as your target, so each session is
          built around that window.
        </p>
        {focusAreas.length > 0 && (
          <p className="text-sm text-text-secondary leading-relaxed">
            You flagged{" "}
            {focusAreas.length === 1
              ? focusAreas[0].toLowerCase()
              : focusAreas.slice(0, -1).map(f => f.toLowerCase()).join(", ") +
                " and " +
                focusAreas[focusAreas.length - 1].toLowerCase()}{" "}
            as your priority — these areas have been emphasised in exercise selection throughout
            the program.
          </p>
        )}
        {hasInjuries && (
          <p className="text-sm text-text-secondary leading-relaxed">
            Your noted limitations ({profile.injuries.toLowerCase()}) have been factored in — exercises
            have been selected to work around these where possible.
          </p>
        )}
      </div>

      {/* Blocks */}
      <div className="space-y-8">
        {blueprint.blocks.map((block, blockIdx) => (
          <div key={block.blockNumber}>

            {/* Block header */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-text-primary">
                  Block {block.blockNumber} — {block.theme}
                </h2>
                <span className="text-xs text-text-muted">{BLOCK_WEEKS[blockIdx]}</span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{block.intensityNote}</p>
            </div>

            {/* Day templates */}
            <div className="space-y-3">
              {block.days.map((day, dayIdx) => {
                const dayDesc = getDayDescription(day.dayLabel);
                return (
                  <div
                    key={dayIdx}
                    className="rounded-xl border border-border-default bg-surface overflow-hidden"
                  >
                    {/* Day label */}
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <p className="text-sm font-semibold text-text-primary">{day.dayLabel}</p>
                      {dayDesc && (
                        <p className="text-xs text-text-secondary mt-0.5">{dayDesc}</p>
                      )}
                      <p className="text-[11px] text-text-muted mt-1">
                        {day.supersets.length} supersets
                      </p>
                    </div>

                    {/* Supersets */}
                    <div className="divide-y divide-border-subtle">
                      {day.supersets.map((superset, ssIdx) => (
                        <div key={ssIdx} className="px-4 py-3">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-text-muted mb-2">
                            Superset {ssIdx + 1}
                          </p>
                          <div className="space-y-1.5">
                            {(["a", "b"] as const).map((slot) => {
                              const ex = superset[slot];
                              return (
                                <div key={slot} className="flex items-start gap-2">
                                  <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted mt-0.5 w-3 shrink-0">
                                    {slot.toUpperCase()}
                                  </span>
                                  <div>
                                    <p className="text-sm text-text-primary">{ex.name}</p>
                                    <p className="text-xs text-text-secondary">{ex.detail}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
        <Link
          href="/program"
          className="block w-full rounded-2xl bg-text-primary text-bg text-center py-4 text-sm font-semibold"
        >
          Go to my program
        </Link>
      </div>
    </main>
  );
}
