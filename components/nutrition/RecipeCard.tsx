"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/recipes";
import { TAG_LABELS } from "@/lib/recipes";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const totalMins = recipe.prepMins + recipe.cookMins;

  return (
    <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
      {/* Header */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-snug">
              {recipe.name}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-elevated text-text-secondary border border-border-subtle"
                >
                  {TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-text-muted transition-transform mt-0.5 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* Macro row */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "Calories", value: `${recipe.nutrition.calories}` },
            { label: "Protein", value: `${recipe.nutrition.protein}g` },
            { label: "Carbs", value: `${recipe.nutrition.carbs}g` },
            { label: "Fat", value: `${recipe.nutrition.fat}g` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface-elevated p-2 text-center">
              <p className="text-xs font-semibold text-text-primary">{value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Time + servings */}
        <div className="mt-2 flex gap-3 text-[11px] text-text-secondary">
          <span>{totalMins} min total</span>
          <span>·</span>
          <span>{recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}</span>
          {recipe.prepMins === 0 || recipe.cookMins === 0 ? null : (
            <>
              <span>·</span>
              <span>{recipe.prepMins} min prep</span>
            </>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border-subtle">
          <div className="pt-4 grid gap-4">
            {/* Ingredients */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Ingredients
              </p>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Method
              </p>
              <ol className="space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-surface-elevated text-text-secondary text-[11px] font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tip */}
            {recipe.tip && (
              <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">
                  Coach's Tip
                </p>
                <p className="text-sm text-text-primary">{recipe.tip}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
