import { NextRequest, NextResponse } from "next/server";
import { generateProgram } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import type { UserPreferences, ProgramBlueprint } from "@/lib/types";

// Allow up to 5 minutes — generation can take 60–120 s for a full 12-week plan
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const prefs: UserPreferences = await req.json();

    // Persist preferences on the profile
    await supabase.from("profiles").upsert({
      id: user.id,
      goal: prefs.goal,
      days_per_week: prefs.daysPerWeek,
      equipment: prefs.equipment,
      experience_level: prefs.experienceLevel,
      age: prefs.age,
      session_duration_minutes: prefs.sessionDurationMinutes,
      activity_level: prefs.activityLevel,
      specific_focus: prefs.specificFocus.length > 0 ? prefs.specificFocus.join(", ") : null,
      injuries: prefs.injuries || null,
    });

    // Retire any existing active program
    await supabase
      .from("programs")
      .update({ status: "completed" })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Generate the full 12-week blueprint
    const blueprint: ProgramBlueprint = await generateProgram(prefs);

    // Persist the program
    const { data: program, error: programError } = await supabase
      .from("programs")
      .insert({
        user_id: user.id,
        goal: prefs.goal,
        equipment: prefs.equipment,
        days_per_week: prefs.daysPerWeek,
        blueprint,
      })
      .select("id")
      .single();

    if (programError) {
      return NextResponse.json({ error: programError.message }, { status: 500 });
    }

    // Link the new program to the user's profile
    await supabase
      .from("profiles")
      .update({ current_program_id: program.id })
      .eq("id", user.id);

    // Create Day 1 so the user lands straight on the workout screen
    const block1 = blueprint.blocks[0];
    const day1 = block1.days[0];

    const plan = {
      workoutName: `${block1.theme} · ${day1.dayLabel}`,
      day: day1.dayLabel,
      supersets: day1.supersets.map((s) => ({
        ...s,
        a: { ...s.a, prev: "First session" },
        b: { ...s.b, prev: "First session" },
      })),
    };

    const { error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: plan.workoutName,
        day: plan.day,
        goal: prefs.goal,
        equipment: prefs.equipment,
        payload: plan,
        program_id: program.id,
        week_number: 1,
        block_number: 1,
        day_index: 0,
      });

    if (workoutError) {
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
