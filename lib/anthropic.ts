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
- Every day template MUST have exactly {SUPERSET_COUNT} supersets. This is a hard requirement — never fewer, never more.
- timerSeconds: recommended work duration per exercise in seconds (30–60 s).
- restSeconds: rest between supersets (match the block guideline above).
- detail: sets × reps target, e.g. "4 × 8–10 reps" or "3 × 12 reps".
- prev: always the empty string "" — filled in at runtime with real history.
- progression: one concise sentence describing a harder variation.
- regression: one concise sentence describing an easier variation.
- form_cues: exactly 3 short tips (each under 10 words): setup, execution, common mistake to avoid.
- Tailor every exercise to the user's goal, equipment, experience level, and specific focus areas:
    beginner: machines and simple free-weight movements only. No barbell Olympic lifts, no walking lunges, no single-leg deadlifts, no complex coordination movements. Regressions must be truly accessible. Lower relative loads, higher reps (12–15). Prioritise form over load.
    intermediate: mix of machines and free weights. Standard compound movements (squats, deadlifts, bench press, rows) are fine. Moderate loads (8–12 reps).
    advanced: full exercise library including complex compounds, unilateral movements, and higher-skill variations. Lower reps (5–10), heavier loads.
- Specific focus areas: if the user has listed focus areas (e.g. "Bigger arms", "Stronger legs"), prioritise those muscle groups with extra volume and exercise variety across blocks. They should appear in most sessions where muscle group split allows.
- Injuries/limitations: strictly avoid exercises that stress the listed areas. Substitute with movements that train the same muscle group through a different angle or with less joint stress.
- Activity level guidance:
    sedentary: start conservatively, prioritise movement quality, lower overall volume in Block 1.
    lightly_active: standard progression, normal volume.
    active: can handle slightly higher starting volume, faster progression between blocks.
- Age guidance:
    Under 30: standard recovery assumptions.
    30–45: slightly longer rest periods acceptable, prioritise joint-friendly exercise selection.
    46+: favour machines and cables over heavy free-weight compounds, longer rest, emphasise mobility in form cues.
- Across blocks, rotate exercises to target the same muscle groups in fresh ways (e.g. switch from barbell bench to incline dumbbell press between blocks).
- Day structure is determined strictly by days per week — do not deviate:
    1, 2, or 3 days/week → ALL sessions are Full Body (e.g. "Full Body A", "Full Body B", "Full Body C")
    4 days/week → Upper A, Lower A, Upper B, Lower B
    5 days/week → Push A, Pull A, Legs, Upper, Lower
    6 days/week → Push A, Pull A, Legs A, Push B, Pull B, Legs B
- Day labels must match the structure above exactly.
- This is a bodybuilding program. Do NOT include any powerlifting or Olympic weightlifting movements. Banned exercises include: power cleans, hang cleans, cleans, clean and press, snatch, hang snatch, push press (behind neck), good mornings (as primary lift). Focus exclusively on bodybuilding movements that isolate and develop muscle hypertrophy.

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

const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: "sedentary (desk job, mostly sitting)",
  lightly_active: "lightly active (some walking, light activity outside gym)",
  active: "physically active (active job, sport, or daily exercise outside gym)",
};

const GOAL_LABELS: Record<string, string> = {
  build_muscle: "build muscle",
  lose_fat: "lose fat",
  improve_fitness: "improve overall fitness",
};

export async function generateProgram(
  prefs: UserPreferences,
): Promise<ProgramBlueprint> {
  const equipmentDesc = EQUIPMENT_DESCRIPTIONS[prefs.equipment] ?? prefs.equipment;

  // Superset count driven by session duration
  const supersetCount = prefs.sessionDurationMinutes === 45 ? 3
    : prefs.sessionDurationMinutes === 90 ? 5
    : 4;

  const systemPrompt = SYSTEM_PROMPT
    .replace("{DAYS_PER_WEEK}", String(prefs.daysPerWeek))
    .replace("{SUPERSET_COUNT}", String(supersetCount));

  const focusNote = prefs.specificFocus.length > 0
    ? prefs.specificFocus.join(", ")
    : "No specific preference — general balanced program";

  const injuriesNote = prefs.injuries?.trim()
    ? prefs.injuries.trim()
    : "None";

  const activityDesc = ACTIVITY_LEVEL_LABELS[prefs.activityLevel] ?? prefs.activityLevel;
  const goalDesc = GOAL_LABELS[prefs.goal] ?? prefs.goal;

  const userMessage = `Goal: ${goalDesc}
Specific focus areas: ${focusNote}
Experience level: ${prefs.experienceLevel}
Age: ${prefs.age}
Activity level outside gym: ${activityDesc}
Days per week: ${prefs.daysPerWeek}
Session duration: ${prefs.sessionDurationMinutes} minutes (${supersetCount} supersets per session)
Equipment: ${equipmentDesc}
Injuries / areas to avoid: ${injuriesNote}

Generate the full 12-week program. Each block must have exactly ${prefs.daysPerWeek} day template(s). Every single day must have exactly ${supersetCount} supersets — no exceptions.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
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
    const blueprint = JSON.parse(text) as ProgramBlueprint;

    // Reject and retry if any day has the wrong superset count
    const tooFew = blueprint.blocks.some((block) =>
      block.days.some((day) => day.supersets.length < supersetCount),
    );
    if (!tooFew) return blueprint;

    if (attempt === 3) throw new Error(`Could not generate a program with ${supersetCount} supersets per day after 3 attempts.`);
  }

  throw new Error("Unreachable");
}
