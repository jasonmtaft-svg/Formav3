"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function clearHistoryAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // logged_sets cascade-delete when workouts are deleted
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/history");
  revalidatePath("/program");
  revalidatePath("/workout");
}
