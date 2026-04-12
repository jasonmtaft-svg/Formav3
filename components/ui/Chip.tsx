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
          ? "border-text-primary bg-text-primary text-bg"
          : "border-border-default bg-transparent text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
