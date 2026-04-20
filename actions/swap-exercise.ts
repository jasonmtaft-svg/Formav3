"use server";

import { createClient } from "@/lib/supabase/server";
import type { Exercise, ProgramBlueprint } from "@/lib/types";

export interface SwapExerciseInput {
  programId: string;
  blockIndex: number;   // 0-based index into blueprint.blocks[]
  dayIndex: number;     // index into block.days[]
  supersetIndex: number;
  slot: "a" | "b";
  newExercise: Exercise;
}

export async function swapExerciseAction(
  input: SwapExerciseInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Fetch the program — RLS ensures it belongs to this user
  const { data: program, error: fetchError } = await supabase
    .from("programs")
    .select("blueprint")
    .eq("id", input.programId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !program) return { ok: false, error: "Program not found" };

  // Deep-clone the blueprint before mutating
  const blueprint: ProgramBlueprint = JSON.parse(JSON.stringify(program.blueprint));

  const block = blueprint.blocks[input.blockIndex];
  if (!block) return { ok: false, error: "Block not found" };
  const day = block.days[input.dayIndex];
  if (!day) return { ok: false, error: "Day not found" };
  const superset = day.supersets[input.supersetIndex];
  if (!superset) return { ok: false, error: "Superset not found" };

  // Replace the exercise, resetting prev (filled at runtime from logged history)
  superset[input.slot] = { ...input.newExercise, prev: "" };

  const { error: updateError } = await supabase
    .from("programs")
    .update({ blueprint })
    .eq("id", input.programId)
    .eq("user_id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true };
}
