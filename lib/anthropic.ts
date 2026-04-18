import OpenAI from "openai";
import type { UserPreferences, WorkoutPlan } from "@/lib/types";

const client = new OpenAI();

const SYSTEM_PROMPT = `You are Forma's AI fitness coach. Generate a single superset-based workout session in strict JSON.

Rules:
- Return ONLY valid JSON matching the schema below — no markdown, no commentary.
- Every workout uses supersets: paired exercises (A and B) performed back-to-back.
- timerSeconds is the recommended work duration per exercise (30–60 s).
- restSeconds is the rest between supersets (60–120 s).
- prev is always "First session" — the caller will replace it with real history.
- Tailor exercises to the user's goal and available equipment.
- progression: a harder variation of the exercise (e.g. add weight, reduce rest, increase range).
- regression: an easier variation (e.g. bodyweight version, reduced range, supported).
- form_cues: exactly 3 short technique tips (each under 10 words) covering setup, execution, and a common mistake to avoid.

JSON schema:
{
  "workoutName": string,
  "day": string,
  "supersets": [
    {
      "restSeconds": number,
      "a": { "name": string, "detail": string, "prev": string, "timerSeconds": number, "progression": string, "regression": string, "form_cues": [string, string, string] },
      "b": { "name": string, "detail": string, "prev": string, "timerSeconds": number, "progression": string, "regression": string, "form_cues": [string, string, string] }
    }
  ]
}`;

export async function generateWorkout(
  prefs: UserPreferences,
): Promise<WorkoutPlan> {
  const userMessage = `Goal: ${prefs.goal}
Days per week: ${prefs.daysPerWeek}
Equipment: ${prefs.equipment}

Generate today's superset workout.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0].message.content ?? "";
  return JSON.parse(text) as WorkoutPlan;
}
