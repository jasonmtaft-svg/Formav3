"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupersetLog } from "@/lib/types";

export async function logWorkoutAction(
  workoutId: string,
  logs: SupersetLog[],
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const rows = logs.flatMap((log, supersetIndex) => [
    {
      workout_id: workoutId,
      user_id: user.id,
      superset_index: supersetIndex,
      slot: "a" as const,
      exercise_name: "",
      weight_kg: log.a.weightKg ? parseFloat(log.a.weightKg) : null,
      reps: log.a.reps ? parseInt(log.a.reps, 10) : null,
    },
    {
      workout_id: workoutId,
      user_id: user.id,
      superset_index: supersetIndex,
      slot: "b" as const,
      exercise_name: "",
      weight_kg: log.b.weightKg ? parseFloat(log.b.weightKg) : null,
      reps: log.b.reps ? parseInt(log.b.reps, 10) : null,
    },
  ]);

  const { error } = await supabase.from("logged_sets").insert(rows);

  if (error) throw new Error(error.message);
}
