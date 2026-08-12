import { Scale } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div
      className="flex h-dvh w-full flex-col items-center justify-center gap-24 bg-surface"
      role="status"
      aria-label="Loading your finances"
    >
      <div className="relative flex items-center justify-center">
        <div className="size-64 rounded-3xl card-input flex items-center justify-center">
          <Scale
            className="size-32 text-brand-teal900"
            aria-hidden="true"
            style={{ animation: 'mzn-pulse-soft 1.8s ease-in-out infinite' }}
          />
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-4"
        style={{ animation: 'mzn-scale-in 0.4s ease-out both' }}
      >
        <p className="font-heading text-h3 font-bold text-text-primary">Mizan</p>
        <p
          className="text-body-sm text-text-tertiary"
          style={{ animation: 'mzn-pulse-soft 1.8s ease-in-out infinite 0.4s' }}
        >
          Loading your finances...
        </p>
      </div>
    </div>
  )
}
