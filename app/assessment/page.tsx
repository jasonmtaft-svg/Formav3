import { createClient } from "@/lib/supabase/server";
import { AssessmentForm } from "@/components/assessment/AssessmentForm";
import { BottomNav } from "@/components/ui/BottomNav";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import type { StrengthAssessment, WeightUnit } from "@/lib/types";

export default async function AssessmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("goal, equipment, experience_level, weight_unit, strength_assessment")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/profile" className="text-text-muted text-sm">
          ← Profile
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Logo />
        <div>
          <h1 className="text-xl font-semibold">Strength Assessment</h1>
          <p className="text-xs text-text-muted mt-0.5">AI-estimated starting weights</p>
        </div>
      </div>

      <AssessmentForm
        weightUnit={(profile?.weight_unit as WeightUnit) ?? "kg"}
        goal={profile?.goal ?? null}
        equipment={profile?.equipment ?? null}
        experienceLevel={profile?.experience_level ?? null}
        existingAssessment={(profile?.strength_assessment as StrengthAssessment) ?? null}
      />

      <BottomNav />
    </main>
  );
}
