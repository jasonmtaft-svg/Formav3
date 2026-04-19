"use client";

import { useState } from "react";
import { recipes, CATEGORY_LABELS } from "@/lib/recipes";
import type { RecipeCategory } from "@/lib/recipes";
import { RecipeCard } from "@/components/nutrition/RecipeCard";
import { MealPlanChat } from "@/components/nutrition/MealPlanChat";
import { BottomNav } from "@/components/ui/BottomNav";

// ---------------------------------------------------------------------------
// Premium gate — shown to non-premium users
// ---------------------------------------------------------------------------

function PremiumGate() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Lock icon */}
      <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-border-default flex items-center justify-center mb-6">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-secondary"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-text-primary mb-2">
        Premium Feature
      </h1>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-8">
        The Nutrition tab — including the AI meal planner and full recipe pack — is available to Forma Premium members.
      </p>

      {/* Feature list */}
      <div className="w-full max-w-xs rounded-xl border border-border-default bg-surface p-5 mb-8 text-left space-y-3">
        {[
          "AI-powered personalised meal plans",
          "52 high-protein recipes from the JT Fitness Academy",
          "Ingredient preference matching",
          "Macro breakdowns for every recipe",
          "Unlimited chat with your nutrition coach",
        ].map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5 text-text-primary"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-sm text-text-primary">{feature}</p>
          </div>
        ))}
      </div>

      <button className="w-full max-w-xs h-12 rounded-xl bg-text-primary text-bg font-semibold text-sm">
        Upgrade to Premium — Coming Soon
      </button>

      <p className="mt-3 text-[11px] text-text-disabled">
        Waitlist launching soon · No payment required today
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nutrition content — shown to premium users
// ---------------------------------------------------------------------------

const CATEGORIES: RecipeCategory[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "smoothie",
];

type Tab = "chat" | "recipes";

function NutritionContent() {
  const [tab, setTab] = useState<Tab>("chat");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory>("breakfast");

  const categoryRecipes = recipes.filter((r) => r.category === activeCategory);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-border-default bg-bg sticky top-0 z-10">
        {(["chat", "recipes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "text-text-primary border-b-2 border-text-primary"
                : "text-text-disabled"
            }`}
          >
            {t === "chat" ? "Meal Planner" : "Recipes"}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <MealPlanChat />
        </div>
      )}

      {tab === "recipes" && (
        <div className="flex-1 overflow-y-auto">
          {/* Category filter */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar sticky top-0 bg-bg border-b border-border-subtle z-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-text-primary text-bg"
                    : "bg-surface text-text-secondary border border-border-default"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Recipe count */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs text-text-muted">
              {categoryRecipes.length} recipe{categoryRecipes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Recipe cards */}
          <div className="px-4 pb-32 space-y-3 pt-2">
            {categoryRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — checks premium status
// ---------------------------------------------------------------------------

// TEMPORARY: set to true to preview the premium content during development.
// Once the is_premium column is wired up to the database, this will be replaced
// with a real server-side check.
const FORCE_PREMIUM_PREVIEW = true;

export default function NutritionPage() {
  // isPremium will eventually come from the user's profile (is_premium column).
  // For now, free users see the gate. Set FORCE_PREMIUM_PREVIEW above to true
  // to test the full UI during development.
  const isPremium = FORCE_PREMIUM_PREVIEW;

  return (
    <>
      <main className="flex flex-col h-screen pb-16">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 border-b border-border-subtle">
          <h1 className="text-lg font-bold text-text-primary">Nutrition</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            AI meal planning · JTFA recipe pack
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          {isPremium ? <NutritionContent /> : <PremiumGate />}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
