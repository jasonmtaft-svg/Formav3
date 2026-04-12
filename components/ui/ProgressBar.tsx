interface ProgressBarProps {
  total: number;
  current: number; // 0-based index of the active step
}

export function ProgressBar({ total, current }: ProgressBarProps) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i < current
              ? "bg-text-primary"
              : i === current
                ? "bg-text-secondary"
                : "bg-surface-elevated"
          }`}
        />
      ))}
    </div>
  );
}
