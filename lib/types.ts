// ---------------------------------------------------------------------------
// Workout types — mirrored from the AI response schema
// ---------------------------------------------------------------------------

export interface Exercise {
  name: string;
  detail: string;
  prev: string;
  timerSeconds: number;
}

export interface Superset {
  restSeconds: number;
  a: Exercise;
  b: Exercise;
}

export interface WorkoutPlan {
  workoutName: string;
  day: string;
  supersets: Superset[];
}

// ---------------------------------------------------------------------------
// Onboarding / user preferences
// ---------------------------------------------------------------------------

export type Goal = "build_muscle" | "lose_fat" | "improve_fitness";
export type Equipment = "full_gym" | "dumbbells_only" | "bodyweight";

export interface UserPreferences {
  goal: Goal;
  daysPerWeek: number;
  equipment: Equipment;
}

// ---------------------------------------------------------------------------
// Database row types (matching Supabase schema)
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  goal: Goal | null;
  days_per_week: number | null;
  equipment: Equipment | null;
  created_at: string;
}

export interface WorkoutRecord {
  id: string;
  user_id: string;
  name: string;
  day: string;
  goal: string;
  equipment: string;
  generated_at: string;
  payload: WorkoutPlan;
}

export interface LoggedSet {
  id: string;
  workout_id: string;
  user_id: string;
  exercise_name: string;
  slot: "a" | "b";
  superset_index: number;
  weight_kg: number | null;
  reps: number | null;
  logged_at: string;
}

// ---------------------------------------------------------------------------
// Workout session state (in-memory during active session)
// ---------------------------------------------------------------------------

export interface SetLog {
  weightKg: string;
  reps: string;
}

export interface SupersetLog {
  a: SetLog;
  b: SetLog;
}

export interface WorkoutSession {
  plan: WorkoutPlan;
  workoutId: string;
  currentSupersetIndex: number;
  logs: SupersetLog[];
}
