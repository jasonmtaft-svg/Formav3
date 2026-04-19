import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProgramBlueprint, ProgramRecord } from "@/lib/types";

const BLOCK_THEMES = ["Foundation", "Intensification", "Peak"];
const BLOCK_WEEKS = ["Weeks 1–4", "Weeks 5–8", "Weeks 9–12"];

export default async function ProgramOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_program_id")
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

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-32">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">
          Your 12-week program
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">
          {blueprint.programName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {program.days_per_week} days/week · {program.equipment.replace("_", " ")} · {program.goal.replace("_", " ")}
        </p>
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
              {block.days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className="rounded-xl border border-border-default bg-surface overflow-hidden"
                >
                  {/* Day label */}
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <p className="text-sm font-semibold text-text-primary">{day.dayLabel}</p>
                    <p className="text-xs text-text-muted mt-0.5">
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
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
        <Link
          href="/workout"
          className="block w-full rounded-2xl bg-text-primary text-bg text-center py-4 text-sm font-semibold"
        >
          Start training
        </Link>
      </div>
    </main>
  );
}
