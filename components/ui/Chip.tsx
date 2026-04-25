"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function Chip({ label, selected, onSelect }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected
          ? "border-accent bg-accent text-white"
          : "border-border-default bg-surface text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
