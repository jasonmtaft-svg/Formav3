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

  // Save preferences to profile
  await supabase.from("profiles").upsert({
    id: user.id,
    goal: prefs.goal,
    days_per_week: prefs.daysPerWeek,
    equipment: prefs.equipment,
  });

  const plan = await generateWorkout(prefs);

  // Look up last logged set for each exercise and fill in real prev values
  const exerciseNames = plan.supersets.flatMap((s) => [s.a.name, s.b.name]);
  const { data: prevSets } = await supabase
    .from("logged_sets")
    .select("exercise_name, weight_kg, reps, logged_at")
    .eq("user_id", user.id)
    .in("exercise_name", exerciseNames)
    .order("logged_at", { ascending: false });

  if (prevSets && prevSets.length > 0) {
    // Keep only the most recent entry per exercise name
    const latestByExercise = new Map<string, { weight_kg: number | null; reps: number | null }>();
    for (const row of prevSets) {
      if (!latestByExercise.has(row.exercise_name)) {
        latestByExercise.set(row.exercise_name, { weight_kg: row.weight_kg, reps: row.reps });
      }
    }

    for (const superset of plan.supersets) {
      for (const slot of ["a", "b"] as const) {
        const last = latestByExercise.get(superset[slot].name);
        if (last) {
          const parts: string[] = [];
          if (last.weight_kg) parts.push(`${last.weight_kg} kg`);
          if (last.reps) parts.push(`${last.reps} reps`);
          if (parts.length > 0) superset[slot].prev = parts.join(" × ");
        }
      }
    }
  }

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
