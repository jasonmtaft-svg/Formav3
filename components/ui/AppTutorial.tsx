"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "forma_v2_tutorial_seen";

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="10" y2="18" />
      </svg>
    ),
    title: "Your 12-week plan",
    body:
      "Your program runs across 3 blocks — Foundation, Intensification, and Peak. Each block progressively increases in intensity. You can see the full plan anytime from the overview.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
    title: "Starting a workout",
    body:
      "On a training day, tap 'Train now' on today's session. Your exercises, sets, and rest timers are already set up — just follow along and log your weights as you go.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    title: "Swapping exercises",
    body:
      "Don't have the equipment for an exercise, or just don't like it? Expand any session card and tap 'Swap' — Forma will suggest alternatives that train exactly the same muscles.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Tracking your progress",
    body:
      "Every set you log is saved to your history. As weeks go on you'll see your weights increase — that's the program doing its job. Check your history anytime from the bottom navigation.",
  },
];

export function AppTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage blocked (SSR guard, private browsing, etc.)
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="w-full max-w-lg bg-surface rounded-t-2xl px-6 pt-6 pb-10">
        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 rounded-full bg-border-default mb-6" />

        {/* Step dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={[
                "h-1 rounded-full transition-all duration-300",
                i === step
                  ? "w-6 bg-accent"
                  : i < step
                  ? "w-3 bg-accent opacity-40"
                  : "w-3 bg-border-default",
              ].join(" ")}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-accent mb-5">
          {current.icon}
        </div>

        {/* Content */}
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {current.title}
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          {current.body}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-2xl bg-text-primary text-bg py-4 text-sm font-semibold"
          >
            {isLast ? "Got it, let's go" : "Next"}
          </button>
          {!isLast && (
            <button
              type="button"
              onClick={dismiss}
              className="px-4 py-4 text-sm text-text-muted"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
