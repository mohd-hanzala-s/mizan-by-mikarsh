import { cn } from '@/utils/cn'

interface SimulatorSliderProps {
  label: string
  description: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export function SimulatorSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: SimulatorSliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  const displayValue = unit === '%'
    ? `${value}%`
    : unit === 'INR' || unit === '₹'
      ? `₹${value.toLocaleString('en-IN')}`
      : `${value}${unit ? ' ' + unit : ''}`

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex items-center justify-between gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-body-sm font-medium text-text-primary">{label}</label>
          <span className="text-caption text-text-tertiary">{description}</span>
        </div>
        <span className="tabular-nums text-body-sm font-semibold text-brand-teal400 shrink-0">
          {displayValue}
        </span>
      </div>
      <div className="flex items-center gap-8">
        <span className="text-caption tabular-nums text-text-tertiary w-32 text-right shrink-0">
          {unit === '%' ? `${min}%` : unit === 'INR' || unit === '₹' ? `₹${min}` : `${min}`}
        </span>
        <div className="relative flex-1 h-32 flex items-center">
          <div className="absolute inset-x-0 h-8 rounded-full bg-border-subtle dark:bg-surface-raised" />
          <div
            className="absolute inset-y-0 left-0 h-8 rounded-full bg-brand-teal900 transition-all duration-fast"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(
              'absolute inset-x-0 h-32 w-full cursor-pointer appearance-none bg-transparent',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-20 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-teal900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
              '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-20 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-teal900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white'
            )}
          />
        </div>
        <span className="text-caption tabular-nums text-text-tertiary w-32 shrink-0">
          {unit === '%' ? `${max}%` : unit === 'INR' || unit === '₹' ? `₹${max}` : `${max}`}
        </span>
      </div>
    </div>
  )
}
