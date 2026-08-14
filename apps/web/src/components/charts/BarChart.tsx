export interface BarSeries {
  label: string
  value: number
  color: string
}

export interface BarGroup {
  label: string
  series: BarSeries[]
}

interface BarChartProps {
  groups: BarGroup[]
  height?: number
  ariaLabel?: string
}

/** HTML grouped bar chart. Bars are divs sized as a % of the tallest value,
 * so the chart is fully responsive, theme-driven (caller-supplied colors),
 * and needs no canvas. `title` tooltips expose exact values. */
export function BarChart({ groups, height = 160, ariaLabel }: BarChartProps) {
  const max = Math.max(1, ...groups.flatMap((g) => g.series.map((s) => Math.max(0, s.value))))

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Bar chart with ${groups.length} groups`}
      className="flex items-end justify-between gap-8 select-none"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex min-w-0 flex-1 flex-col items-center gap-8">
          <div className="flex w-full items-end justify-center gap-6" style={{ height }}>
            {group.series.map((s) => {
              const percent = (Math.max(0, s.value) / max) * 100
              return (
                <div
                  key={s.label}
                  title={`${s.label}: ₹${s.value.toLocaleString('en-IN')}`}
                  className="group relative flex w-24 flex-col items-center justify-end h-full cursor-pointer"
                >
                  <div
                    className="w-full rounded-t-md transition-all duration-standard group-hover:brightness-110 group-hover:shadow-sm"
                    style={{ height: `${percent}%`, backgroundColor: s.color }}
                  />
                </div>
              )
            })}
          </div>
          <span className="text-caption font-medium text-text-tertiary">{group.label}</span>
        </div>
      ))}
    </div>
  )
}
