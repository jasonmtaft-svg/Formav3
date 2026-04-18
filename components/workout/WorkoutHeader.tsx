import Link from "next/link";

interface WorkoutHeaderProps {
  title: string;
  subtitle?: string;
}

export function WorkoutHeader({ title, subtitle }: WorkoutHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
      <Link
        href="/history"
        className="flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-text-primary transition-colors"
        aria-label="Exit workout"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 2l12 12M14 2L2 14" />
        </svg>
      </Link>
    </div>
  );
}
