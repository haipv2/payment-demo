/**
 * Financial calculation utilities
 * 
 * These utilities ensure consistent decimal precision across all
 * financial calculations in the billing system.
 */

/**
 * Rounds a number to 2 decimal places for currency
 * @param value - The number to round
 * @returns The rounded number
 */
export function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Calculates the tax amount for a given amount and tax rate
 * @param amount - The base amount
 * @param taxRate - The tax rate (e.g., 0.07 for 7%)
 * @returns The tax amount rounded to 2 decimals
 */
export function calculateTaxAmount(amount: number, taxRate: number): number {
    return roundToTwoDecimals(amount * taxRate);
}



/**
 * Sums an array of numbers with proper rounding
 * @param values - Array of numbers to sum
 * @returns The sum rounded to 2 decimals
 */
export function sumWithRounding(values: number[]): number {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return roundToTwoDecimals(sum);
}
