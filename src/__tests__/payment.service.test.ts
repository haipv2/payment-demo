/**
 * Payment Service Tests
 */

import {
    processPayment,
    validatePaymentAmount,
    calculateTotalPaid
} from '../services/payment.service';
import { createInvoice, InvoiceItemInput } from '../services/invoice.service';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '../types';
import { resetCounters } from '../utils/generators';
import {getTaxRate} from "../config";

describe('Payment Service', () => {
    beforeEach(() => {
        resetCounters();
    });

    const taxRate = getTaxRate();
    
    describe('processPayment', () => {
        it('should process full payment successfully', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);
            const paymentAmount = 107.00; // Full amount

            const result = processPayment(
                invoice,
                paymentAmount,
                PaymentMethod.CASH
            );

            expect(result.success).toBe(true);
            expect(result.payment.amount).toBe(107.00);
            expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
            expect(result.invoice.outstandingAmount).toBe(0);
            expect(result.invoice.status).toBe(InvoiceStatus.PAID);
        });

        it('should process partial payment successfully (Scenario 2 - part 1)', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            const invoice = createInvoice(items, 0); // No tax for simplicity
            const paymentAmount = 300.00;

            const result = processPayment(
                invoice,
                paymentAmount,
                PaymentMethod.CASH
            );

            expect(result.success).toBe(true);
            expect(result.invoice.outstandingAmount).toBe(700.00);
            expect(result.invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
        });

        it('should handle overpayment (Scenario 2 - part 2)', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            let invoice = createInvoice(items, 0);

            // First payment
            const result1 = processPayment(invoice, 300.00, PaymentMethod.CASH);
            invoice = result1.invoice;
            expect(invoice.outstandingAmount).toBe(700.00);

            // Second payment (overpayment)
            const result2 = processPayment(invoice, 750.00, PaymentMethod.BANK_TRANSFER);

            expect(result2.success).toBe(true);
            expect(result2.invoice.outstandingAmount).toBe(-50.00);
            expect(result2.invoice.status).toBe(InvoiceStatus.OVERPAID);
        });

        it('should handle multiple payments for same invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            let invoice = createInvoice(items, 0);

            // Payment 1
            const result1 = processPayment(invoice, 250.00, PaymentMethod.CASH);
            invoice = result1.invoice;
            expect(invoice.outstandingAmount).toBe(750.00);

            // Payment 2
            const result2 = processPayment(invoice, 250.00, PaymentMethod.CASH);
            invoice = result2.invoice;
            expect(invoice.outstandingAmount).toBe(500.00);

            // Payment 3
            const result3 = processPayment(invoice, 500.00, PaymentMethod.BANK_TRANSFER);
            invoice = result3.invoice;
            expect(invoice.outstandingAmount).toBe(0);
            expect(invoice.status).toBe(InvoiceStatus.PAID);
        });

        it('should reject negative payment amount', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const result = processPayment(invoice, -10, PaymentMethod.CASH);

            expect(result.success).toBe(false);
            expect(result.payment.status).toBe(PaymentStatus.FAILED);
            expect(result.error).toBeDefined();
        });

        it('should reject zero payment amount', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const result = processPayment(invoice, 0, PaymentMethod.CASH);

            expect(result.success).toBe(false);
            expect(result.payment.status).toBe(PaymentStatus.FAILED);
        });

        it('should reject payment for cancelled invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);
            invoice.status = InvoiceStatus.CANCELLED;

            const result = processPayment(invoice, 107.00, PaymentMethod.CASH);

            expect(result.success).toBe(false);
            expect(result.error).toContain('cancelled');
        });

        it('should generate unique payment reference numbers', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const result1 = processPayment(invoice, 50.00, PaymentMethod.CASH);
            const result2 = processPayment(result1.invoice, 57.00, PaymentMethod.CASH);

            expect(result1.payment.referenceNumber).not.toBe(result2.payment.referenceNumber);
        });

        it('should support all payment methods', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];

            const methods = [
                PaymentMethod.CASH,
                PaymentMethod.BANK_TRANSFER
            ];

            methods.forEach(method => {
                const invoice = createInvoice(items, taxRate);
                const result = processPayment(invoice, 107.00, method);
                expect(result.success).toBe(true);
                expect(result.payment.paymentMethod).toBe(method);
            });
        });


        it('should handle very large payment amounts', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Large Service', quantity: 1, unitPrice: 450000.00 }
            ];
            const invoice = createInvoice(items, 0);

            const result = processPayment(invoice, 450000.00, PaymentMethod.BANK_TRANSFER);

            expect(result.success).toBe(true);
            expect(result.invoice.outstandingAmount).toBe(0);
        });
    });

    describe('validatePaymentAmount', () => {
        it('should validate acceptable payment amount', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const validation = validatePaymentAmount(invoice, 50.00);

            expect(validation.valid).toBe(true);
            expect(validation.message).toBeUndefined();
        });

        it('should warn about overpayment', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const validation = validatePaymentAmount(invoice, 200.00);

            expect(validation.valid).toBe(true);
            expect(validation.message).toContain('overpayment');
        });

        it('should reject negative amount', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const validation = validatePaymentAmount(invoice, -10);

            expect(validation.valid).toBe(false);
            expect(validation.message).toBeDefined();
        });
    });

    describe('calculateTotalPaid', () => {
        it('should calculate total from multiple payments', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            let invoice = createInvoice(items, 0);

            const result1 = processPayment(invoice, 300.00, PaymentMethod.CASH);
            const result2 = processPayment(result1.invoice, 400.00, PaymentMethod.CASH);
            const result3 = processPayment(result2.invoice, 300.00, PaymentMethod.CASH);

            const payments = [result1.payment, result2.payment, result3.payment];
            const total = calculateTotalPaid(payments);

            expect(total).toBe(1000.00);
        });

        it('should exclude failed payments from total', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0);

            const result1 = processPayment(invoice, 50.00, PaymentMethod.CASH);
            const result2 = processPayment(invoice, -10, PaymentMethod.CASH); // Failed

            const payments = [result1.payment, result2.payment];
            const total = calculateTotalPaid(payments);

            expect(total).toBe(50.00);
        });
    });
});
