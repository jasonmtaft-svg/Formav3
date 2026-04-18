"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearHistoryAction } from "@/actions/clear-history";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClear() {
    setError(null);
    startTransition(async () => {
      try {
        await clearHistoryAction();
        setConfirming(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 space-y-3">
      <p className="text-xs text-text-muted uppercase tracking-widest">
        Reset
      </p>

      {/* Change setup */}
      <Link
        href="/onboarding"
        className="flex items-center justify-between w-full text-sm text-text-primary py-1"
      >
        Change training setup
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
          <path d="M6 12l4-4-4-4" />
        </svg>
      </Link>

      <div className="border-t border-border-subtle" />

      {/* Clear history */}
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full text-left text-sm text-red-400 py-1"
        >
          Clear all history
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-primary">
            This will permanently delete all your workouts and logged sets. This cannot be undone.
          </p>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-border-default py-2 text-sm text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isPending}
              className="flex-1 rounded-lg bg-red-500/15 py-2 text-sm font-medium text-red-400 disabled:opacity-50"
            >
              {isPending ? "Clearing…" : "Yes, clear"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
