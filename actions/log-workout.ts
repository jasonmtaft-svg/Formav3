"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupersetLog, WeightUnit, WorkoutPlan } from "@/lib/types";

const LBS_TO_KG = 1 / 2.20462;

function toKg(value: string, unit: WeightUnit): number | null {
  const n = parseFloat(value);
  if (!value || isNaN(n)) return null;
  return unit === "lbs" ? n * LBS_TO_KG : n;
}

export async function logWorkoutAction(
  workoutId: string,
  logs: SupersetLog[],
  weightUnit: WeightUnit = "kg",
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Fetch the workout payload so we can record real exercise names
  const { data: workout } = await supabase
    .from("workouts")
    .select("payload")
    .eq("id", workoutId)
    .single();

  const plan = workout?.payload as WorkoutPlan | undefined;

  const rows = logs.flatMap((log, supersetIndex) => {
    const superset = plan?.supersets[supersetIndex];
    return [
      {
        workout_id: workoutId,
        user_id: user.id,
        superset_index: supersetIndex,
        slot: "a" as const,
        exercise_name: superset?.a.name ?? "",
        weight_kg: toKg(log.a.weightKg, weightUnit),
        reps: log.a.reps ? parseInt(log.a.reps, 10) : null,
        feedback: log.feedback ?? null,
      },
      {
        workout_id: workoutId,
        user_id: user.id,
        superset_index: supersetIndex,
        slot: "b" as const,
        exercise_name: superset?.b.name ?? "",
        weight_kg: toKg(log.b.weightKg, weightUnit),
        reps: log.b.reps ? parseInt(log.b.reps, 10) : null,
        feedback: log.feedback ?? null,
      },
    ];
  });

  const { error } = await supabase.from("logged_sets").insert(rows);

  if (error) throw new Error(error.message);
}
