"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { BottomNav } from "@/components/ui/BottomNav";
import { generateProgramAction } from "@/actions/generate-program";
import type { Goal, Equipment, ExperienceLevel, ActivityLevel } from "@/lib/types";

// ─── Step data ───────────────────────────────────────────────────────────────

const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: "build_muscle",     label: "Build muscle",       description: "Add size and strength" },
  { value: "lose_fat",         label: "Lose fat",           description: "Burn fat, keep muscle" },
  { value: "improve_fitness",  label: "Improve fitness",    description: "Energy, stamina, health" },
];

const SPECIFIC_FOCUS_OPTIONS = [
  "Bigger arms",
  "Bigger chest",
  "Broader back",
  "Bigger shoulders",
  "Stronger legs",
  "Bigger glutes",
  "Stronger core",
  "Lose belly fat",
  "Overall strength",
  "Better fitness",
];

const SESSION_DURATIONS: { value: 45 | 60 | 90; label: string; description: string }[] = [
  { value: 45, label: "45 min", description: "Short & focused — 3 supersets" },
  { value: 60, label: "60 min", description: "Standard session — 4 supersets" },
  { value: 90, label: "90 min", description: "Full session — 5 supersets" },
];

const DAYS = [2, 3, 4, 5, 6];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; description: string }[] = [
  { value: "full_gym",       label: "Full gym",        description: "Barbells, cables, machines" },
  { value: "dumbbells_only", label: "Dumbbells only",  description: "Home or hotel gym" },
  { value: "bodyweight",     label: "Bodyweight",      description: "No equipment needed" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: "beginner",     label: "New to the gym",     description: "Less than 6 months experience" },
  { value: "intermediate", label: "Some experience",    description: "6 months to 2 years" },
  { value: "advanced",     label: "Regular gym-goer",   description: "2+ years, confident with most exercises" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary",      label: "Mostly sedentary",    description: "Desk job, limited movement outside gym" },
  { value: "lightly_active", label: "Lightly active",      description: "Regular walking, some activity outside gym" },
  { value: "active",         label: "Physically active",   description: "Active job, sport, or daily training outside gym" },
];

const LOADING_MESSAGES = [
  "Analysing your profile…",
  "Designing your 12-week program…",
  "Building blocks and progressions…",
  "Pairing supersets for each session…",
  "Personalising for your goals…",
  "Finalising your program…",
];

const TOTAL_STEPS = 8;

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  // Step
  const [step, setStep] = useState(0);

  // Step 0 — Goal
  const [goal, setGoal] = useState<Goal | null>(null);
  // Step 1 — Specific focus
  const [specificFocus, setSpecificFocus] = useState<string[]>([]);
  // Step 2 — Days
  const [days, setDays] = useState<number | null>(null);
  // Step 3 — Session duration
  const [sessionDuration, setSessionDuration] = useState<45 | 60 | 90 | null>(null);
  // Step 4 — Equipment
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  // Step 5 — Experience
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  // Step 6 — Age + activity level
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  // Step 7 — Injuries
  const [injuries, setInjuries] = useState("");
  const [noInjuries, setNoInjuries] = useState(false);

  // Generate
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function toggleFocus(option: string) {
    setSpecificFocus((prev) =>
      prev.includes(option) ? prev.filter((f) => f !== option) : [...prev, option],
    );
  }

  const canProceed = (() => {
    const ageNum = parseInt(age);
    switch (step) {
      case 0: return !!goal;
      case 1: return specificFocus.length > 0;
      case 2: return !!days;
      case 3: return !!sessionDuration;
      case 4: return !!equipment;
      case 5: return !!experienceLevel;
      case 6: return !isNaN(ageNum) && ageNum >= 13 && ageNum <= 100 && !!activityLevel;
      case 7: return true;
      default: return false;
    }
  })();

  async function handleGenerate() {
    if (!goal || !days || !sessionDuration || !equipment || !experienceLevel || !activityLevel) return;
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);

    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
    }, 1200);

    try {
      await generateProgramAction({
        goal,
        daysPerWeek: days,
        equipment,
        experienceLevel,
        age: ageNum,
        sessionDurationMinutes: sessionDuration,
        activityLevel,
        specificFocus,
        injuries: noInjuries ? "" : injuries.trim(),
      });
      router.refresh();
      router.push("/program/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    } finally {
      clearInterval(interval);
    }
  }

  // ── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 gap-8">
        <Logo size="lg" />
        <div className="w-full max-w-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border-default bg-surface p-4 space-y-2 animate-pulse"
            >
              <div className="h-3 rounded bg-surface-elevated" style={{ width: `${50 + i * 15}%` }} />
              <div className="h-3 rounded bg-surface-elevated w-1/3" />
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">{LOADING_MESSAGES[loadingStep]}</p>
      </main>
    );
  }

  // ── Wizard shell ────────────────────────────────────────────────────────
  const isLastStep = step === TOTAL_STEPS - 1;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-6 pb-24">
      {/* Progress bar + back */}
      <div className="flex items-center gap-3 mb-8">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="shrink-0 text-text-muted"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}
        <div className="flex-1 h-1.5 rounded-full bg-border-default overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="shrink-0 text-[11px] text-text-muted tabular-nums">
          {step + 1} / {TOTAL_STEPS}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 space-y-6">

        {/* ── Step 0: Goal ──────────────────────────────────────────────── */}
        {step === 0 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 1</p>
              <h2 className="text-2xl font-semibold">What&apos;s your main goal?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll build every session around it.</p>
            </div>
            <div className="flex flex-col gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                    goal === g.value
                      ? "border-accent bg-accent-subtle"
                      : "border-border-default bg-surface"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{g.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{g.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 1: Specific focus ────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 2</p>
              <h2 className="text-2xl font-semibold">What do you want to improve?</h2>
              <p className="text-sm text-text-secondary mt-1">Pick everything that applies — we&apos;ll prioritise these in your program.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SPECIFIC_FOCUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleFocus(option)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    specificFocus.includes(option)
                      ? "border-accent bg-accent text-white"
                      : "border-border-default bg-transparent text-text-secondary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {specificFocus.length === 0 && (
              <p className="text-xs text-text-muted">Select at least one area to continue.</p>
            )}
          </>
        )}

        {/* ── Step 2: Days per week ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 3</p>
              <h2 className="text-2xl font-semibold">How many days per week?</h2>
              <p className="text-sm text-text-secondary mt-1">Be realistic — consistency beats intensity.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                    days === d
                      ? "border-accent bg-accent text-white"
                      : "border-border-default bg-transparent text-text-secondary"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 3: Session duration ──────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 4</p>
              <h2 className="text-2xl font-semibold">How long per session?</h2>
              <p className="text-sm text-text-secondary mt-1">This sets how many supersets are in each workout.</p>
            </div>
            <div className="flex flex-col gap-2">
              {SESSION_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSessionDuration(d.value)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                    sessionDuration === d.value
                      ? "border-accent bg-accent-subtle"
                      : "border-border-default bg-surface"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{d.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{d.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 4: Equipment ─────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 5</p>
              <h2 className="text-2xl font-semibold">What equipment do you have?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll only program what you can actually use.</p>
            </div>
            <div className="flex flex-col gap-2">
              {EQUIPMENT_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEquipment(e.value)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                    equipment === e.value
                      ? "border-accent bg-accent-subtle"
                      : "border-border-default bg-surface"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{e.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{e.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 5: Experience ────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 6</p>
              <h2 className="text-2xl font-semibold">How experienced are you?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll pick exercises that match your ability.</p>
            </div>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setExperienceLevel(e.value)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                    experienceLevel === e.value
                      ? "border-accent bg-accent-subtle"
                      : "border-border-default bg-surface"
                  }`}
                >
                  <p className="text-sm font-semibold text-text-primary">{e.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{e.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 6: Age + activity level ─────────────────────────────── */}
        {step === 6 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 7</p>
              <h2 className="text-2xl font-semibold">About you</h2>
              <p className="text-sm text-text-secondary mt-1">Helps us tailor recovery times and exercise selection.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest text-text-muted" htmlFor="age-input">
                Your age
              </label>
              <input
                id="age-input"
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-text-muted">
                Activity level outside the gym
              </p>
              <div className="flex flex-col gap-2">
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setActivityLevel(a.value)}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
                      activityLevel === a.value
                        ? "border-accent bg-accent-subtle"
                        : "border-border-default bg-surface"
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{a.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 7: Injuries ──────────────────────────────────────────── */}
        {step === 7 && (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-accent mb-2">Step 8</p>
              <h2 className="text-2xl font-semibold">Any injuries or limitations?</h2>
              <p className="text-sm text-text-secondary mt-1">We&apos;ll make sure your program avoids aggravating them.</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noInjuries}
                onChange={(e) => {
                  setNoInjuries(e.target.checked);
                  if (e.target.checked) setInjuries("");
                }}
                className="w-4 h-4 accent-[#FF6B35]"
              />
              <span className="text-sm text-text-primary">No injuries or limitations</span>
            </label>

            {!noInjuries && (
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-widest text-text-muted" htmlFor="injuries-input">
                  Describe any injuries or areas to avoid
                </label>
                <textarea
                  id="injuries-input"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="e.g. Bad lower back — avoid heavy deadlifts. Left shoulder impingement."
                  rows={4}
                  className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent resize-none"
                />
              </div>
            )}

            {error && <p className="text-sm text-error">{error}</p>}
          </>
        )}
      </div>

      {/* Navigation button */}
      <div className="mt-8">
        {isLastStep ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canProceed}
            className="w-full inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold bg-accent text-white transition-opacity disabled:opacity-40"
          >
            Build my 12-week program
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed}
            className="w-full inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-semibold bg-accent text-white transition-opacity disabled:opacity-40"
          >
            Next
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
