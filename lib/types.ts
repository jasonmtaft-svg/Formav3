// ---------------------------------------------------------------------------
// Workout types — mirrored from the AI response schema
// ---------------------------------------------------------------------------

export interface Exercise {
  name: string;
  detail: string;
  prev: string;
  timerSeconds: number;
  progression?: string;   // harder alternative
  regression?: string;    // easier alternative
  form_cues?: string[];   // 3 technique tips
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
// 12-week program blueprint — generated once on onboarding
// ---------------------------------------------------------------------------

export interface ProgramDay {
  dayLabel: string;      // e.g. "Push A", "Pull A", "Legs A"
  supersets: Superset[]; // full superset detail — prev is filled at load time
}

export interface ProgramBlock {
  blockNumber: 1 | 2 | 3;
  theme: string;         // "Foundation" | "Intensification" | "Peak"
  intensityNote: string; // short coaching note shown to the user
  days: ProgramDay[];    // exactly daysPerWeek entries
}

export interface ProgramBlueprint {
  programName: string;
  blocks: [ProgramBlock, ProgramBlock, ProgramBlock];
}

// ---------------------------------------------------------------------------
// Onboarding / user preferences
// ---------------------------------------------------------------------------

export type Goal = "build_muscle" | "lose_fat" | "improve_fitness";
export type Equipment = "full_gym" | "dumbbells_only" | "bodyweight";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type WeightUnit = "kg" | "lbs";

export interface UserPreferences {
  goal: Goal;
  daysPerWeek: number;
  equipment: Equipment;
  experienceLevel: ExperienceLevel;
}

// ---------------------------------------------------------------------------
// Database row types (matching Supabase schema)
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  goal: Goal | null;
  days_per_week: number | null;
  equipment: Equipment | null;
  experience_level: ExperienceLevel | null;
  weight_unit: WeightUnit;
  current_program_id: string | null;
  strength_assessment: StrengthAssessment | null;
  created_at: string;
}

export interface ProgramRecord {
  id: string;
  user_id: string;
  goal: string;
  equipment: string;
  days_per_week: number;
  blueprint: ProgramBlueprint;
  status: "active" | "completed";
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
  program_id?: string | null;
  week_number?: number | null;
  block_number?: number | null;
  day_index?: number | null;
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
// Strength assessment — generated once from a body photo + body weight
// ---------------------------------------------------------------------------

export interface StartingWeightSuggestion {
  exercise: string;
  suggestedWeightKg: number;
  rationale: string;
}

export interface StrengthAssessment {
  assessedAt: string;
  bodyWeightKg: number;
  estimatedBodyFatPct: number | null;
  startingWeights: StartingWeightSuggestion[];
  generalNotes: string;
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
