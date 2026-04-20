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

  const systemPrompt = `You are Forma's AI fitness coach performing a starting strength assessment. Analyse the provided photo carefully — look at muscle size, definition, body composition, and overall build — and use that alongside the body weight to estimate realistic first-session working weights.

Your role is purely fitness-related. Use visible physique indicators to calibrate weights appropriately for this specific person.

CALIBRATION GUIDELINES (full gym, adjust proportionally for other equipment):
These are realistic starting ranges for a first proper training session. Choose where within the range based on what you see in the photo:

Isolation / smaller muscles:
- Dumbbell lateral raise: 4–10 kg (leaner, more muscular → higher end)
- Dumbbell curl: 8–16 kg
- Cable tricep pushdown: 15–25 kg
- Dumbbell fly: 8–14 kg
- Face pulls: 10–20 kg

Compound upper body:
- Barbell bench press: 40–80 kg (add bar weight of 20 kg)
- Incline dumbbell press: 14–24 kg per hand
- Dumbbell shoulder press: 12–22 kg per hand
- Lat pulldown: 30–55 kg
- Seated cable row: 30–55 kg
- Dumbbell row: 16–30 kg per hand

Compound lower body:
- Leg press: 60–140 kg
- Barbell squat: 40–90 kg (add bar)
- Romanian deadlift: 40–80 kg
- Leg extension: 25–55 kg
- Seated leg curl: 25–55 kg
- Goblet squat: 16–28 kg

Calves / accessories:
- Seated calf raise: 20–50 kg
- Dumbbell shrug: 20–40 kg per hand

Scaling rules:
- A visibly lean, muscular individual → upper half of each range
- An average build with some body fat → middle of each range
- A larger/heavier individual with less visible muscle → lower-middle of each range
- Body weight is a strong signal — heavier people generally have greater absolute strength
- For dumbbells-only or bodyweight equipment, scale all weights down accordingly

SAFETY:
- Never go above the upper end of the range for a first session
- The goal is a weight the person can complete with good form and 2–3 reps in reserve
- For bodyweight exercises, set suggestedWeightKg to 0 and give rep targets in the rationale

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
}`;

  const heightNote = heightCm ? `Height: ${heightCm} cm` : "Height: not provided";
  const goalLabels: Record<string, string> = {
    build_muscle: "build muscle",
    lose_fat: "lose fat",
    improve_fitness: "improve overall fitness",
  };
  const goalDesc = goalLabels[goal] ?? goal;

  const userMessage = `Assess this person's realistic first-session starting weights based on their physique.

Body weight: ${bodyWeightKg} kg
${heightNote}
Training goal: ${goalDesc}
Equipment available: ${equipmentDesc}
Experience level: ${experienceLevel}

Look carefully at their muscle development, body composition, and build — use that to position weights within the calibration ranges. Do NOT default to the bottom of ranges unless their physique clearly warrants it.

Provide starting weight suggestions for these exercises: ${exerciseList}

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
