import { useEffect, useMemo, useState, useCallback } from 'react'
import { RotateCcw, Target, Banknote, Calendar, ShieldCheck } from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useInvestmentsStore } from '@/features/investments/investmentsStore'
import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import { useSettingsStore } from '@/app/settingsStore'
import {
  SimulationService,
  type SimulationInputs,
  type SimulationResult,
  type YearProjection,
} from '@/services/SimulationService'
import { SimulatorSlider } from '@/features/simulator/SimulatorSlider'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { SERIES_PALETTE, CHART_ACCENTS } from '@/theme/chartColors'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { formatAmount } from '@/utils/currency'

const DEFAULT_INPUTS: SimulationInputs = {
  currentAge: 35,
  monthlySalary: 50000,
  monthlyExpenses: 35000,
  inflationRate: 6,
  investmentReturn: 12,
  monthlySIP: 10000,
  monthlyEMI: 5000,
  annualBonus: 100000,
  taxRate: 30,
  currentDebt: 500000,
  debtInterestRate: 10,
  retirementAge: 60,
  expectedSalaryGrowth: 8,
  emergencyFundMonths: 6,
  projectionYears: 25,
}

function NetWorthChart({ years }: { years: YearProjection[] }) {
  const maxNW = Math.max(...years.map((y) => y.netWorth), 1)
  const minNW = Math.min(...years.map((y) => y.netWorth), 0)
  const range = maxNW - minNW || 1
  const width = 100
  const height = 192
  const padding = 10

  const points = years.map((y, i) => {
    const x = padding + (i / Math.max(1, years.length - 1)) * (width - padding * 2)
    const yVal = height - padding - ((y.netWorth - minNW) / range) * (height - padding * 2)
    return `${x},${yVal}`
  })

  const zeroY = height - padding - ((0 - minNW) / range) * (height - padding * 2)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-192" preserveAspectRatio="none" aria-hidden="true">
      <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke={CHART_ACCENTS.neutral} strokeWidth="0.5" strokeDasharray="3,2" />
      <polygon
        points={`${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`}
        fill={CHART_ACCENTS.border}
        opacity="0.3"
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={SERIES_PALETTE[0]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SimulatorPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const loans = useLoansStore((s) => s.loans)
  const investments = useInvestmentsStore((s) => s.investments)
  const identity = useFinancialIdentityStore((s) => s.identity)
  const settings = useSettingsStore((s) => s.settings)

  const loadTx = useTransactionsStore((s) => s.load)
  const loadAccts = useAccountsStore((s) => s.load)
  const loadLoans = useLoansStore((s) => s.load)
  const loadInv = useInvestmentsStore((s) => s.load)
  const loadIdentity = useFinancialIdentityStore((s) => s.load)
  const loadSettings = useSettingsStore((s) => s.load)

  useEffect(() => {
    loadTx()
    loadAccts()
    loadLoans()
    loadInv()
    loadIdentity()
    loadSettings()
  }, [loadTx, loadAccts, loadLoans, loadInv, loadIdentity, loadSettings])

  const prefillInputs = useMemo(() => {
    if (transactions.length === 0) return DEFAULT_INPUTS
    return SimulationService.getDefaultInputs({
      transactions,
      accounts,
      loans,
      investments,
      identity,
    })
  }, [transactions, accounts, loans, investments, identity])

  const [inputs, setInputs] = useState<SimulationInputs>(prefillInputs)

  useEffect(() => {
    setInputs(prefillInputs)
  }, [prefillInputs])

  const result = useMemo<SimulationResult>(() => {
    return SimulationService.runSimulation(inputs)
  }, [inputs])

  const latestYear = result.years[result.years.length - 1]
  const healthBreakdown = useMemo(() => {
    return SimulationService.computeHealthScoreBreakdown(latestYear, inputs)
  }, [latestYear, inputs])

  const setField = useCallback((field: keyof SimulationInputs) => (val: number) => {
    setInputs((prev) => ({ ...prev, [field]: val }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setInputs(prefillInputs)
  }, [prefillInputs])

  const healthTone = latestYear.healthScore >= 70 ? 'good' : latestYear.healthScore >= 40 ? 'fair' : 'poor'
  const toneColor = healthTone === 'good' ? CHART_ACCENTS.income : healthTone === 'fair' ? CHART_ACCENTS.gold : CHART_ACCENTS.expense

  const metrics = useMemo(() => {
    const resultMetrics = []
    resultMetrics.push({
      label: 'Final Net Worth',
      value: formatAmount(result.finalNetWorth, settings?.currency ?? 'INR'),
      sublabel: `Year ${result.years.length - 1}`,
      icon: Banknote,
    })
    resultMetrics.push({
      label: 'Retirement Corpus',
      value: formatAmount(result.retirementCorpus, settings?.currency ?? 'INR'),
      sublabel: `At age ${inputs.retirementAge}`,
      icon: Target,
    })
    resultMetrics.push({
      label: 'Debt-Free',
      value: result.debtFreeYear !== null ? `Year ${result.debtFreeYear}` : 'Never',
      sublabel: result.debtFreeYear !== null ? `Age ${inputs.currentAge + result.debtFreeYear}` : 'With current inputs',
      icon: Calendar,
    })
    resultMetrics.push({
      label: 'Financial Independence',
      value: result.fiYear !== null ? `Year ${result.fiYear}` : 'Not reached',
      sublabel: result.fiYear !== null ? `Age ${inputs.currentAge + result.fiYear}` : 'Try increasing savings',
      icon: ShieldCheck,
    })
    return resultMetrics
  }, [result, inputs, settings])

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-64px)]">
      <div className="lg:w-[420px] lg:shrink-0 lg:border-r border-border-subtle overflow-y-auto p-16 md:p-24 flex flex-col gap-12">
        <div className="flex items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-h3 font-heading font-bold text-text-primary">Simulator</h1>
            <p className="text-caption text-text-tertiary">Adjust parameters to project your financial future</p>
          </div>
          <Button variant="tertiary" size="sm" onClick={resetToDefaults} aria-label="Reset to defaults">
            <RotateCcw className="size-14" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex flex-col divide-y divide-border-subtle">
          <div className="py-4">
            <p className="text-overline text-brand-teal400 font-bold mb-4">Personal</p>
            <SimulatorSlider
              label="Current Age"
              description="Your current age in years"
              value={inputs.currentAge}
              min={18}
              max={80}
              onChange={setField('currentAge')}
            />
            <SimulatorSlider
              label="Retirement Age"
              description="Target retirement age"
              value={inputs.retirementAge}
              min={40}
              max={80}
              onChange={setField('retirementAge')}
            />
            <SimulatorSlider
              label="Projection Years"
              description="How many years to simulate forward"
              value={inputs.projectionYears}
              min={5}
              max={50}
              onChange={setField('projectionYears')}
            />
          </div>

          <div className="py-4">
            <p className="text-overline text-brand-teal400 font-bold mb-4">Income</p>
            <SimulatorSlider
              label="Monthly Salary"
              description="After-tax monthly income from salary"
              value={inputs.monthlySalary}
              min={0}
              max={1000000}
              step={1000}
              unit="₹"
              onChange={setField('monthlySalary')}
            />
            <SimulatorSlider
              label="Annual Bonus"
              description="Yearly bonus or additional income"
              value={inputs.annualBonus}
              min={0}
              max={2000000}
              step={5000}
              unit="₹"
              onChange={setField('annualBonus')}
            />
            <SimulatorSlider
              label="Expected Salary Growth"
              description="Annual salary growth rate"
              value={inputs.expectedSalaryGrowth}
              min={0}
              max={30}
              unit="%"
              onChange={setField('expectedSalaryGrowth')}
            />
            <SimulatorSlider
              label="Tax Rate"
              description="Effective tax rate on total income"
              value={inputs.taxRate}
              min={0}
              max={45}
              unit="%"
              onChange={setField('taxRate')}
            />
          </div>

          <div className="py-4">
            <p className="text-overline text-brand-teal400 font-bold mb-4">Expenses</p>
            <SimulatorSlider
              label="Monthly Expenses"
              description="Average monthly spending"
              value={inputs.monthlyExpenses}
              min={0}
              max={1000000}
              step={1000}
              unit="₹"
              onChange={setField('monthlyExpenses')}
            />
            <SimulatorSlider
              label="Inflation Rate"
              description="Annual inflation on expenses"
              value={inputs.inflationRate}
              min={0}
              max={20}
              unit="%"
              onChange={setField('inflationRate')}
            />
          </div>

          <div className="py-4">
            <p className="text-overline text-brand-teal400 font-bold mb-4">Savings & Investments</p>
            <SimulatorSlider
              label="Monthly SIP"
              description="Systematic investment per month"
              value={inputs.monthlySIP}
              min={0}
              max={500000}
              step={1000}
              unit="₹"
              onChange={setField('monthlySIP')}
            />
            <SimulatorSlider
              label="Investment Return"
              description="Expected annual return on investments"
              value={inputs.investmentReturn}
              min={0}
              max={30}
              unit="%"
              onChange={setField('investmentReturn')}
            />
            <SimulatorSlider
              label="Emergency Fund Target"
              description="Months of expenses to keep in savings"
              value={inputs.emergencyFundMonths}
              min={0}
              max={24}
              unit="months"
              onChange={setField('emergencyFundMonths')}
            />
          </div>

          <div className="py-4">
            <p className="text-overline text-brand-teal400 font-bold mb-4">Debt</p>
            <SimulatorSlider
              label="Current Debt"
              description="Total outstanding debt principal"
              value={inputs.currentDebt}
              min={0}
              max={10000000}
              step={10000}
              unit="₹"
              onChange={setField('currentDebt')}
            />
            <SimulatorSlider
              label="Monthly EMI"
              description="Total monthly EMI payments"
              value={inputs.monthlyEMI}
              min={0}
              max={500000}
              step={1000}
              unit="₹"
              onChange={setField('monthlyEMI')}
            />
            <SimulatorSlider
              label="Debt Interest Rate"
              description="Annual interest rate on outstanding debt"
              value={inputs.debtInterestRate}
              min={0}
              max={30}
              unit="%"
              onChange={setField('debtInterestRate')}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-16 md:p-24 flex flex-col gap-20">
        <section className="card p-20">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-overline text-text-tertiary font-bold">Net Worth Projection</h2>
            <span className="text-caption text-text-tertiary tabular-nums">
              Year 0 — Year {result.years.length - 1}
            </span>
          </div>
          <NetWorthChart years={result.years} />
          <div className="flex justify-between mt-8">
            <span className="text-caption text-text-tertiary tabular-nums">Year 0</span>
            <span className="text-caption text-text-tertiary tabular-nums">
              Year {result.years.length - 1}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {metrics.map((m) => (
            <div key={m.label} className="card-sm p-14 flex flex-col gap-6">
              <span className="text-caption text-text-tertiary">{m.label}</span>
              <span className="text-body-lg font-bold text-text-primary tabular-nums">{m.value}</span>
              <span className="text-caption text-text-tertiary">{m.sublabel}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <section className="card p-20 flex flex-col gap-16">
            <h2 className="text-overline text-text-tertiary font-bold">Health Score</h2>
            <div className="flex items-center justify-center">
              <ProgressRing
                value={healthBreakdown.score}
                size={180}
                strokeWidth={16}
                color={toneColor}
                label={String(healthBreakdown.score)}
                sublabel="Simulated Health"
              />
            </div>
            <div className="flex flex-col gap-6 mt-8">
              <p className="text-overline text-text-tertiary font-bold">8-Factor Breakdown</p>
              {healthBreakdown.factors.map((f) => (
                <div key={f.key} className="group relative">
                  <div className="flex items-center justify-between gap-8 py-6">
                    <div className="flex items-center gap-8 min-w-0">
                      <span className="text-body-sm text-text-secondary truncate">{f.label}</span>
                      <span className="text-caption text-text-tertiary shrink-0">wt {f.weight}%</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="h-6 w-80 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
                        <div
                          className="h-full rounded-full transition-all duration-standard"
                          style={{ width: `${Math.min(100, f.value)}%`, backgroundColor: CHART_ACCENTS.income }}
                        />
                      </div>
                      <span className="tabular-nums text-body-sm font-semibold text-text-primary w-32 text-right">
                        {f.value.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="absolute left-0 bottom-full mb-4 hidden group-hover:block z-10">
                    <div className="card-sm p-10 max-w-[240px] shadow-lg">
                      <p className="text-body-sm font-medium text-text-primary mb-2">{f.label}</p>
                      <p className="text-caption text-text-secondary">{f.description}</p>
                      <p className="text-caption text-brand-teal400 mt-2">
                        Contributes {f.weight}% ({f.contribution.toFixed(1)} pts)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-20 flex flex-col gap-16">
            <h2 className="text-overline text-text-tertiary font-bold">Year-by-Year Projection</h2>
            <div className="overflow-auto max-h-[480px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="text-caption text-text-tertiary font-medium">
                    <th className="py-8 pr-8">Year</th>
                    <th className="py-8 pr-8 text-right">Age</th>
                    <th className="py-8 pr-8 text-right">Net Worth</th>
                    <th className="py-8 pr-8 text-right">Savings</th>
                    <th className="py-8 pr-8 text-right">Investments</th>
                    <th className="py-8 pr-8 text-right">Debt</th>
                    <th className="py-8 pr-8 text-right">Income</th>
                    <th className="py-8 pr-8 text-right">Savings %</th>
                    <th className="py-8 text-right">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {result.years.map((y) => (
                    <tr key={y.year} className="border-t border-border-subtle text-caption tabular-nums">
                      <td className="py-6 pr-8 text-text-primary font-medium">{y.year}</td>
                      <td className="py-6 pr-8 text-right text-text-secondary">{y.age}</td>
                      <td className="py-6 pr-8 text-right font-semibold text-text-primary">
                        {formatAmount(y.netWorth, settings?.currency ?? 'INR')}
                      </td>
                      <td className="py-6 pr-8 text-right text-text-secondary">
                        {formatAmount(y.savings, settings?.currency ?? 'INR')}
                      </td>
                      <td className="py-6 pr-8 text-right text-text-secondary">
                        {formatAmount(y.investments, settings?.currency ?? 'INR')}
                      </td>
                      <td className="py-6 pr-8 text-right text-expense">
                        {y.debt > 0 ? formatAmount(y.debt, settings?.currency ?? 'INR') : '-'}
                      </td>
                      <td className="py-6 pr-8 text-right text-text-secondary">
                        {formatAmount(y.income, settings?.currency ?? 'INR')}
                      </td>
                      <td className="py-6 pr-8 text-right text-text-secondary">{y.savingsRate}%</td>
                      <td className={cn(
                        'py-6 text-right font-semibold',
                        y.healthScore >= 70 ? 'text-income' : y.healthScore >= 40 ? 'text-gold-500' : 'text-expense'
                      )}>
                        {y.healthScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="card p-20 flex flex-col gap-12">
          <h2 className="text-overline text-text-tertiary font-bold">Savings Rate Gauge</h2>
          <div className="flex items-center gap-16">
            <div className="flex-1">
              <div className="h-24 rounded-full bg-border-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-teal400 transition-all duration-standard"
                  style={{ width: `${Math.min(100, latestYear.savingsRate)}%` }}
                />
              </div>
            </div>
            <span className="tabular-nums text-h3 font-bold text-text-primary">
              {latestYear.savingsRate}%
            </span>
          </div>
          <div className="flex justify-between text-caption text-text-tertiary">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </section>
      </div>
    </div>
  )
}
