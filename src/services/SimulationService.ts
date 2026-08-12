export interface SimulationInputs {
  currentAge: number
  monthlySalary: number
  monthlyExpenses: number
  inflationRate: number
  investmentReturn: number
  monthlySIP: number
  monthlyEMI: number
  annualBonus: number
  taxRate: number
  currentDebt: number
  debtInterestRate: number
  retirementAge: number
  expectedSalaryGrowth: number
  emergencyFundMonths: number
  projectionYears: number
}

export interface YearProjection {
  year: number
  age: number
  netWorth: number
  savings: number
  investments: number
  debt: number
  income: number
  expenses: number
  savingsRate: number
  emergencyFund: number
  healthScore: number
}

export interface SimulationResult {
  inputs: SimulationInputs
  years: YearProjection[]
  debtFreeYear: number | null
  fiYear: number | null
  finalNetWorth: number
  retirementCorpus: number
}

export interface HealthBreakdownFactor {
  key: string
  label: string
  weight: number
  value: number
  contribution: number
  description: string
}

export interface HealthBreakdown {
  score: number
  factors: HealthBreakdownFactor[]
}

const HEALTH_WEIGHTS = {
  savingsRate: 25,
  debtToIncome: 20,
  liquidity: 15,
  investmentRatio: 15,
  emergencyFund: 10,
  budgetDiscipline: 5,
  creditHealth: 5,
  goalProgress: 5,
}

const FACTOR_META: Record<string, { label: string; description: string }> = {
  savingsRate: {
    label: 'Savings Rate',
    description: 'Percentage of net income saved after expenses, SIP, and EMIs.',
  },
  debtToIncome: {
    label: 'Debt-to-Income',
    description: 'Ratio of annual EMI payments to annual net income. Lower is better.',
  },
  liquidity: {
    label: 'Liquidity',
    description: 'How many months of expenses your savings can cover.',
  },
  investmentRatio: {
    label: 'Investment Ratio',
    description: 'Percentage of total assets (savings + investments) that is invested.',
  },
  emergencyFund: {
    label: 'Emergency Fund',
    description: 'Coverage ratio of your emergency fund relative to target months.',
  },
  budgetDiscipline: {
    label: 'Budget Discipline',
    description: 'How well your annual expenses stay within your net income.',
  },
  creditHealth: {
    label: 'Credit Health',
    description: 'Total debt relative to annual income. Lower debt burden is healthier.',
  },
  goalProgress: {
    label: 'Goal Progress',
    description: 'Year-over-year net worth growth rate towards financial independence.',
  },
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

export function computeHealthScoreBreakdown(year: YearProjection, inputs: SimulationInputs): HealthBreakdown {
  const { savings, investments, debt, income, expenses, savingsRate } = year
  const nextIncome = income * (1 + inputs.expectedSalaryGrowth / 100)

  const savingsRateScore = clamp(savingsRate, 0, 100)

  const monthlyNetIncome = income / 12
  const dti = monthlyNetIncome > 0 ? (inputs.monthlyEMI / monthlyNetIncome) * 100 : 100
  const debtToIncomeScore = clamp(100 - dti, 0, 100)

  const monthlyExpenses = expenses / 12
  const monthsCovered = monthlyExpenses > 0 ? savings / monthlyExpenses : 100
  const liquidityScore = clamp((monthsCovered / Math.max(1, inputs.emergencyFundMonths)) * 100, 0, 100)

  const totalAssets = savings + investments
  const investmentRatioScore = clamp(totalAssets > 0 ? (investments / totalAssets) * 100 : 0, 0, 100)

  const emergencyFundScore = clamp((monthsCovered / Math.max(1, inputs.emergencyFundMonths)) * 100, 0, 100)

  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100
  const budgetDisciplineScore = clamp(100 - expenseRatio, 0, 100)

  const annualizedIncomeForDebt = income * 3
  const creditHealthScore = clamp(annualizedIncomeForDebt > 0 ? 100 - (debt / annualizedIncomeForDebt) * 100 : 0, 0, 100)

  const nextExpenses = monthlyExpenses * 12 * (1 + inputs.inflationRate / 100)
  const fireRatio = nextIncome > 0 ? (investments * (inputs.investmentReturn / 100)) / nextExpenses : 0
  const goalProgressScore = clamp(Math.min(100, fireRatio * 100), 0, 100)

  const raw: Array<{ key: string; label: string; weight: number; value: number; description: string }> = [
    { key: 'savingsRate', label: FACTOR_META.savingsRate.label, weight: HEALTH_WEIGHTS.savingsRate, value: Math.round(savingsRateScore * 10) / 10, description: FACTOR_META.savingsRate.description },
    { key: 'debtToIncome', label: FACTOR_META.debtToIncome.label, weight: HEALTH_WEIGHTS.debtToIncome, value: Math.round(debtToIncomeScore * 10) / 10, description: FACTOR_META.debtToIncome.description },
    { key: 'liquidity', label: FACTOR_META.liquidity.label, weight: HEALTH_WEIGHTS.liquidity, value: Math.round(liquidityScore * 10) / 10, description: FACTOR_META.liquidity.description },
    { key: 'investmentRatio', label: FACTOR_META.investmentRatio.label, weight: HEALTH_WEIGHTS.investmentRatio, value: Math.round(investmentRatioScore * 10) / 10, description: FACTOR_META.investmentRatio.description },
    { key: 'emergencyFund', label: FACTOR_META.emergencyFund.label, weight: HEALTH_WEIGHTS.emergencyFund, value: Math.round(emergencyFundScore * 10) / 10, description: FACTOR_META.emergencyFund.description },
    { key: 'budgetDiscipline', label: FACTOR_META.budgetDiscipline.label, weight: HEALTH_WEIGHTS.budgetDiscipline, value: Math.round(budgetDisciplineScore * 10) / 10, description: FACTOR_META.budgetDiscipline.description },
    { key: 'creditHealth', label: FACTOR_META.creditHealth.label, weight: HEALTH_WEIGHTS.creditHealth, value: Math.round(creditHealthScore * 10) / 10, description: FACTOR_META.creditHealth.description },
    { key: 'goalProgress', label: FACTOR_META.goalProgress.label, weight: HEALTH_WEIGHTS.goalProgress, value: Math.round(goalProgressScore * 10) / 10, description: FACTOR_META.goalProgress.description },
  ]

  const factors: HealthBreakdownFactor[] = raw.map((f) => ({
    ...f,
    contribution: (f.value * f.weight) / 100,
  }))

  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0))

  return { score, factors }
}

function defaultInputs(): SimulationInputs {
  return {
    currentAge: 35,
    monthlySalary: 0,
    monthlyExpenses: 0,
    inflationRate: 6,
    investmentReturn: 12,
    monthlySIP: 0,
    monthlyEMI: 0,
    annualBonus: 0,
    taxRate: 30,
    currentDebt: 0,
    debtInterestRate: 10,
    retirementAge: 60,
    expectedSalaryGrowth: 8,
    emergencyFundMonths: 6,
    projectionYears: 25,
  }
}

export function getDefaultInputs(params: {
  transactions: Array<{ type: string; amount: number; isDeleted?: boolean }>
  accounts: Array<{ currentBalance: number; isArchived?: boolean; type?: string }>
  loans: Array<{ currentBalance: number; status?: string; monthlyEMI: number; interestRate: number | null }>
  investments: Array<{ units: number; currentPricePerUnit: number; status?: string }>
  identity: { monthlyIncome: number } | null
}): SimulationInputs {
  const def = defaultInputs()

  const activeTxns = params.transactions.filter((t) => !t.isDeleted)
  const incomeTxns = activeTxns.filter((t) => t.type === 'income')
  const expenseTxns = activeTxns.filter((t) => t.type === 'expense')

  const recentIncomeTxns = incomeTxns.slice(-12)
  const recentExpenseTxns = expenseTxns.slice(-12)

  const avgMonthlyIncome = recentIncomeTxns.length > 0
    ? recentIncomeTxns.reduce((s, t) => s + t.amount, 0) / recentIncomeTxns.length
    : incomeTxns.length > 0
      ? incomeTxns.reduce((s, t) => s + t.amount, 0) / incomeTxns.length
      : params.identity?.monthlyIncome ?? 0

  const avgMonthlyExpense = recentExpenseTxns.length > 0
    ? recentExpenseTxns.reduce((s, t) => s + t.amount, 0) / recentExpenseTxns.length
    : expenseTxns.length > 0
      ? expenseTxns.reduce((s, t) => s + t.amount, 0) / expenseTxns.length
      : 0

  const activeLoans = params.loans.filter((l) => l.status === 'active')
  const totalDebt = activeLoans.reduce((s, l) => s + l.currentBalance, 0)
  const totalEMI = activeLoans.reduce((s, l) => s + l.monthlyEMI, 0)
  const avgDebtRate = activeLoans.filter((l) => l.interestRate !== null).length > 0
    ? activeLoans.filter((l) => l.interestRate !== null)
        .reduce((s, l) => s + (l.interestRate ?? 0), 0) /
      activeLoans.filter((l) => l.interestRate !== null).length
    : 10

  return {
    ...def,
    monthlySalary: Math.round(avgMonthlyIncome),
    monthlyExpenses: Math.round(avgMonthlyExpense),
    currentDebt: Math.round(totalDebt),
    monthlyEMI: Math.round(totalEMI),
    debtInterestRate: Math.round(avgDebtRate),
    annualBonus: 0,
    currentAge: 35,
    emergencyFundMonths: 6,
    monthlySIP: def.monthlySIP,
  }
}

export function runSimulation(inputs: SimulationInputs): SimulationResult {
  const years: YearProjection[] = []
  let savings = 0
  let investments = 0
  let debt = inputs.currentDebt
  let debtFreeYear: number | null = null
  let fiYear: number | null = null

  for (let y = 0; y <= inputs.projectionYears; y++) {
    const age = inputs.currentAge + y
    const salaryGrowthFactor = Math.pow(1 + inputs.expectedSalaryGrowth / 100, y)
    const inflationFactor = Math.pow(1 + inputs.inflationRate / 100, y)

    const annualSalary = inputs.monthlySalary * 12 * salaryGrowthFactor
    const grossIncome = annualSalary + inputs.annualBonus
    const netIncome = grossIncome * (1 - inputs.taxRate / 100)
    const yearlyExpenses = inputs.monthlyExpenses * 12 * inflationFactor
    const yearlySIP = inputs.monthlySIP * 12
    const yearlyEMI = inputs.monthlyEMI * 12

    const netCashFlow = netIncome - yearlyExpenses - yearlySIP - yearlyEMI
    savings = Math.max(0, savings + netCashFlow)

    investments = (investments + yearlySIP) * (1 + inputs.investmentReturn / 100)

    if (debt <= 0) {
      debt = 0
    } else {
      const interestAccrued = debt * (inputs.debtInterestRate / 100)
      debt = Math.max(0, debt + interestAccrued - yearlyEMI)
    }

    if (debtFreeYear === null && debt <= 0) {
      debtFreeYear = y
    }

    const netWorth = savings + investments - debt
    const savingsRate = netIncome > 0
      ? clamp(((netIncome - yearlyExpenses - yearlySIP - yearlyEMI) / netIncome) * 100, 0, 100)
      : 0

    const monthlyExpenses = yearlyExpenses / 12
    const emergencyFund = Math.min(savings, monthlyExpenses * inputs.emergencyFundMonths)

    const projection: YearProjection = {
      year: y,
      age,
      netWorth: Math.round(netWorth),
      savings: Math.round(savings),
      investments: Math.round(investments),
      debt: Math.round(debt),
      income: Math.round(netIncome),
      expenses: Math.round(yearlyExpenses),
      savingsRate: Math.round(savingsRate),
      emergencyFund: Math.round(emergencyFund),
      healthScore: 0,
    }

    const health = computeHealthScoreBreakdown(projection, inputs)
    projection.healthScore = health.score

    years.push(projection)

    if (fiYear === null && y > 0) {
      const passiveIncome = investments * (inputs.investmentReturn / 100)
      const nextYearExpenses = inputs.monthlyExpenses * 12 * Math.pow(1 + inputs.inflationRate / 100, y + 1)
      if (passiveIncome >= nextYearExpenses && debt <= 0) {
        fiYear = y
      }
    }
  }

  const finalYear = years[years.length - 1]
  const retirementYearIndex = Math.max(0, inputs.retirementAge - inputs.currentAge)
  const retirementYear = years[Math.min(retirementYearIndex, years.length - 1)]

  return {
    inputs,
    years,
    debtFreeYear,
    fiYear,
    finalNetWorth: finalYear.netWorth,
    retirementCorpus: retirementYear.investments,
  }
}

export const SimulationService = {
  runSimulation,
  getDefaultInputs,
  computeHealthScoreBreakdown,
}
