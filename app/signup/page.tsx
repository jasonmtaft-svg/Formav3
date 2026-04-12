import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-text-secondary">Start training smarter.</p>
        </div>

        <form className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-xs text-text-muted mb-1.5">
              Name
            </label>
            <input
              id="name"
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
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active"
              placeholder="Min. 8 characters"
            />
          </div>

          <Button type="submit">Create account</Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/" className="text-text-primary underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
