// Duas setas convergindo: o encontro entre quem perdeu e quem achou.

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 9h6.2" />
      <path d="M5.6 6.4 8.6 9l-3 2.6" />

      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />

      <path d="M22 15h-6.2" />
      <path d="M18.4 12.4 15.4 15l3 2.6" />
    </svg>
  );
}

export function LogoBadge({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-[28%] bg-brand/10 text-brand ${className}`}
    >
      <LogoMark className="h-[64%] w-[64%]" />
    </span>
  );
}

// A animacao (e o prefers-reduced-motion) fica em globals.css.
export function LogoMarkAnimada({
  className = "h-24 w-24",
  modo = "uma-vez",
}: {
  className?: string;
  /** "uma-vez" toca e para montada; "animar" repete em laco. */
  modo?: "uma-vez" | "animar";
}) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={`resgata-mark ${modo} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Resgata encontrou uma correspondencia"
    >
      <g className="arrow-left">
        <path
          d="M8 22 H24"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M17 14 L26 22 L17 30"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g className="arrow-right">
        <path
          d="M52 38 H36"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M43 46 L34 38 L43 30"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <circle
        className="ring"
        cx="30"
        cy="30"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <circle className="dot" cx="30" cy="30" r="6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
