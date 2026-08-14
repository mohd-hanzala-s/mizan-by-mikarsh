import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-8 whitespace-nowrap rounded-2xl text-body font-semibold ' +
    'transition-all duration-fast active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ' +
    'select-none min-h-touch',
  {
    variants: {
      variant: {
        primary: 'bg-brand-teal900 text-white shadow-glass-sm hover:shadow-glass-pressed',
        secondary:
          'bg-surface text-text-primary shadow-glass-sm hover:shadow-glass-pressed border border-border/30',
        tertiary: 'bg-transparent text-text-primary hover:shadow-glass-sm hover:bg-surface/60',
        destructive: 'bg-expense text-white shadow-glass-sm hover:shadow-glass-pressed',
        accent: 'bg-accent text-white shadow-glass-sm hover:shadow-glass-pressed',
        icon: 'bg-transparent text-text-secondary hover:shadow-glass-sm hover:text-text-primary',
      },
      size: {
        default: 'h-48 px-20',
        sm: 'h-40 px-14 text-body-sm rounded-xl',
        lg: 'h-56 px-28 text-body-lg rounded-2xl',
        icon: 'h-40 w-40 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-16 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
