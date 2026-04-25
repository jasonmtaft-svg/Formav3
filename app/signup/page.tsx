"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
    router.push("/onboarding");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-start px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-text-secondary">Start training smarter.</p>
        </div>

        <form className="space-y-3" action={(fd) => startTransition(() => handleAction(fd))}>
          <div>
            <label htmlFor="name" className="block text-xs text-text-muted mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs text-text-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs text-text-muted mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/" className="text-text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>

        <div className="space-y-3 pt-2">
          <p className="text-[11px] uppercase tracking-widest text-text-muted text-center">
            Everything inside
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                label: "Workout",
                description: "AI-generated superset sessions tailored to you",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4" />
                  </svg>
                ),
              },
              {
                label: "Program",
                description: "Your personalised 12-week training plan",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                ),
              },
              {
                label: "Nutrition",
                description: "AI meal planning and recipe suggestions",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M12 6v6l4 2" />
                    <path d="M8 14c1 2 2.5 3 4 3s3-1 4-3" />
                  </svg>
                ),
              },
              {
                label: "Macros",
                description: "Track calories, protein, carbs and fat",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                    <path d="M8 12h8" />
                  </svg>
                ),
              },
              {
                label: "Profile",
                description: "Strength history, settings and progress",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl border border-border-default bg-surface px-4 py-3"
              >
                <span className="text-accent shrink-0">{feature.icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{feature.label}</p>
                  <p className="text-xs text-text-secondary">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
