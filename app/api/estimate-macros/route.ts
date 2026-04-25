import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI();

export async function POST(req: Request) {
  const { description } = await req.json();

  if (!description || typeof description !== "string" || description.trim().length < 5) {
    return NextResponse.json({ error: "Please describe what you ate." }, { status: 400 });
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a nutrition expert. The user will describe what they ate today (breakfast, lunch, dinner, snacks).
Estimate the macros for each meal they mention, then provide a daily total.
Respond ONLY with a JSON object in this exact shape:
{
  "meals": [
    {
      "label": "Breakfast",
      "description": "2 scrambled eggs, 2 slices of toast with butter",
      "calories": 420,
      "proteinG": 18,
      "carbsG": 42,
      "fatG": 18
    }
  ],
  "total": {
    "calories": 1850,
    "proteinG": 120,
    "carbsG": 180,
    "fatG": 65
  },
  "note": "Estimates based on typical portion sizes. Actual values may vary."
}
Be realistic with portion sizes. If the user gives rough quantities like "a bowl" or "a handful", use sensible averages.
Always include all four meals if mentioned. If only some meals are mentioned, only include those.`,
      },
      {
        role: "user",
        content: description.trim(),
      },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const data = JSON.parse(raw);

  return NextResponse.json(data);
}
