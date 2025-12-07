/**
 * Receipt Service
 * 
 * Handles receipt generation and payment allocation
 */

import {
    Invoice,
    Payment,
    Receipt,
    ReceiptItem
} from '../types';
import {
    validateNonEmptyString,
    validateDate
} from '../utils/validation';
import { roundToTwoDecimals } from '../utils/calculations';
import {
    generateId,
    generateReceiptNumber
} from '../utils/generators';

/**
 * Generates a receipt for a payment
 * @param payment - The payment to generate a receipt for
 * @param invoice - The invoice the payment was applied to
 * @returns A receipt object
 */
export function generateReceipt(
    payment: Payment,
    invoice: Invoice
): Receipt {
    // Validate inputs
    validateNonEmptyString(payment.id, 'Payment ID');
    validateNonEmptyString(invoice.id, 'Invoice ID');
    validateDate(payment.paymentDate, 'Payment date');

    // Verify payment is for this invoice
    if (payment.invoiceId !== invoice.id) {
        throw new Error('Payment invoice ID does not match provided invoice');
    }

    // Calculate payment allocation across invoice items
    const receiptItems = allocatePaymentToItems(payment.amount, invoice);

    // Create receipt
    const receipt: Receipt = {
        id: generateId(),
        paymentId: payment.id,
        invoiceId: invoice.id,
        receiptNumber: generateReceiptNumber(payment.paymentDate),
        receiptDate: payment.paymentDate,
        totalPaid: payment.amount,
        remainingBalance: invoice.outstandingAmount,
        paymentMethod: payment.paymentMethod,
        paymentReference: payment.referenceNumber,
        items: receiptItems
    };

    return receipt;
}

/**
 * Allocates a payment amount across invoice items proportionally
 * @param paymentAmount - The amount being paid
 * @param invoice - The invoice being paid
 * @returns Array of receipt items showing allocation
 */
function allocatePaymentToItems(
    paymentAmount: number,
    invoice: Invoice
): ReceiptItem[] {
    // If payment covers the full invoice or more, allocate full amounts
    if (paymentAmount >= invoice.totalAmount) {
        return invoice.items.map(item => ({
            description: item.description,
            amountAllocated: item.lineTotal
        }));
    }

    // For partial payments, allocate proportionally
    const allocationRatio = paymentAmount / invoice.totalAmount;

    const receiptItems: ReceiptItem[] = invoice.items.map((item, index) => {
        let allocated: number;

        // For the last item, allocate the remaining amount to avoid rounding errors
        if (index === invoice.items.length - 1) {
            const previousAllocations = invoice.items
                .slice(0, index)
                .reduce((sum, prevItem) => {
                    return sum + roundToTwoDecimals(prevItem.lineTotal * allocationRatio);
                }, 0);
            allocated = roundToTwoDecimals(paymentAmount - previousAllocations);
        } else {
            allocated = roundToTwoDecimals(item.lineTotal * allocationRatio);
        }

        return {
            description: item.description,
            amountAllocated: allocated
        };
    });

    return receiptItems;
}

/**
 * Formats a receipt as a string for display
 * @param receipt - The receipt to format
 * @param invoice - The invoice for additional context
 * @returns Formatted receipt string
 */
export function formatReceipt(receipt: Receipt, invoice: Invoice): string {
    const lines: string[] = [];

    lines.push('='.repeat(50));
    lines.push('PAYMENT RECEIPT');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Receipt Number: ${receipt.receiptNumber}`);
    lines.push(`Receipt Date: ${receipt.receiptDate.toLocaleDateString()}`);
    lines.push(`Invoice Number: ${invoice.invoiceNumber}`);
    lines.push(`Payment Reference: ${receipt.paymentReference}`);
    lines.push(`Payment Method: ${receipt.paymentMethod}`);
    lines.push('');
    lines.push('-'.repeat(50));
    lines.push('PAYMENT ALLOCATION');
    lines.push('-'.repeat(50));

    receipt.items.forEach(item => {
        lines.push(`${item.description.padEnd(35)} $${item.amountAllocated.toFixed(2).padStart(10)}`);
    });

    lines.push('-'.repeat(50));
    lines.push(`Total Paid:${' '.repeat(28)} $${receipt.totalPaid.toFixed(2).padStart(10)}`);
    lines.push(`Remaining Balance:${' '.repeat(21)} $${receipt.remainingBalance.toFixed(2).padStart(10)}`);
    lines.push('='.repeat(50));

    return lines.join('\n');
}
