"use server";

import { generateProgram } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import type { UserPreferences, WorkoutPlan, ProgramBlueprint } from "@/lib/types";

export interface GenerateProgramResult {
  plan: WorkoutPlan;
  workoutId: string;
}

export async function generateProgramAction(
  prefs: UserPreferences,
): Promise<GenerateProgramResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Persist updated preferences on the profile
  await supabase.from("profiles").upsert({
    id: user.id,
    goal: prefs.goal,
    days_per_week: prefs.daysPerWeek,
    equipment: prefs.equipment,
    experience_level: prefs.experienceLevel,
  });

  // Retire any existing active program
  await supabase
    .from("programs")
    .update({ status: "completed" })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Generate the full 12-week blueprint via OpenAI
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

  if (programError) throw new Error(programError.message);

  // Link the new program to the user's profile
  await supabase
    .from("profiles")
    .update({ current_program_id: program.id })
    .eq("id", user.id);

  // Immediately create Day 1 (Block 1, first day template) so the user
  // lands straight on the workout screen after onboarding
  const block1 = blueprint.blocks[0];
  const day1 = block1.days[0];

  const plan: WorkoutPlan = {
    workoutName: `${block1.theme} · ${day1.dayLabel}`,
    day: day1.dayLabel,
    supersets: day1.supersets.map((s) => ({
      ...s,
      a: { ...s.a, prev: "First session" },
      b: { ...s.b, prev: "First session" },
    })),
  };

  const { data: workout, error: workoutError } = await supabase
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
    })
    .select("id")
    .single();

  if (workoutError) throw new Error(workoutError.message);

  return { plan, workoutId: workout.id };
}
