type ShapeProps = {
  className?: string;
};

/** Decorative geometry only — never conveys information, always hidden from a11y tree. */

export function Squiggle({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 120 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 12c6-10 12-10 18 0s12 10 18 0 12-10 18 0 12 10 18 0 12-10 18 0 12 10 18 0"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Zigzag({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 20" fill="none" className={className} aria-hidden="true">
      <polyline
        points="0,18 12,2 25,18 37,2 50,18 62,2 75,18 87,2 100,18"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RingBurst({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true">
      <circle cx="30" cy="30" r="16" stroke="currentColor" strokeWidth="4" strokeDasharray="6 7" />
    </svg>
  );
}

export function Triangle({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 40 36" fill="none" className={className} aria-hidden="true">
      <path d="M20 2 L38 34 L2 34 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

export function Dots({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 70 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="6" cy="12" r="6" />
      <circle cx="24" cy="6" r="4" />
      <circle cx="40" cy="16" r="5" />
      <circle cx="58" cy="9" r="3.5" />
    </svg>
  );
}
