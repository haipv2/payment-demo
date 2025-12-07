/**
 * ID and reference number generation utilities
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique UUID
 * @returns A UUID v4 string
 */
export function generateId(): string {
    return uuidv4();
}

/**
 * Formats a date as YYYYMMDD
 * @param date - The date to format
 * @returns Formatted date string
 */
function formatDateForReference(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Generates a sequential counter for reference numbers
 * In a real system, this would be stored in a database
 */
let invoiceCounter = 0;
let receiptCounter = 0;
let paymentCounter = 0;

/**
 * Generates a unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 * @param date - The invoice date (defaults to current date)
 * @returns A unique invoice number
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
    invoiceCounter++;
    const dateStr = formatDateForReference(date);
    const counter = String(invoiceCounter).padStart(4, '0');
    return `INV-${dateStr}-${counter}`;
}

/**
 * Generates a unique receipt number
 * Format: RCP-YYYYMMDD-XXXX
 * @param date - The receipt date (defaults to current date)
 * @returns A unique receipt number
 */
export function generateReceiptNumber(date: Date = new Date()): string {
    receiptCounter++;
    const dateStr = formatDateForReference(date);
    const counter = String(receiptCounter).padStart(4, '0');
    return `RCP-${dateStr}-${counter}`;
}

/**
 * Generates a unique payment reference number
 * Format: PAY-YYYYMMDD-XXXX
 * @param date - The payment date (defaults to current date)
 * @returns A unique payment reference number
 */
export function generatePaymentReference(date: Date = new Date()): string {
    paymentCounter++;
    const dateStr = formatDateForReference(date);
    const counter = String(paymentCounter).padStart(4, '0');
    return `PAY-${dateStr}-${counter}`;
}

/**
 * Resets all counters (useful for testing)
 */
export function resetCounters(): void {
    invoiceCounter = 0;
    receiptCounter = 0;
    paymentCounter = 0;
}
