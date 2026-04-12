"use server";

import { generateWorkout } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import type { UserPreferences, WorkoutPlan } from "@/lib/types";

export interface GenerateWorkoutResult {
  plan: WorkoutPlan;
  workoutId: string;
}

export async function generateWorkoutAction(
  prefs: UserPreferences,
): Promise<GenerateWorkoutResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const plan = await generateWorkout(prefs);

  // Persist the generated plan immediately so the session can reference it
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: plan.workoutName,
      day: plan.day,
      goal: prefs.goal,
      equipment: prefs.equipment,
      payload: plan,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return { plan, workoutId: data.id };
}
