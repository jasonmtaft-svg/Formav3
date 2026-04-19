"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";

// ── Mifflin-St Jeor BMR ──────────────────────────────────────────────────────
// Male:   10w + 6.25h - 5a + 5
// Female: 10w + 6.25h - 5a - 161
// w = kg, h = cm, a = years

const ACTIVITY_MULTIPLIERS = [
  { label: "Sedentary", description: "Little or no exercise", value: 1.2 },
  { label: "Light", description: "Exercise 1–3×/week", value: 1.375 },
  { label: "Moderate", description: "Exercise 4–5×/week", value: 1.55 },
  { label: "Active", description: "Daily or intense 3–4×/week", value: 1.725 },
  { label: "Very Active", description: "Intense exercise 6–7×/week", value: 1.9 },
  { label: "Extra Active", description: "Very intense daily / physical job", value: 2.0 },
];

const GOAL_ADJUSTMENTS = [
  { label: "Lose weight (–1 lb/week)", value: -500 },
  { label: "Lose weight (–0.5 lb/week)", value: -250 },
  { label: "Maintain weight", value: 0 },
  { label: "Gain weight (+0.5 lb/week)", value: 250 },
  { label: "Gain weight (+1 lb/week)", value: 500 },
];

const MACRO_PRESETS = [
  { label: "Balanced", protein: 0.2, fat: 0.3, carbs: 0.5 },
  { label: "Low Fat", protein: 0.25, fat: 0.2, carbs: 0.55 },
  { label: "Low Carb", protein: 0.25, fat: 0.45, carbs: 0.3 },
  { label: "High Protein", protein: 0.25, fat: 0.3, carbs: 0.45 },
];

type Sex = "male" | "female";
type Unit = "metric" | "imperial";

function calcBMR(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export default function MacrosPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [unit, setUnit] = useState<Unit>("imperial");
  const [age, setAge] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityIdx, setActivityIdx] = useState(1);
  const [goalIdx, setGoalIdx] = useState(2);
  const [presetIdx, setPresetIdx] = useState(0);

  // ── Derived ────────────────────────────────────────────────────────────────
  const weightKgNum =
    unit === "imperial" ? parseFloat(weightLbs) / 2.20462 : parseFloat(weightKg);
  const heightCmNum =
    unit === "imperial"
      ? parseFloat(heightFt) * 30.48 + parseFloat(heightIn || "0") * 2.54
      : parseFloat(heightCm);
  const ageNum = parseFloat(age);

  const valid =
    !isNaN(weightKgNum) &&
    !isNaN(heightCmNum) &&
    !isNaN(ageNum) &&
    weightKgNum > 0 &&
    heightCmNum > 0 &&
    ageNum > 0;

  let bmr = 0, tdee = 0, calories = 0;
  let proteinG = 0, carbsG = 0, fatG = 0;

  if (valid) {
    bmr = calcBMR(sex, weightKgNum, heightCmNum, ageNum);
    tdee = bmr * ACTIVITY_MULTIPLIERS[activityIdx].value;
    calories = Math.round(tdee + GOAL_ADJUSTMENTS[goalIdx].value);
    const preset = MACRO_PRESETS[presetIdx];
    proteinG = Math.round((calories * preset.protein) / 4);
    carbsG = Math.round((calories * preset.carbs) / 4);
    fatG = Math.round((calories * preset.fat) / 9);
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 pb-28">
      <div className="flex items-center gap-3 mb-8">
        <Logo />
        <h1 className="text-xl font-semibold">Macros</h1>
      </div>

      <div className="space-y-5">
        {/* Sex */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Sex</p>
          <div className="flex rounded-lg overflow-hidden border border-border-default">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  sex === s ? "bg-text-primary text-surface" : "text-text-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Unit + measurements */}
        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted uppercase tracking-widest">Measurements</p>
            <div className="flex rounded-lg overflow-hidden border border-border-default text-xs">
              {(["imperial", "metric"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1 font-medium capitalize transition-colors ${
                    unit === u ? "bg-text-primary text-surface" : "text-text-secondary"
                  }`}
                >
                  {u === "imperial" ? "lbs / ft" : "kg / cm"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text-secondary">Age</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-28 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
              />
            </div>

            {unit === "imperial" ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-text-secondary shrink-0">Height</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="ft"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      className="w-16 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="in"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      className="w-16 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-secondary">Weight</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="lbs"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    className="w-28 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-secondary">Height</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="cm"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-28 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-text-secondary">Weight</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-28 rounded-lg border border-border-default bg-bg px-3 py-1.5 text-sm text-right text-text-primary placeholder:text-text-disabled focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activity level */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Activity level</p>
          <div className="space-y-1">
            {ACTIVITY_MULTIPLIERS.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivityIdx(i)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  activityIdx === i
                    ? "bg-text-primary/10 border border-text-primary/20"
                    : "border border-transparent"
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${activityIdx === i ? "text-text-primary" : "text-text-secondary"}`}>
                    {a.label}
                  </p>
                  <p className="text-xs text-text-muted">{a.description}</p>
                </div>
                {activityIdx === i && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary shrink-0">
                    <path d="M3 8l4 4 6-6" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Goal</p>
          <div className="space-y-1">
            {GOAL_ADJUSTMENTS.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGoalIdx(i)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  goalIdx === i
                    ? "bg-text-primary/10 border border-text-primary/20"
                    : "border border-transparent"
                }`}
              >
                <p className={`text-sm ${goalIdx === i ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                  {g.label}
                </p>
                {goalIdx === i && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary shrink-0">
                    <path d="M3 8l4 4 6-6" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Macro preset */}
        <div className="rounded-xl border border-border-default bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Macro split</p>
          <div className="grid grid-cols-2 gap-2">
            {MACRO_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPresetIdx(i)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  presetIdx === i
                    ? "border-text-primary/30 bg-text-primary/10 text-text-primary"
                    : "border-border-default text-text-secondary"
                }`}
              >
                <p>{p.label}</p>
                <p className="text-xs font-normal text-text-muted mt-0.5">
                  {Math.round(p.protein * 100)}P / {Math.round(p.carbs * 100)}C / {Math.round(p.fat * 100)}F
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {valid && (
          <div className="rounded-xl border border-border-default bg-surface p-4 space-y-4">
            <p className="text-xs text-text-muted uppercase tracking-widest">Results</p>

            <div className="flex justify-between items-center">
              <p className="text-sm text-text-secondary">Daily calories</p>
              <p className="text-2xl font-bold text-text-primary">{calories.toLocaleString()}</p>
            </div>

            <div className="border-t border-border-subtle pt-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{proteinG}g</p>
                <p className="text-xs text-text-muted mt-0.5">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{carbsG}g</p>
                <p className="text-xs text-text-muted mt-0.5">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">{fatG}g</p>
                <p className="text-xs text-text-muted mt-0.5">Fat</p>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-3 flex justify-between text-xs text-text-muted">
              <span>BMR: {Math.round(bmr)} kcal</span>
              <span>TDEE: {Math.round(tdee)} kcal</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
