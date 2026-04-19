"use server";

import { createClient } from "@/lib/supabase/server";
import type { WeightUnit, WorkoutPlan, ProgramBlueprint } from "@/lib/types";

// Which weekday indices (0 = Mon … 6 = Sun) are training days
const TRAINING_PATTERNS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

export interface LatestWorkoutResult {
  plan: WorkoutPlan;
  workoutId: string;
  completed: boolean;
  weightUnit: WeightUnit;
  prMap: Record<string, number>;
  weekNumber: number;
  blockNumber: number;
}

export async function getLatestWorkoutAction(): Promise<LatestWorkoutResult | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Load profile — we need weight_unit, current_program_id, days_per_week
  const { data: profile } = await supabase
    .from("profiles")
    .select("weight_unit, current_program_id, days_per_week")
    .eq("id", user.id)
    .single();

  const weightUnit: WeightUnit = (profile?.weight_unit as WeightUnit) ?? "kg";
  const programId: string | null = profile?.current_program_id ?? null;
  const daysPerWeek: number = profile?.days_per_week ?? 3;

  // Is today a scheduled training day?
  const dow = new Date().getDay(); // 0 = Sun
  const mondayBased = dow === 0 ? 6 : dow - 1; // 0 = Mon, 6 = Sun
  const trainingDays = TRAINING_PATTERNS[daysPerWeek] ?? TRAINING_PATTERNS[3];
  const isTodayTraining = trainingDays.includes(mondayBased);

  // Check if a workout already exists for today
  const { data: todayWorkout } = await supabase
    .from("workouts")
    .select("id, payload, week_number, block_number")
    .eq("user_id", user.id)
    .gte("generated_at", startOfDay.toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let workoutId: string;
  let plan: WorkoutPlan;
  let weekNumber = 1;
  let blockNumber = 1;

  if (todayWorkout) {
    // Re-use what's already there
    workoutId = todayWorkout.id;
    plan = todayWorkout.payload as WorkoutPlan;
    weekNumber = todayWorkout.week_number ?? 1;
    blockNumber = todayWorkout.block_number ?? 1;
  } else if (isTodayTraining && programId) {
    // Derive the next day from the program blueprint
    const { data: program } = await supabase
      .from("programs")
      .select("blueprint, goal, equipment, days_per_week")
      .eq("id", programId)
      .single();

    if (!program) return null;

    const blueprint = program.blueprint as ProgramBlueprint;
    const progDaysPerWeek: number = program.days_per_week;

    // Position in the program = number of workout rows already linked to it
    const { count: sessionCount } = await supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("program_id", programId);

    const position = sessionCount ?? 0;
    const week = Math.floor(position / progDaysPerWeek) + 1;

    // Program is 12 weeks; after that, treat as rest / program complete
    if (week > 12) return null;

    const block = Math.min(Math.ceil(week / 4), 3) as 1 | 2 | 3;
    const dayIdx = position % progDaysPerWeek;

    weekNumber = week;
    blockNumber = block;

    const blockData = blueprint.blocks[block - 1];
    const dayData = blockData.days[dayIdx % blockData.days.length];

    // Fill prev from the user's logged history
    const exerciseNames = dayData.supersets.flatMap((s) => [s.a.name, s.b.name]);

    const { data: prevSets } = await supabase
      .from("logged_sets")
      .select("exercise_name, weight_kg, reps")
      .eq("user_id", user.id)
      .in("exercise_name", exerciseNames)
      .order("logged_at", { ascending: false });

    const latestByExercise = new Map<string, { weight_kg: number | null; reps: number | null }>();
    for (const row of prevSets ?? []) {
      if (!latestByExercise.has(row.exercise_name)) {
        latestByExercise.set(row.exercise_name, { weight_kg: row.weight_kg, reps: row.reps });
      }
    }

    plan = {
      workoutName: `${blockData.theme} · ${dayData.dayLabel}`,
      day: dayData.dayLabel,
      supersets: dayData.supersets.map((s) => {
        const prevA = latestByExercise.get(s.a.name);
        const prevB = latestByExercise.get(s.b.name);
        return {
          ...s,
          a: { ...s.a, prev: formatPrev(prevA) },
          b: { ...s.b, prev: formatPrev(prevB) },
        };
      }),
    };

    const { data: newWorkout, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: plan.workoutName,
        day: plan.day,
        goal: program.goal,
        equipment: program.equipment,
        payload: plan,
        program_id: programId,
        week_number: weekNumber,
        block_number: blockNumber,
        day_index: dayIdx,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    workoutId = newWorkout.id;
  } else {
    // Rest day or no program set up yet
    return null;
  }

  // PR map and completion status
  const [completedResult, prResult] = await Promise.all([
    supabase
      .from("logged_sets")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", workoutId),
    supabase
      .from("logged_sets")
      .select("exercise_name, weight_kg")
      .eq("user_id", user.id)
      .not("weight_kg", "is", null),
  ]);

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
    plan,
    workoutId,
    completed: (completedResult.count ?? 0) > 0,
    weightUnit,
    prMap,
    weekNumber,
    blockNumber,
  };
}

function formatPrev(
  entry: { weight_kg: number | null; reps: number | null } | undefined,
): string {
  if (!entry) return "First session";
  const parts: string[] = [];
  if (entry.weight_kg) parts.push(`${entry.weight_kg} kg`);
  if (entry.reps) parts.push(`${entry.reps} reps`);
  return parts.length > 0 ? parts.join(" × ") : "First session";
}
