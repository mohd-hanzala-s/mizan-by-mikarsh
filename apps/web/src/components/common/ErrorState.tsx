import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-20 p-24 text-center">
      <div className="card-input flex size-80 items-center justify-center rounded-3xl">
        <div className="flex size-56 items-center justify-center rounded-2xl bg-expense-subtle shadow-glass-pressed">
          <AlertTriangle className="size-28 text-expense" aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <h2 className="text-h3 font-bold text-text-primary">{title}</h2>
        <p className="text-body-sm text-text-secondary max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-touch items-center rounded-2xl bg-brand-teal900 px-24 py-12 text-body-sm font-semibold text-white shadow-glass-sm hover:shadow-glass-pressed transition-all duration-fast active:scale-[0.97]"
        >
          Try again
        </button>
      )}
    </div>
  )
}
