import * as React from "react"

interface CashRiseLogoProps {
  className?: string
  size?: number
  withText?: boolean
}

export function CashRiseLogo({ className = "", size = 36, withText = true }: CashRiseLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cr-core" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#37C7FF" />
            <stop offset="55%" stopColor="#16D9B6" />
            <stop offset="100%" stopColor="#FFB454" />
          </linearGradient>
          <linearGradient id="cr-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9FBFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0A1B2C" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#cr-core)" />
        <rect x="10" y="10" width="44" height="44" rx="14" fill="url(#cr-glow)" />
        <path
          d="M18 38L28 28L36 36L48 22"
          stroke="#0B1624"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="22" r="4" fill="#0B1624" />
      </svg>
      {withText && (
        <div className="leading-none">
          <div className="cr-title text-xl tracking-wide text-white">CashRise</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-300">
            Invest • Play • Earn
          </div>
        </div>
      )}
    </div>
  )
}
