/**
 * Payment Service
 * 
 * Handles payment processing and validation
 */

import {
    Invoice,
    Payment,
    PaymentMethod,
    PaymentStatus,
    PaymentResult
} from '../types';
import {
    validatePositiveNumber,
    validatePaymentMethod,
    validateNonEmptyString,
    validateDate,
    validatePaymentAmountLimits
} from '../utils/validation';
import { roundToTwoDecimals } from '../utils/calculations';
import {
    generateId,
    generatePaymentReference
} from '../utils/generators';
import { PaymentError } from '../utils/errors';
import { updateInvoiceStatus, cloneInvoice } from './invoice.service';

/**
 * Processes a payment against an invoice
 * @param invoice - The invoice to pay
 * @param paymentAmount - The amount being paid
 * @param paymentMethod - The method of payment
 * @param paymentDate - The date of payment (defaults to current date)
 * @returns Payment result with updated invoice and payment record
 */
export function processPayment(
    invoice: Invoice,
    paymentAmount: number,
    paymentMethod: PaymentMethod,
    paymentDate: Date = new Date()
): PaymentResult {
    try {
        // Validate inputs
        validatePositiveNumber(paymentAmount, 'Payment amount');
        validatePaymentAmountLimits(paymentAmount); // Check against configured limits
        validatePaymentMethod(paymentMethod);
        validateDate(paymentDate, 'Payment date');
        validateNonEmptyString(invoice.id, 'Invoice ID');

        // Check if invoice is cancelled
        if (invoice.status === 'CANCELLED') {
            throw new PaymentError('Cannot process payment for a cancelled invoice');
        }

        // Create payment record
        const payment: Payment = {
            id: generateId(),
            invoiceId: invoice.id,
            paymentMethod,
            amount: paymentAmount,
            paymentDate,
            referenceNumber: generatePaymentReference(paymentDate),
            status: PaymentStatus.COMPLETED
        };

        // Clone invoice to avoid mutation
        const updatedInvoice = cloneInvoice(invoice);

        // Update outstanding amount
        updatedInvoice.outstandingAmount = roundToTwoDecimals(
            updatedInvoice.outstandingAmount - paymentAmount
        );

        // Update invoice status based on new outstanding amount
        const finalInvoice = updateInvoiceStatus(updatedInvoice);

        return {
            success: true,
            payment,
            invoice: finalInvoice
        };
    } catch (error) {
        // Create failed payment record
        const failedPayment: Payment = {
            id: generateId(),
            invoiceId: invoice.id,
            paymentMethod,
            amount: paymentAmount,
            paymentDate,
            referenceNumber: generatePaymentReference(paymentDate),
            status: PaymentStatus.FAILED
        };

        return {
            success: false,
            payment: failedPayment,
            invoice,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Validates if a payment amount is acceptable for an invoice
 * Checks both configured limits and overpayment scenarios
 * @param invoice - The invoice to check
 * @param paymentAmount - The proposed payment amount
 * @returns Object with validation result and message
 */
export function validatePaymentAmount(
    invoice: Invoice,
    paymentAmount: number
): { valid: boolean; message?: string } {
    // First, validate basic positivity
    try {
        validatePositiveNumber(paymentAmount, 'Payment amount');
    } catch (error) {
        return {
            valid: false,
            message: error instanceof Error ? error.message : 'Invalid payment amount'
        };
    }

    // Second, check against configured limits (min/max)
    try {
        validatePaymentAmountLimits(paymentAmount);
    } catch (error) {
        return {
            valid: false,
            message: error instanceof Error ? error.message : 'Payment amount exceeds limits'
        };
    }

    // Finally, check for overpayment (warning, not error)
    if (paymentAmount > invoice.outstandingAmount) {
        return {
            valid: true,
            message: `Payment amount (${paymentAmount}) exceeds outstanding amount (${invoice.outstandingAmount}). This will result in an overpayment of ${roundToTwoDecimals(paymentAmount - invoice.outstandingAmount)}.`
        };
    }

    return { valid: true };
}

/**
 * Calculates the total amount paid on an invoice from multiple payments
 * @param payments - Array of payments for an invoice
 * @returns Total amount paid
 */
export function calculateTotalPaid(payments: Payment[]): number {
    const completedPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);
    const total = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    return roundToTwoDecimals(total);
}
