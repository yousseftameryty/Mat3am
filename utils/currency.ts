// Currency configuration for Saudi Riyal (SAR)
export const CURRENCY_SYMBOL = '﷼' // Saudi Riyal symbol
export const CURRENCY_CODE = 'SAR'

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`
}

/**
 * Format currency without symbol (just number)
 */
export function formatCurrencyAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(2)
}
