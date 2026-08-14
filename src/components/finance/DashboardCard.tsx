interface DashboardCardProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function DashboardCard({ title, action, children }: DashboardCardProps) {
  return (
    <section className="card flex flex-col gap-14 p-20">
      <div className="flex items-center justify-between">
        <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
