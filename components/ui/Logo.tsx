interface LogoProps {
  size?: "sm" | "lg";
  className?: string;
}

/** Forma logotype — vertical spine with two curved branches. */
export function Logo({ size = "sm", className }: LogoProps) {
  const w = size === "sm" ? 22 : 32;
  const h = size === "sm" ? 34 : 52;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 22 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Forma"
    >
      {/* Vertical spine */}
      <line x1="11" y1="0" x2="11" y2="34" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" />
      {/* Left branch */}
      <path d="M11 12 Q4 10 2 5" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Right branch */}
      <path d="M11 18 Q18 16 20 11" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
