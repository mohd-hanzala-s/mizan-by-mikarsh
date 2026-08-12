interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondaryAction?: () => void
  illustration?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-24 py-48 text-center">
      <div className="mb-24 flex flex-col items-center gap-20 max-w-xs">
        {illustration ??
          (Icon && (
            <div className="card-input flex size-80 items-center justify-center rounded-3xl">
              <div className="flex size-56 items-center justify-center rounded-2xl shadow-glass-pressed bg-surface">
                <Icon className="size-28 text-text-tertiary" aria-hidden="true" />
              </div>
            </div>
          ))}
        <div className="flex flex-col gap-6">
          <h2 className="text-h3 font-bold text-text-primary">{title}</h2>
          <p className="text-body-sm text-text-secondary max-w-xs">{description}</p>
        </div>
        <div className="flex items-center gap-8">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex min-h-touch items-center rounded-2xl bg-accent px-24 py-12 text-body-sm font-semibold text-white shadow-glass-sm hover:shadow-glass-pressed transition-all duration-fast active:scale-[0.97]"
            >
              {actionLabel}
            </button>
          )}
          {onSecondaryAction && secondaryLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex min-h-touch items-center rounded-2xl bg-surface px-24 py-12 text-body-sm font-semibold text-text-primary shadow-glass-sm hover:shadow-glass-pressed transition-all duration-fast active:scale-[0.97]"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
