import OpenAI from "openai";
import type { UserPreferences, ProgramBlueprint } from "@/lib/types";

const client = new OpenAI();

// ---------------------------------------------------------------------------
// Equipment descriptions
// ---------------------------------------------------------------------------

const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  full_gym: `Full gym (UK Pure Gym style) — use the full range of available kit:
Free weights: barbells (flat bench, incline bench, squat rack, deadlift platform), full dumbbell rack (2.5–50 kg+), EZ curl bar.
Cable machines: cable crossover station, lat pulldown (wide / close / neutral grip), seated cable row, cable fly, face pulls, tricep pushdown, cable curl, cable crunch.
Resistance machines: chest press machine, pec deck / fly machine, overhead press machine, lateral raise machine, rear delt fly machine, preacher curl machine, leg press, hack squat machine, leg extension, seated leg curl, lying leg curl, hip thrust machine, hip adductor / abductor, seated calf raise, standing calf raise, smith machine, assisted pull-up & dip machine.
Functional area: pull-up bars, dip bars, resistance bands.
Use a wide variety — not just dumbbells and barbells.`,

  dumbbells_only: `Dumbbells only (home or hotel gym). Every exercise must be achievable with a pair of dumbbells and a bench (optional).`,

  bodyweight: `Bodyweight only — no equipment. Every exercise uses only the user's own body. Use floor, walls, and a chair where helpful.`,
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Forma's AI fitness coach. Generate a complete 12-week superset-based training program as a single JSON object.

Rules:
- Return ONLY valid JSON matching the schema below — no markdown, no commentary.
- The program has exactly 3 blocks of 4 weeks each:
    Block 1 "Foundation"      — weeks 1–4,  moderate loads, form focus, 60 s rest between supersets
    Block 2 "Intensification" — weeks 5–8,  heavier loads, higher volume, swap ~30% of exercises, 75 s rest
    Block 3 "Peak"            — weeks 9–12, maximum intensity, another ~20% exercise swap, 90 s rest
- Each block has exactly {DAYS_PER_WEEK} day templates (the same templates repeat each week of that block).
- Every workout uses supersets: paired exercises (A and B) performed back-to-back with no rest between them.
- Each day has 4–5 supersets.
- timerSeconds: recommended work duration per exercise in seconds (30–60 s).
- restSeconds: rest between supersets (match the block guideline above).
- detail: sets × reps target, e.g. "4 × 8–10 reps" or "3 × 12 reps".
- prev: always the empty string "" — filled in at runtime with real history.
- progression: one concise sentence describing a harder variation.
- regression: one concise sentence describing an easier variation.
- form_cues: exactly 3 short tips (each under 10 words): setup, execution, common mistake to avoid.
- Tailor every exercise to the user's goal and equipment.
- Across blocks, rotate exercises to target the same muscle groups in fresh ways (e.g. switch from barbell bench to incline dumbbell press between blocks).
- Day labels should clearly describe the session focus, e.g. "Push A", "Pull B", "Lower A", "Full Body A".

JSON schema:
{
  "programName": string,
  "blocks": [
    {
      "blockNumber": 1,
      "theme": string,
      "intensityNote": string,
      "days": [
        {
          "dayLabel": string,
          "supersets": [
            {
              "restSeconds": number,
              "a": { "name": string, "detail": string, "prev": "", "timerSeconds": number, "progression": string, "regression": string, "form_cues": [string, string, string] },
              "b": { "name": string, "detail": string, "prev": "", "timerSeconds": number, "progression": string, "regression": string, "form_cues": [string, string, string] }
            }
          ]
        }
      ]
    },
    { "blockNumber": 2, "theme": string, "intensityNote": string, "days": [ ... ] },
    { "blockNumber": 3, "theme": string, "intensityNote": string, "days": [ ... ] }
  ]
}`;

// ---------------------------------------------------------------------------
// generateProgram — called once on onboarding to build the full 12-week plan
// ---------------------------------------------------------------------------

export async function generateProgram(
  prefs: UserPreferences,
): Promise<ProgramBlueprint> {
  const equipmentDesc = EQUIPMENT_DESCRIPTIONS[prefs.equipment] ?? prefs.equipment;

  const systemPrompt = SYSTEM_PROMPT.replace("{DAYS_PER_WEEK}", String(prefs.daysPerWeek));

  const userMessage = `Goal: ${prefs.goal}
Days per week: ${prefs.daysPerWeek}
Equipment: ${equipmentDesc}

Generate the full 12-week program. Each block must have exactly ${prefs.daysPerWeek} day template(s).`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0].message.content ?? "";
  return JSON.parse(text) as ProgramBlueprint;
}
