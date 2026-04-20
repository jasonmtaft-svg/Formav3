import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const client = new OpenAI();

const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  full_gym: "full gym (barbells, dumbbells, cables, machines)",
  dumbbells_only: "dumbbells only",
  bodyweight: "bodyweight only",
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

  const body = await request.json();
  const { exerciseName, equipment, goal, experienceLevel, existingNames } = body as {
    exerciseName: string;
    equipment: string;
    goal: string;
    experienceLevel: string;
    existingNames: string[];
  };

  const equipmentDesc = EQUIPMENT_DESCRIPTIONS[equipment] ?? equipment;
  const avoidList = [exerciseName, ...existingNames].join(", ");

  const prompt = `The user wants to replace "${exerciseName}" in their workout.

Context:
- Equipment: ${equipmentDesc}
- Goal: ${goal}
- Experience level: ${experienceLevel}
- Exercises already in this session (do NOT duplicate): ${existingNames.join(", ")}

Provide exactly 3 alternative exercises that:
- Target the same primary muscle group as "${exerciseName}"
- Use the available ${equipmentDesc}
- Are appropriate for ${experienceLevel} level
- Are NOT any of: ${avoidList}
- Are bodybuilding movements only (no Olympic lifts, no power cleans)

Return ONLY valid JSON:
{
  "alternatives": [
    {
      "name": string,
      "detail": string,
      "prev": "",
      "timerSeconds": number,
      "progression": string,
      "regression": string,
      "form_cues": [string, string, string]
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are Forma's AI fitness coach. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
  });

  const data = JSON.parse(response.choices[0].message.content ?? "{}");
  return NextResponse.json(data);
}
