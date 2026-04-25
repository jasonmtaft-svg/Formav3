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
  isDeload: boolean;
  goal: string;
  equipment: string;
  experienceLevel: string;
}

const DELOAD_THRESHOLD_DAYS = 10;
const DELOAD_MULTIPLIER = 0.85;

export async function getLatestWorkoutAction(): Promise<LatestWorkoutResult | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Round 1 — profile and today's workout are independent, run in parallel
  const [{ data: profile }, { data: todayWorkout }] = await Promise.all([
    supabase
      .from("profiles")
      .select("weight_unit, current_program_id, days_per_week, experience_level")
      .eq("id", user.id)
      .single(),
    supabase
      .from("workouts")
      .select("id, payload, week_number, block_number, goal, equipment")
      .eq("user_id", user.id)
      .gte("generated_at", startOfDay.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const weightUnit: WeightUnit = (profile?.weight_unit as WeightUnit) ?? "kg";
  const programId: string | null = profile?.current_program_id ?? null;
  const daysPerWeek: number = profile?.days_per_week ?? 3;
  const experienceLevel: string = profile?.experience_level ?? "intermediate";

  // Is today a scheduled training day?
  const dow = new Date().getDay(); // 0 = Sun
  const mondayBased = dow === 0 ? 6 : dow - 1; // 0 = Mon, 6 = Sun
  const trainingDays = TRAINING_PATTERNS[daysPerWeek] ?? TRAINING_PATTERNS[3];
  const isTodayTraining = trainingDays.includes(mondayBased);

  let workoutId: string;
  let plan: WorkoutPlan;
  let weekNumber = 1;
  let blockNumber = 1;
  let isDeload = false;
  let programGoal = "build_muscle";
  let programEquipment = "full_gym";

  if (todayWorkout) {
    // Re-use what's already there
    workoutId = todayWorkout.id;
    plan = todayWorkout.payload as WorkoutPlan;
    weekNumber = todayWorkout.week_number ?? 1;
    blockNumber = todayWorkout.block_number ?? 1;
    programGoal = todayWorkout.goal ?? programGoal;
    programEquipment = todayWorkout.equipment ?? programEquipment;
  } else if (isTodayTraining && programId) {
    // Round 2 — blueprint and session count are independent, run in parallel
    const [{ data: program }, { count: sessionCount }] = await Promise.all([
      supabase
        .from("programs")
        .select("blueprint, goal, equipment, days_per_week")
        .eq("id", programId)
        .single(),
      supabase
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("program_id", programId),
    ]);

    if (!program) return null;

    programGoal = program.goal;
    programEquipment = program.equipment;

    const blueprint = program.blueprint as ProgramBlueprint;
    const progDaysPerWeek: number = program.days_per_week;

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
      .select("exercise_name, weight_kg, reps, logged_at, feedback")
      .eq("user_id", user.id)
      .in("exercise_name", exerciseNames)
      .order("logged_at", { ascending: false });

    // Deload detection — if last session was >10 days ago, reduce weights by 15%
    const mostRecentLoggedAt = prevSets?.[0]?.logged_at ?? null;
    if (mostRecentLoggedAt) {
      const daysSince = (Date.now() - new Date(mostRecentLoggedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > DELOAD_THRESHOLD_DAYS) isDeload = true;
    }

    const latestByExercise = new Map<string, { weight_kg: number | null; reps: number | null; feedback: string | null }>();
    for (const row of prevSets ?? []) {
      if (!latestByExercise.has(row.exercise_name)) {
        latestByExercise.set(row.exercise_name, {
          weight_kg: row.weight_kg,
          reps: row.reps,
          feedback: row.feedback ?? null,
        });
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
          a: { ...s.a, prev: formatPrev(prevA, isDeload) },
          b: { ...s.b, prev: formatPrev(prevB, isDeload) },
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

  // Round 3 — PR map and completion status in parallel
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
    isDeload,
    goal: programGoal,
    equipment: programEquipment,
    experienceLevel,
  };
}

function formatPrev(
  entry: { weight_kg: number | null; reps: number | null; feedback: string | null } | undefined,
  deload: boolean,
): string {
  if (!entry) return "First session";
  let weightKg = entry.weight_kg;
  const parts: string[] = [];
  if (weightKg) {
    if (deload) weightKg = Math.round(weightKg * DELOAD_MULTIPLIER * 4) / 4; // round to nearest 0.25
    parts.push(`${weightKg} kg`);
  }
  if (entry.reps) parts.push(`${entry.reps} reps`);
  const base = parts.length > 0 ? parts.join(" × ") : "First session";
  if (entry.feedback === "easy") return `${base} · push harder today`;
  if (entry.feedback === "hard") return `${base} · go lighter today`;
  return base;
}
