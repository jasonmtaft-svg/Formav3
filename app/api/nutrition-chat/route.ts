import OpenAI from "openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recipes } from "@/lib/recipes";

const client = new OpenAI();

// ---------------------------------------------------------------------------
// Build a compact recipe reference for the system prompt
// ---------------------------------------------------------------------------

function buildRecipeContext(): string {
  return recipes
    .map(
      (r) =>
        `${r.name} (${r.category}, ${r.nutrition.calories} kcal, ${r.nutrition.protein}g protein, ${r.nutrition.carbs}g carbs, ${r.nutrition.fat}g fat) — key ingredients: ${r.ingredients.slice(0, 4).join(", ")}`,
    )
    .join("\n");
}

const SYSTEM_PROMPT = `You are Forma's nutrition coach. Your job is to create personalised, high-protein meal plans based on the user's food preferences.

You have access to the following recipe library from the JT Fitness Academy High Protein Recipe Pack:

${buildRecipeContext()}

Guidelines:
- Always prioritise recipes from the recipe library when they match the user's preferences.
- Suggest full daily meal plans when asked (breakfast, lunch, dinner, optional snacks).
- Include exact recipe names from the library — users can find the full recipe in the Recipe section.
- If the user mentions ingredients they dislike or dietary restrictions, strictly exclude those recipes.
- Be practical and specific. Include calorie and protein totals for suggested meal plans.
- Keep responses concise and actionable — use bullet points and clear structure.
- If the user asks something unrelated to nutrition, gently redirect them.
- Always be encouraging and supportive about their nutrition goals.`;

// ---------------------------------------------------------------------------
// POST /api/nutrition-chat
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Verify authentication
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

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const messages: { role: "user" | "assistant"; content: string }[] =
    body.messages ?? [];

  if (!messages.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1200,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ],
  });

  const reply = completion.choices[0].message.content ?? "";

  return NextResponse.json({ reply });
}
