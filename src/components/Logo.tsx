interface LogoProps {
  size?: number
  className?: string
  /** Si es decorativo (hay texto al lado), se oculta a lectores de pantalla. */
  decorative?: boolean
}

/** Lupa que despeja el humo: el símbolo de la app. */
export function LogoMark({ size = 40, className, decorative = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Detectives del Humo'}
      focusable="false"
    >
      <path
        d="M6 22c4-5 9-5 13 0s9 5 13 0M4 34c4-5 9-5 13 0"
        fill="none"
        stroke="var(--smoke)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="35" cy="28" r="17" fill="var(--lemon)" stroke="var(--ink)" strokeWidth="5" />
      <path
        d="M27 28c2.5-3 5.5-3 8 0s5.5 3 8 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M47.5 40.5 58 51" stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" />
      <path d="M47.5 40.5 58 51" stroke="var(--magenta)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
