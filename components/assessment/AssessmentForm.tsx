"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import type { StrengthAssessment, WeightUnit } from "@/lib/types";

const KG_TO_LBS = 2.20462;

interface AssessmentFormProps {
  weightUnit: WeightUnit;
  goal: string | null;
  equipment: string | null;
  experienceLevel: string | null;
  existingAssessment: StrengthAssessment | null;
}

type Phase = "form" | "loading" | "results";

const LOADING_MESSAGES = [
  "Analysing your photo…",
  "Estimating muscle development…",
  "Calculating starting weights…",
  "Applying safety margins…",
  "Preparing your assessment…",
];

const DISCLAIMER = `This is an AI-generated estimate based on body composition appearance only. It is not medical advice, not professional coaching advice, and does not account for your injury history, health conditions, or actual strength. Always consult a qualified fitness professional or doctor before starting a new exercise program. Start lighter than suggested — injuries happen when people rush.`;

function formatWeight(weightKg: number, unit: WeightUnit): string {
  if (unit === "kg") return `${weightKg} kg`;
  return `${Math.round(weightKg * KG_TO_LBS)} lbs`;
}

function toKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value / KG_TO_LBS;
}

/** Convert any image (including HEIC from iPhones) to a resized JPEG blob. */
function convertToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Failed to convert image")); return; }
          resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

export function AssessmentForm({
  weightUnit,
  goal,
  equipment,
  experienceLevel,
  existingAssessment,
}: AssessmentFormProps) {
  const [phase, setPhase] = useState<Phase>(existingAssessment ? "results" : "form");
  const [assessment, setAssessment] = useState<StrengthAssessment | null>(existingAssessment);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bodyWeight, setBodyWeight] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Photo must be under 20 MB.");
      return;
    }
    setError(null);
    try {
      // Convert to JPEG — handles HEIC (iPhone), PNG, WEBP, and oversized files
      const jpeg = await convertToJpeg(file);
      setPhotoFile(jpeg);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(jpeg);
    } catch {
      setError("Could not process that image. Try a different photo.");
    }
  }, []);

  async function handleSubmit() {
    if (!photoFile || !bodyWeight || !disclaimerAccepted) return;

    const bwNum = parseFloat(bodyWeight);
    if (isNaN(bwNum) || bwNum <= 0) {
      setError("Enter a valid body weight.");
      return;
    }

    setPhase("loading");
    setLoadingStep(0);
    setError(null);

    intervalRef.current = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
    }, 1400);

    try {
      const fd = new FormData();
      fd.append("photo", photoFile);
      fd.append("bodyWeightKg", String(toKg(bwNum, weightUnit)));
      fd.append("goal", goal ?? "improve_fitness");
      fd.append("equipment", equipment ?? "full_gym");
      fd.append("experienceLevel", experienceLevel ?? "beginner");

      const res = await fetch("/api/assess-strength", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.assessment) {
        throw new Error(data.error ?? "Assessment failed. Please try again.");
      }

      setAssessment(data.assessment);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("form");
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-8 py-12">
        <div className="w-full max-w-sm space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border-default bg-surface p-4 space-y-2 animate-pulse"
            >
              <div className="h-3 rounded bg-surface-elevated" style={{ width: `${40 + i * 20}%` }} />
              <div className="h-3 rounded bg-surface-elevated w-1/3" />
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">{LOADING_MESSAGES[loadingStep]}</p>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (phase === "results" && assessment) {
    const assessedDate = new Date(assessment.assessedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="space-y-5 flex-1">
        {/* Disclaimer — always shown above results */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
            Important — read before lifting
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">{DISCLAIMER}</p>
          <p className="text-xs font-semibold text-amber-400">
            These numbers are a rough starting point only. When in doubt, go lighter.
          </p>
        </div>

        {/* Assessment meta */}
        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Assessment</p>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Body weight</span>
            <span className="text-text-primary font-medium">
              {formatWeight(assessment.bodyWeightKg, weightUnit)}
            </span>
          </div>
          {assessment.estimatedBodyFatPct !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Est. body fat</span>
              <span className="text-text-primary font-medium">
                ~{assessment.estimatedBodyFatPct}%
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Assessed</span>
            <span className="text-text-primary">{assessedDate}</span>
          </div>
        </div>

        {/* Starting weights */}
        <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Starting weights guide</p>
          </div>
          <div className="divide-y divide-border-subtle">
            {assessment.startingWeights.map((entry, i) => (
              <div key={i} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text-primary">{entry.exercise}</p>
                  <span className="shrink-0 text-sm font-semibold text-text-primary">
                    {entry.suggestedWeightKg > 0
                      ? formatWeight(entry.suggestedWeightKg, weightUnit)
                      : "Bodyweight"}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-snug">{entry.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* General notes */}
        {assessment.generalNotes && (
          <div className="rounded-xl border border-border-default bg-surface p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Coach notes</p>
            <p className="text-sm text-text-secondary leading-relaxed">{assessment.generalNotes}</p>
          </div>
        )}

        {/* Reminder */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <p className="text-xs text-text-muted leading-relaxed">
            These suggestions were generated by AI and are not a substitute for advice from a qualified fitness professional. Your program&apos;s ExerciseCard will show progression cues — use those to increase weight gradually over time as your form improves.
          </p>
        </div>

        <Button variant="secondary" onClick={() => setPhase("form")}>
          Redo assessment
        </Button>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const canSubmit = photoFile && bodyWeight && disclaimerAccepted && !error;

  return (
    <div className="space-y-6 flex-1">
      {/* What this is */}
      <div className="space-y-1">
        <p className="text-sm text-text-secondary leading-relaxed">
          Upload a photo of yourself alongside your body weight and Forma will estimate appropriate starting weights for your exercises.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Your photo is sent directly to the AI for analysis and is <span className="text-text-primary font-medium">never stored</span> — only the weight suggestions are saved.
        </p>
      </div>

      {/* Disclaimer — must accept before submitting */}
      <div className="rounded-xl border border-border-default bg-surface p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Disclaimer — please read
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">{DISCLAIMER}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            className="mt-0.5 shrink-0 accent-white w-4 h-4"
          />
          <span className="text-xs text-text-secondary leading-snug">
            I understand this is a rough guide only. I will start lighter than suggested and consult a professional if I have any health concerns.
          </span>
        </label>
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-text-muted">Your photo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="sr-only"
          id="photo-input"
        />
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Your photo"
              className="w-full max-h-72 object-cover rounded-xl border border-border-default"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 rounded-lg bg-surface/90 border border-border-default px-3 py-1.5 text-xs font-medium text-text-primary"
            >
              Change photo
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo-input"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-default bg-surface p-10 cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">Tap to take or upload a photo</p>
              <p className="text-xs text-text-muted mt-0.5">Full body or upper body works best</p>
            </div>
          </label>
        )}
      </div>

      {/* Body weight */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest text-text-muted" htmlFor="body-weight">
          Your body weight ({weightUnit})
        </label>
        <input
          id="body-weight"
          type="number"
          inputMode="decimal"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
          placeholder={weightUnit === "kg" ? "e.g. 80" : "e.g. 175"}
          className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        Get my starting weights
      </Button>

      {existingAssessment && (
        <Button variant="secondary" onClick={() => setPhase("results")}>
          View existing assessment
        </Button>
      )}
    </div>
  );
}
