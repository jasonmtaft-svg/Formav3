"use server";

import { createClient } from "@/lib/supabase/server";
import type { WeightUnit, WorkoutPlan } from "@/lib/types";

export interface LatestWorkoutResult {
  plan: WorkoutPlan;
  workoutId: string;
  completed: boolean;
  weightUnit: WeightUnit;
  prMap: Record<string, number>;
}

export async function getLatestWorkoutAction(): Promise<LatestWorkoutResult | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("workouts")
    .select("id, payload")
    .eq("user_id", user.id)
    .gte("generated_at", startOfDay.toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  const [completedResult, profileResult, prResult] = await Promise.all([
    supabase
      .from("logged_sets")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", data.id),
    supabase
      .from("profiles")
      .select("weight_unit")
      .eq("id", user.id)
      .single(),
    supabase
      .from("logged_sets")
      .select("exercise_name, weight_kg")
      .eq("user_id", user.id)
      .not("weight_kg", "is", null),
  ]);

  const weightUnit: WeightUnit = (profileResult.data?.weight_unit as WeightUnit) ?? "kg";

  const prMap: Record<string, number> = {};
  for (const row of prResult.data ?? []) {
    if (
      row.weight_kg !== null &&
      (!(row.exercise_name in prMap) || row.weight_kg > prMap[row.exercise_name])
    ) {
      prMap[row.exercise_name] = row.weight_kg;
    }
  }

  return {
    plan: data.payload as WorkoutPlan,
    workoutId: data.id,
    completed: (completedResult.count ?? 0) > 0,
    weightUnit,
    prMap,
  };
}
