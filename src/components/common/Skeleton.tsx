import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-xl overflow-hidden relative bg-border-subtle', className)}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'mzn-shimmer 1.6s ease-in-out infinite',
        }}
      />
    </div>
  )
}

if (typeof document !== 'undefined') {
  if (!document.getElementById('mzn-skeleton-kf')) {
    const s = document.createElement('style')
    s.id = 'mzn-skeleton-kf'
    s.textContent = `
      @keyframes mzn-shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
    `
    document.head.appendChild(s)
  }
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-8', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-10 rounded-sm', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('card-sm rounded-xl p-16', className)}
      aria-hidden="true"
    >
      <div className="flex items-center gap-12">
        <Skeleton className="size-40 rounded-xl" />
        <div className="flex flex-1 flex-col gap-8">
          <Skeleton className="h-12 w-2/3 rounded-sm" />
          <Skeleton className="h-8 w-1/2 rounded-sm" />
        </div>
      </div>
      <div className="mt-12 flex gap-8">
        <Skeleton className="h-32 flex-1 rounded-xl" />
        <Skeleton className="h-32 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-sm rounded-xl flex items-center gap-12 p-16"
        >
          <Skeleton className="size-40 rounded-xl" />
          <div className="flex flex-1 flex-col gap-8">
            <Skeleton className="h-12 w-1/2 rounded-sm" />
            <Skeleton className="h-8 w-1/3 rounded-sm" />
          </div>
          <Skeleton className="h-24 w-64 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonPage({ sections = 4 }: { sections?: number }) {
  return (
    <div className="flex flex-col gap-16 p-16" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-24 w-1/3 rounded-sm" />
        <Skeleton className="size-40 rounded-xl" />
      </div>
      {Array.from({ length: sections }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
