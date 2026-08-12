/**
 * Shared stored-date helpers. `transactionDate` is persisted in two shapes —
 * write paths use `new Date().toISOString()` (full `yyyy-mm-ddTHH:mm:ss.sssZ`)
 * while tests and some historical rows use plain `yyyy-mm-dd` keys. Every
 * range/period comparison must normalize through these helpers: the older
 * `${dateStr}T00:00:00` pattern produced `NaN` (always-false comparisons) for
 * full ISO timestamps, silently hiding real transactions from Analytics,
 * Insights, and Reports.
 */

/** Reduce any stored `transactionDate` to its `yyyy-mm-dd` key. */
export function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10)
}

/** Parse a stored `transactionDate` as a local-midnight `Date` — never `NaN`,
 * regardless of which stored shape it is. */
export function startOfStoredDate(dateStr: string): Date {
  return new Date(`${toDateKey(dateStr)}T00:00:00`)
}

/** Local `yyyy-mm-dd` key for a real `Date` — use this (not
 * `toISOString().slice(0, 10)`) when the day must not be shifted by the
 * UTC offset. */
export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Is the stored date within the half-open range `[start, end)`? */
export function inRange(dateStr: string, start: Date, end: Date): boolean {
  const t = startOfStoredDate(dateStr).getTime()
  return t >= start.getTime() && t < end.getTime()
}
