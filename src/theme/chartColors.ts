/**
 * MIZAN Chart Color Palette
 *
 * Multi-series chart colors stay within the brand palette (§3.2 chart palette rule).
 * Priority order: teal-900, teal-400, gold-500, ink-300, teal-700, gold-300.
 */
export const CHART_ACCENTS = {
  /** #0F4D45 — primary brand teal, used first in category charts */
  primary: '#0F4D45',

  /** #62C3A7 — mint teal, success/income bars */
  income: '#62C3A7',

  /** #D9534F — coral red for expense */
  expense: '#D9534F',

  /** #D9A441 — warm gold for highlights */
  gold: '#D9A441',

  /** #1E7F72 — secondary teal for chart fills */
  secondary: '#1E7F72',

  /** #A4B2AD — muted neutral for comparison/reference */
  neutral: '#A4B2AD',

  /** #2F9A8A — info teal */
  info: '#2F9A8A',

  /** #E9C583 — light gold accent */
  goldLight: '#E9C583',

  /** #DDE5E2 — subtle border shade */
  border: '#DDE5E2',
}

/**
 * Category breakdown chart series colors — in-family palette, no rainbow.
 * Order: teal-900, teal-400, gold-500, ink-300, teal-700, gold-300, teal-800, gold-100
 */
export const SERIES_PALETTE = [
  '#0F4D45',
  '#62C3A7',
  '#D9A441',
  '#A4B2AD',
  '#1E7F72',
  '#E9C583',
  '#14655A',
  '#F7E9CE',
]
