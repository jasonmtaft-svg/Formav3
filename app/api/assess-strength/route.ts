import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { StrengthAssessment } from "@/lib/types";

const client = new OpenAI();

const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  full_gym: "full gym (barbells, dumbbells, cables, machines)",
  dumbbells_only: "dumbbells only",
  bodyweight: "bodyweight only — no equipment",
};

const EXERCISE_LISTS: Record<string, string> = {
  full_gym: `barbell bench press, incline dumbbell press, barbell squat, leg press, Romanian deadlift, lat pulldown, seated cable row, overhead dumbbell press, dumbbell lateral raise, barbell curl, cable tricep pushdown`,
  dumbbells_only: `dumbbell bench press, goblet squat, dumbbell Romanian deadlift, dumbbell row, seated dumbbell shoulder press, dumbbell lateral raise, dumbbell curl, dumbbell tricep kickback, dumbbell lunge`,
  bodyweight: `push-ups, bodyweight squats, glute bridges, inverted rows, pike push-ups, reverse lunges, dips (using a chair), pull-ups`,
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse multipart form data
  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const bodyWeightKg = parseFloat((formData.get("bodyWeightKg") as string) ?? "0");
  const heightCm = formData.get("heightCm") ? parseFloat(formData.get("heightCm") as string) : null;
  const goal = (formData.get("goal") as string) ?? "improve_fitness";
  const equipment = (formData.get("equipment") as string) ?? "full_gym";
  const experienceLevel = (formData.get("experienceLevel") as string) ?? "beginner";

  if (!photo || bodyWeightKg <= 0) {
    return NextResponse.json({ error: "Photo and body weight are required" }, { status: 400 });
  }

  // Convert photo to base64 — photo is never stored
  const arrayBuffer = await photo.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = photo.type || "image/jpeg";

  const equipmentDesc = EQUIPMENT_DESCRIPTIONS[equipment] ?? equipment;
  const exerciseList = EXERCISE_LISTS[equipment] ?? EXERCISE_LISTS["full_gym"];
  const isBodyweight = equipment === "bodyweight";

  const systemPrompt = `You are Forma's AI fitness coach. You are conducting a starting strength assessment to help a new gym-goer understand conservative, safe starting weights.

Your role is purely fitness-related. Analyse the user's physique for indicators of muscle development, body composition, and overall build to inform appropriate exercise loads — nothing else.

CRITICAL SAFETY RULES:
- Suggest weights that are MUCH lighter than you think necessary. These are week-1-session-1 weights for someone who may never have lifted before.
- A beginner should be able to complete all reps with PERFECT form and still feel like they had much more left in the tank.
- It is always better to go too light than too heavy. Too heavy leads to injury. Too light leads to good habits.
- For bodyweight exercises, suggest a rep range target instead of a weight.

Return ONLY valid JSON matching this schema exactly:
{
  "estimatedBodyFatPct": number or null,
  "startingWeights": [
    {
      "exercise": string,
      "suggestedWeightKg": number,
      "rationale": string
    }
  ],
  "generalNotes": string
}

For bodyweight exercises, set suggestedWeightKg to 0 and use the rationale field to give rep targets.`;

  const heightNote = heightCm ? `Height: ${heightCm} cm` : "Height: not provided";
  const goalLabels: Record<string, string> = {
    build_muscle: "build muscle",
    lose_fat: "lose fat",
    improve_fitness: "improve overall fitness",
  };
  const goalDesc = goalLabels[goal] ?? goal;

  const userMessage = `Please assess this person's starting weights.

Body weight: ${bodyWeightKg} kg
${heightNote}
Training goal: ${goalDesc}
Equipment available: ${equipmentDesc}
Experience level: ${experienceLevel}

Provide starting weight suggestions for these exercises (all relevant to their equipment): ${exerciseList}

${isBodyweight ? "For bodyweight exercises, set suggestedWeightKg to 0 and give rep targets in the rationale." : "Suggest weights in kg. Be very conservative — these are first-ever session weights."}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
          },
          { type: "text", text: userMessage },
        ],
      },
    ],
  });

  const aiResult = JSON.parse(response.choices[0].message.content ?? "{}");

  const assessment: StrengthAssessment = {
    assessedAt: new Date().toISOString(),
    bodyWeightKg,
    estimatedBodyFatPct: aiResult.estimatedBodyFatPct ?? null,
    startingWeights: aiResult.startingWeights ?? [],
    generalNotes: aiResult.generalNotes ?? "",
  };

  // Save to profile — photo is discarded here, only the result is stored
  await supabase
    .from("profiles")
    .update({ strength_assessment: assessment })
    .eq("id", user.id);

  return NextResponse.json({ assessment });
}
