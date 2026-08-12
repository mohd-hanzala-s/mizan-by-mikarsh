import type { DashboardAlert } from '@/services/DashboardService'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

interface AlertCardProps {
  alert: DashboardAlert
}

export function AlertCard({ alert }: AlertCardProps) {
  const Icon = alert.severity === 'warning' ? AlertTriangle : Info

  return (
    <div
      className={cn(
        'card-sm flex items-start gap-10 p-12 text-body-sm font-medium',
        alert.severity === 'warning'
          ? 'bg-gold-500/10'
          : 'bg-brand-teal400/10'
      )}
    >
      <Icon
        className={cn(
          'mt-2 size-16 shrink-0',
          alert.severity === 'warning' ? 'text-gold-500' : 'text-brand-teal400'
        )}
        aria-hidden="true"
      />
      <span className="text-text-primary">{alert.message}</span>
    </div>
  )
}
