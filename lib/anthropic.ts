import Anthropic from "@anthropic-ai/sdk";
import type { UserPreferences, WorkoutPlan } from "@/lib/types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Forma's AI fitness coach. Generate a single superset-based workout session in strict JSON.

Rules:
- Return ONLY valid JSON matching the schema below — no markdown, no commentary.
- Every workout uses supersets: paired exercises (A and B) performed back-to-back.
- timerSeconds is the recommended work duration per exercise (30–60 s).
- restSeconds is the rest between supersets (60–120 s).
- prev is always "First session" — the caller will replace it with real history.
- Tailor exercises to the user's goal and available equipment.

JSON schema:
{
  "workoutName": string,
  "day": string,
  "supersets": [
    {
      "restSeconds": number,
      "a": { "name": string, "detail": string, "prev": string, "timerSeconds": number },
      "b": { "name": string, "detail": string, "prev": string, "timerSeconds": number }
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

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Prompt caching — saves ~80% token cost on repeated calls
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return JSON.parse(text) as WorkoutPlan;
}
