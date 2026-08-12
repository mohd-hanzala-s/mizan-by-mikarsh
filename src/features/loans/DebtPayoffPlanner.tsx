import { useMemo, useState } from 'react'
import { Snowflake, TrendingDown } from 'lucide-react'
import { compareStrategies, toSimulationInput } from '@/services/DebtPayoffService'
import type { Loan } from '@/types/entities'
import { cn } from '@/utils/cn'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatMonths(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${months} mo`
  if (rem === 0) return `${years} yr`
  return `${years} yr ${rem} mo`
}

interface StrategyCardProps {
  label: string
  icon: typeof Snowflake
  description: string
  months: number
  totalInterest: number
  order: { name: string; payoffMonth: number }[]
  neverPaysOff: boolean
  cheaper: boolean
}

function StrategyCard({
  label,
  icon: Icon,
  description,
  months,
  totalInterest,
  order,
  neverPaysOff,
  cheaper,
}: StrategyCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-12 rounded-lg border p-16',
        cheaper ? 'border-income/40 bg-income-subtle' : 'border-border bg-surface-card'
      )}
    >
      <div className="flex items-center gap-8">
        <Icon className="size-20 text-text-secondary" aria-hidden="true" />
        <div>
          <p className="text-body font-semibold text-text-primary">{label}</p>
          <p className="text-caption text-text-tertiary">{description}</p>
        </div>
        {cheaper && (
          <span className="ml-auto rounded-full bg-income px-8 py-2 text-caption font-medium text-white">
            Saves more
          </span>
        )}
      </div>

      {neverPaysOff ? (
        <p className="text-body-sm text-expense">
          These minimum payments (plus your extra) don&rsquo;t cover accruing interest — debt-free
          date isn&rsquo;t reachable at this rate. Try a larger extra payment.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-caption text-text-tertiary">Debt-free in</p>
              <p className="text-h3 font-semibold tabular-nums text-text-primary">
                {formatMonths(months)}
              </p>
            </div>
            <div>
              <p className="text-caption text-text-tertiary">Total interest</p>
              <p className="text-h3 font-semibold tabular-nums text-text-primary">
                {fmt(totalInterest)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-border-subtle pt-8">
            <p className="text-caption text-text-tertiary">Payoff order</p>
            {order.map((loan, i) => (
              <div key={loan.name} className="flex items-center justify-between text-body-sm">
                <span className="text-text-secondary">
                  {i + 1}. {loan.name}
                </span>
                <span className="text-text-tertiary">{formatMonths(loan.payoffMonth)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface DebtPayoffPlannerProps {
  loans: Loan[]
}

/** §16 improvement — snowball vs. avalanche payoff comparison for active
 * loans. Reuses DebtPayoffService's simulation; this component is purely
 * presentational plus the "extra payment" input. */
export function DebtPayoffPlanner({ loans }: DebtPayoffPlannerProps) {
  const [extraPayment, setExtraPayment] = useState(0)

  const simulationInput = useMemo(() => toSimulationInput(loans), [loans])

  const { snowball, avalanche } = useMemo(
    () => compareStrategies(simulationInput, extraPayment),
    [simulationInput, extraPayment]
  )

  if (simulationInput.length === 0) return null

  const snowballCheaper =
    !snowball.neverPaysOff &&
    !avalanche.neverPaysOff &&
    snowball.totalInterestPaid < avalanche.totalInterestPaid
  const avalancheCheaper =
    !snowball.neverPaysOff &&
    !avalanche.neverPaysOff &&
    avalanche.totalInterestPaid < snowball.totalInterestPaid

  const nameById = new Map(simulationInput.map((l) => [l.id, l.name]))
  const orderWithNames = (result: typeof snowball) =>
    result.order.map((id) => {
      const loanResult = result.perLoan.find((l) => l.id === id)!
      return { name: nameById.get(id) ?? id, payoffMonth: loanResult.payoffMonth }
    })

  return (
    <section className="flex flex-col gap-16 rounded-lg border border-border bg-surface-card p-16">
      <div>
        <h2 className="text-h3 text-text-primary">Debt Payoff Planner</h2>
        <p className="text-body-sm text-text-secondary">
          Compare paying loans off smallest-balance-first (snowball) vs. highest-rate-first
          (avalanche), assuming you keep making every loan&rsquo;s minimum payment.
        </p>
      </div>

      <label className="flex flex-col gap-4">
        <span className="text-body-sm font-medium text-text-primary">
          Extra you can put toward debt each month
        </span>
        <div className="flex items-center gap-8">
          <span className="text-body text-text-tertiary">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={extraPayment}
            onChange={(e) => setExtraPayment(Math.max(0, Number(e.target.value) || 0))}
            className="w-full max-w-[160px] rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary"
            aria-label="Extra monthly payment"
          />
        </div>
      </label>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <StrategyCard
          label="Snowball"
          icon={Snowflake}
          description="Smallest balance first — quick wins, motivation"
          months={snowball.monthsToDebtFree}
          totalInterest={snowball.totalInterestPaid}
          order={orderWithNames(snowball)}
          neverPaysOff={snowball.neverPaysOff}
          cheaper={snowballCheaper}
        />
        <StrategyCard
          label="Avalanche"
          icon={TrendingDown}
          description="Highest interest rate first — least total interest"
          months={avalanche.monthsToDebtFree}
          totalInterest={avalanche.totalInterestPaid}
          order={orderWithNames(avalanche)}
          neverPaysOff={avalanche.neverPaysOff}
          cheaper={avalancheCheaper}
        />
      </div>
    </section>
  )
}
