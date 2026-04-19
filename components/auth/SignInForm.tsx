"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
    router.push("/workout");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold tracking-tight">Forma</h1>
          <p className="text-sm text-text-secondary">Your AI training partner.</p>
        </div>

        <form className="space-y-3" action={(fd) => startTransition(() => handleAction(fd))}>
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
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          No account?{" "}
          <Link href="/signup" className="text-text-primary underline underline-offset-4">
            Create one
          </Link>
        </p>

      </div>
    </main>
  );
}
