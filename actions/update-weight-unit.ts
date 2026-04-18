"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWeightUnitAction(formData: FormData): Promise<void> {
  const unit = formData.get("unit");
  if (unit !== "kg" && unit !== "lbs") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ weight_unit: unit })
    .eq("id", user.id);

  revalidatePath("/profile");
}
