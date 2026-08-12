/** Display-only currency support — Mizan has no live exchange rates (it's
 * fully offline), so this never converts between currencies, only
 * formats. Covers the currencies an account is likely to actually be
 * opened in; anything outside this list falls back to showing the ISO
 * code itself rather than guessing a symbol. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
}

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS)

export function currencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] ?? `${currencyCode} `
}

/** Formats a whole-unit amount with the given currency's symbol — matches
 * the app-wide convention (no decimals, grouped digits) rather than
 * switching styles per currency. INR keeps the existing en-IN grouping
 * (lakh/crore-style comma placement); every other currency uses en-US
 * grouping (thousands), which is what a lakh-crore-unfamiliar reader would
 * expect for USD/EUR/etc. */
export function formatAmount(amount: number, currencyCode: string = 'INR'): string {
  const symbol = currencySymbol(currencyCode)
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US'
  return `${symbol}${Math.round(amount).toLocaleString(locale)}`
}

/** True when every account in the list shares the same currency — the
 * precondition for summing their balances into one meaningful number.
 * Empty/single-account lists are trivially "same". */
export function haveSameCurrency(currencies: string[]): boolean {
  return new Set(currencies).size <= 1
}
