/**
 * Mizan Illustration Library
 * ─────────────────────────
 * Inline SVG illustrations that adapt to dark/light mode via CSS custom properties.
 * All colours reference tokens from tokens.css — no hardcoded hex values.
 * Animations are pure CSS keyframes defined inline via <style> tags.
 */

/** ── Shared animated floating keyframe injected once ── */
const KEYFRAMES = `
@keyframes mzn-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}
@keyframes mzn-spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes mzn-pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
}
@keyframes mzn-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
@keyframes mzn-confetti-fall {
  0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(20px) rotate(180deg); opacity: 0; }
}
@keyframes mzn-bar-grow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@keyframes mzn-scale-in {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
`

let keyframesInjected = false
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = KEYFRAMES
  document.head.appendChild(style)
  keyframesInjected = true
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Welcome / Balance-Scale Illustration
// ─────────────────────────────────────────────────────────────────────────────
export function WelcomeIllustration({ size = 160 }: { size?: number }) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-float 4s ease-in-out infinite' }}
    >
      {/* Glow circle */}
      <circle cx="80" cy="84" r="60" fill="var(--color-income)" opacity="0.08" />
      <circle cx="80" cy="84" r="44" fill="var(--color-income)" opacity="0.07" />

      {/* Pole */}
      <rect x="78" y="36" width="4" height="72" rx="2" fill="var(--color-brand-teal900)" />
      {/* Base platform */}
      <rect x="56" y="106" width="48" height="6" rx="3" fill="var(--color-brand-teal900)" />
      <rect
        x="68"
        y="112"
        width="24"
        height="4"
        rx="2"
        fill="var(--color-brand-teal900)"
        opacity="0.5"
      />

      {/* Horizontal beam */}
      <rect x="38" y="48" width="84" height="4" rx="2" fill="var(--color-brand-secondary)" />

      {/* Left pan chain */}
      <line
        x1="50"
        y1="52"
        x2="42"
        y2="76"
        stroke="var(--color-brand-secondary)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      {/* Left pan */}
      <ellipse cx="42" cy="78" rx="14" ry="5" fill="var(--color-brand-teal900)" opacity="0.9" />
      {/* Left coin stack */}
      <ellipse
        cx="42"
        cy="72"
        rx="10"
        ry="3.5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.9"
      />
      <ellipse cx="42" cy="68" rx="8" ry="3" fill="var(--color-brand-gold, var(--color-income))" />
      <ellipse
        cx="42"
        cy="64"
        rx="6"
        ry="2.5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.8"
      />

      {/* Right pan chain */}
      <line
        x1="110"
        y1="52"
        x2="118"
        y2="68"
        stroke="var(--color-brand-secondary)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      {/* Right pan (lower — heavier) */}
      <ellipse cx="118" cy="70" rx="14" ry="5" fill="var(--color-brand-teal900)" opacity="0.9" />
      {/* Right coin */}
      <ellipse
        cx="118"
        cy="64"
        rx="10"
        ry="3.5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.9"
      />

      {/* Floating rupee symbol */}
      <text
        x="76"
        y="32"
        fontSize="12"
        fill="var(--color-income)"
        fontWeight="700"
        fontFamily="sans-serif"
        opacity="0.7"
        style={{ animation: 'mzn-pulse-soft 2.5s ease-in-out infinite' }}
      >
        ₹
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Empty Transactions — Wallet with coins
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyTransactionsIllustration({ size = 140 }: { size?: number }) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-float 4.5s ease-in-out infinite' }}
    >
      <circle cx="70" cy="74" r="54" fill="var(--color-brand-teal900)" opacity="0.07" />

      {/* Wallet body */}
      <rect
        x="24"
        y="52"
        width="92"
        height="60"
        rx="12"
        fill="var(--color-surface-card, #fff)"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <rect
        x="24"
        y="52"
        width="92"
        height="22"
        rx="12"
        fill="var(--color-brand-teal900)"
        opacity="0.15"
      />

      {/* Wallet pocket */}
      <rect
        x="90"
        y="66"
        width="30"
        height="28"
        rx="8"
        fill="var(--color-brand-teal900)"
        opacity="0.12"
        stroke="var(--color-brand-teal900)"
        strokeWidth="1.5"
      />
      {/* Coin in pocket */}
      <circle
        cx="105"
        cy="80"
        r="7"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.8"
      />
      <text
        x="101.5"
        y="84"
        fontSize="8"
        fill="var(--color-surface-card, #fff)"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        ₹
      </text>

      {/* Card lines in wallet */}
      <rect x="34" y="84" width="44" height="6" rx="3" fill="var(--color-border-subtle)" />
      <rect
        x="34"
        y="96"
        width="32"
        height="6"
        rx="3"
        fill="var(--color-border-subtle)"
        opacity="0.6"
      />

      {/* Floating coins */}
      <circle
        cx="44"
        cy="40"
        r="10"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.75"
        style={{ animation: 'mzn-float 3s ease-in-out infinite 0.3s' }}
      />
      <text
        x="40"
        y="44.5"
        fontSize="9"
        fill="var(--color-surface-card, #fff)"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        ₹
      </text>

      <circle
        cx="100"
        cy="34"
        r="8"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.6"
        style={{ animation: 'mzn-float 3.5s ease-in-out infinite 0.8s' }}
      />
      <text
        x="96.5"
        y="38"
        fontSize="8"
        fill="var(--color-surface-card, #fff)"
        fontWeight="700"
        fontFamily="sans-serif"
      >
        ₹
      </text>

      <circle
        cx="122"
        cy="58"
        r="6"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.5"
        style={{ animation: 'mzn-float 4s ease-in-out infinite 0.5s' }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Empty Budgets — Plant growing from coins
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyBudgetsIllustration({ size = 140 }: { size?: number }) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-float 4.2s ease-in-out infinite' }}
    >
      <circle cx="70" cy="76" r="52" fill="var(--color-income)" opacity="0.07" />

      {/* Pot */}
      <path d="M52 96 L56 112 L84 112 L88 96 Z" fill="var(--color-brand-teal900)" opacity="0.7" />
      <rect x="48" y="90" width="44" height="8" rx="4" fill="var(--color-brand-teal900)" />

      {/* Soil */}
      <ellipse cx="70" cy="90" rx="20" ry="5" fill="var(--color-brand-secondary)" opacity="0.5" />

      {/* Stem */}
      <path
        d="M70 90 Q70 68 70 50"
        stroke="var(--color-income)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Left leaf */}
      <path d="M70 70 Q52 60 48 44 Q64 46 70 70" fill="var(--color-income)" opacity="0.8" />

      {/* Right leaf */}
      <path d="M70 58 Q88 48 92 32 Q76 34 70 58" fill="var(--color-income)" opacity="0.7" />

      {/* Coins */}
      <circle
        cx="56"
        cy="114"
        r="5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.8"
      />
      <circle
        cx="70"
        cy="116"
        r="5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.7"
      />
      <circle
        cx="84"
        cy="114"
        r="5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.6"
      />

      {/* Sparkles */}
      <circle
        cx="96"
        cy="52"
        r="3"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.6"
        style={{ animation: 'mzn-pulse-soft 2s ease-in-out infinite' }}
      />
      <circle
        cx="38"
        cy="60"
        r="2.5"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.4"
        style={{ animation: 'mzn-pulse-soft 2.8s ease-in-out infinite 0.5s' }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Empty Accounts — Credit card + sparkles
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyAccountsIllustration({ size = 140 }: { size?: number }) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-float 4s ease-in-out infinite' }}
    >
      <circle cx="70" cy="76" r="52" fill="var(--color-brand-teal900)" opacity="0.07" />

      {/* Card shadow */}
      <rect
        x="28"
        y="58"
        width="90"
        height="56"
        rx="10"
        fill="var(--color-brand-teal900)"
        opacity="0.08"
        transform="translate(4 4)"
      />

      {/* Card body */}
      <rect
        x="26"
        y="54"
        width="90"
        height="56"
        rx="10"
        fill="var(--color-brand-teal900)"
        opacity="0.9"
      />

      {/* Card stripe */}
      <rect
        x="26"
        y="68"
        width="90"
        height="14"
        fill="var(--color-brand-secondary)"
        opacity="0.6"
      />

      {/* Chip */}
      <rect
        x="38"
        y="58"
        width="20"
        height="14"
        rx="3"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.8"
      />
      <rect
        x="42"
        y="61"
        width="12"
        height="8"
        rx="2"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.4"
      />

      {/* Card number dots */}
      {[0, 1, 2, 3].map((g) => (
        <g key={g} transform={`translate(${38 + g * 20}, 90)`}>
          <circle cx="0" cy="0" r="2" fill="var(--color-surface-card, #fff)" opacity="0.7" />
          <circle cx="5" cy="0" r="2" fill="var(--color-surface-card, #fff)" opacity="0.7" />
          <circle cx="10" cy="0" r="2" fill="var(--color-surface-card, #fff)" opacity="0.7" />
          <circle cx="15" cy="0" r="2" fill="var(--color-surface-card, #fff)" opacity="0.7" />
        </g>
      ))}

      {/* Contactless icon */}
      <path
        d="M100 60 Q108 68 100 76"
        stroke="var(--color-surface-card, #fff)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M104 57 Q115 68 104 79"
        stroke="var(--color-surface-card, #fff)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />

      {/* Sparkles */}
      <path
        d="M22 40 L24 34 L26 40 L32 42 L26 44 L24 50 L22 44 L16 42 Z"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.7"
        style={{ animation: 'mzn-pulse-soft 2.5s ease-in-out infinite' }}
      />
      <path
        d="M108 28 L110 23 L112 28 L117 30 L112 32 L110 37 L108 32 L103 30 Z"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.5"
        style={{ animation: 'mzn-pulse-soft 2s ease-in-out infinite 0.7s' }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Success / All Set — Confetti burst
// ─────────────────────────────────────────────────────────────────────────────
export function SuccessIllustration({ size = 140 }: { size?: number }) {
  injectKeyframes()
  const confettiPieces = [
    { x: 40, y: 50, r: 5, color: 'var(--color-income)', delay: '0s' },
    { x: 100, y: 44, r: 4, color: 'var(--color-brand-gold, var(--color-income))', delay: '0.2s' },
    { x: 60, y: 36, r: 3.5, color: 'var(--color-brand-teal900)', delay: '0.4s' },
    { x: 118, y: 66, r: 4, color: 'var(--color-income)', delay: '0.1s' },
    { x: 28, y: 72, r: 3, color: 'var(--color-brand-secondary)', delay: '0.6s' },
    { x: 90, y: 30, r: 3, color: 'var(--color-brand-teal900)', delay: '0.3s' },
    { x: 48, y: 30, r: 2.5, color: 'var(--color-brand-gold, var(--color-income))', delay: '0.5s' },
  ]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
    >
      <circle cx="70" cy="80" r="50" fill="var(--color-income)" opacity="0.08" />
      <circle cx="70" cy="80" r="36" fill="var(--color-income)" opacity="0.1" />

      {/* Check circle */}
      <circle cx="70" cy="80" r="28" fill="var(--color-income)" />
      {/* Checkmark */}
      <path
        d="M56 80 L66 90 L84 70"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Confetti */}
      {confettiPieces.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={p.color}
          opacity="0.8"
          style={{ animation: `mzn-float 3s ease-in-out infinite ${p.delay}` }}
        />
      ))}

      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 70 + Math.cos(rad) * 32
        const y1 = 80 + Math.sin(rad) * 32
        const x2 = 70 + Math.cos(rad) * 42
        const y2 = 80 + Math.sin(rad) * 42
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-income)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
            style={{ animation: `mzn-pulse-soft ${2 + i * 0.2}s ease-in-out infinite` }}
          />
        )
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Lock / Shield Illustration
// ─────────────────────────────────────────────────────────────────────────────
export function LockIllustration({
  size = 140,
  shake = false,
}: {
  size?: number
  shake?: boolean
}) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        animation: shake ? 'mzn-shake 0.5s ease-in-out' : 'mzn-float 4s ease-in-out infinite',
      }}
    >
      <circle cx="70" cy="76" r="52" fill="var(--color-brand-teal900)" opacity="0.08" />
      <circle cx="70" cy="76" r="38" fill="var(--color-brand-teal900)" opacity="0.07" />

      {/* Shield outer */}
      <path
        d="M70 28 L102 42 L102 72 Q102 96 70 112 Q38 96 38 72 L38 42 Z"
        fill="var(--color-brand-teal900)"
        opacity="0.85"
      />
      {/* Shield inner highlight */}
      <path
        d="M70 36 L96 48 L96 70 Q96 90 70 104 Q44 90 44 70 L44 48 Z"
        fill="var(--color-brand-teal900)"
        opacity="0.6"
      />
      {/* Shield sheen */}
      <path
        d="M70 36 L58 42 L58 52 Q58 62 70 68 Q82 62 82 52 L82 42 Z"
        fill="white"
        opacity="0.08"
      />

      {/* Lock body */}
      <rect x="58" y="74" width="24" height="20" rx="5" fill="white" opacity="0.9" />

      {/* Lock shackle */}
      <path
        d="M63 74 L63 66 Q63 58 70 58 Q77 58 77 66 L77 74"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Keyhole */}
      <circle cx="70" cy="82" r="4" fill="var(--color-brand-teal900)" opacity="0.7" />
      <rect
        x="68.5"
        y="83"
        width="3"
        height="5"
        rx="1.5"
        fill="var(--color-brand-teal900)"
        opacity="0.7"
      />

      {/* Star sparkles */}
      <path
        d="M24 56 L26 50 L28 56 L34 58 L28 60 L26 66 L24 60 L18 58 Z"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.6"
        style={{ animation: 'mzn-pulse-soft 2.5s ease-in-out infinite' }}
      />
      <path
        d="M108 44 L109.5 40 L111 44 L115 45.5 L111 47 L109.5 51 L108 47 L104 45.5 Z"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.5"
        style={{ animation: 'mzn-pulse-soft 3s ease-in-out infinite 0.5s' }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Empty Insights — Lightbulb
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyInsightsIllustration({ size = 140 }: { size?: number }) {
  injectKeyframes()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ animation: 'mzn-float 4s ease-in-out infinite' }}
    >
      <circle
        cx="70"
        cy="72"
        r="52"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.08"
      />

      {/* Bulb glass */}
      <path
        d="M70 32 Q88 32 96 50 Q104 68 90 84 L86 92 L54 92 L50 84 Q36 68 44 50 Q52 32 70 32 Z"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.3"
      />
      <path
        d="M70 32 Q88 32 96 50 Q104 68 90 84 L86 92 L54 92 L50 84 Q36 68 44 50 Q52 32 70 32 Z"
        stroke="var(--color-brand-gold, var(--color-income))"
        strokeWidth="2"
        fill="none"
      />

      {/* Filament glow */}
      <circle
        cx="70"
        cy="62"
        r="16"
        fill="var(--color-brand-gold, var(--color-income))"
        opacity="0.2"
        style={{ animation: 'mzn-pulse-soft 1.8s ease-in-out infinite' }}
      />
      <path
        d="M62 70 L66 58 L70 66 L74 54 L78 70"
        stroke="var(--color-brand-gold, var(--color-income))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Base lines */}
      <rect
        x="58"
        y="92"
        width="24"
        height="5"
        rx="2.5"
        fill="var(--color-brand-teal900)"
        opacity="0.5"
      />
      <rect
        x="61"
        y="97"
        width="18"
        height="5"
        rx="2.5"
        fill="var(--color-brand-teal900)"
        opacity="0.4"
      />
      <rect
        x="64"
        y="102"
        width="12"
        height="5"
        rx="2.5"
        fill="var(--color-brand-teal900)"
        opacity="0.3"
      />

      {/* Rays */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 70 + Math.cos(rad) * 52
        const y1 = 62 + Math.sin(rad) * 52
        const x2 = 70 + Math.cos(rad) * 58
        const y2 = 62 + Math.sin(rad) * 58
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-brand-gold, var(--color-income))"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.35"
            style={{ animation: `mzn-pulse-soft ${2 + i * 0.3}s ease-in-out infinite` }}
          />
        )
      })}
    </svg>
  )
}
