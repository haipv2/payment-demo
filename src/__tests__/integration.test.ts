/**
 * Integration Tests
 * 
 * Tests complete payment flows from invoice creation to receipt generation
 */

import { createInvoice, InvoiceItemInput } from '../services/invoice.service';
import { processPayment } from '../services/payment.service';
import { generateReceipt } from '../services/receipt.service';
import { PaymentMethod, InvoiceStatus } from '../types';
import { resetCounters } from '../utils/generators';
import {getTaxRate} from "../config";

describe('Integration Tests', () => {
    beforeEach(() => {
        resetCounters();
    });
    const taxRate = getTaxRate();

    describe('Complete Payment Flow', () => {

        it('should handle complete flow: invoice → payment → receipt', () => {
            // 1. Create invoice
            const items: InvoiceItemInput[] = [
                { description: 'Monthly Fee', quantity: 1, unitPrice: 500.00 },
                { description: 'Activity Fee', quantity: 2, unitPrice: 25.50 }
            ];
            const invoice = createInvoice(items, taxRate);

            expect(invoice.totalAmount).toBe(589.57);
            expect(invoice.status).toBe(InvoiceStatus.PENDING);

            // 2. Process payment
            const paymentResult = processPayment(invoice, 589.57, PaymentMethod.CASH);

            expect(paymentResult.success).toBe(true);
            expect(paymentResult.invoice.status).toBe(InvoiceStatus.PAID);
            expect(paymentResult.invoice.outstandingAmount).toBe(0);

            // 3. Generate receipt
            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            expect(receipt.totalPaid).toBe(589.57);
            expect(receipt.remainingBalance).toBe(0);
            expect(receipt.items).toHaveLength(2);
        });

        it('should handle multiple partial payments flow', () => {
            // Create invoice
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            let invoice = createInvoice(items, 0);

            // First payment
            const payment1 = processPayment(invoice, 300.00, PaymentMethod.CASH);
            expect(payment1.success).toBe(true);
            expect(payment1.invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
            expect(payment1.invoice.outstandingAmount).toBe(700.00);

            const receipt1 = generateReceipt(payment1.payment, payment1.invoice);
            expect(receipt1.totalPaid).toBe(300.00);
            expect(receipt1.remainingBalance).toBe(700.00);

            // Second payment
            const payment2 = processPayment(payment1.invoice, 400.00, PaymentMethod.BANK_TRANSFER);
            expect(payment2.success).toBe(true);
            expect(payment2.invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
            expect(payment2.invoice.outstandingAmount).toBe(300.00);

            const receipt2 = generateReceipt(payment2.payment, payment2.invoice);
            expect(receipt2.totalPaid).toBe(400.00);
            expect(receipt2.remainingBalance).toBe(300.00);

            // Final payment
            const payment3 = processPayment(payment2.invoice, 300.00, PaymentMethod.CREDIT_CARD);
            expect(payment3.success).toBe(true);
            expect(payment3.invoice.status).toBe(InvoiceStatus.PAID);
            expect(payment3.invoice.outstandingAmount).toBe(0);

            const receipt3 = generateReceipt(payment3.payment, payment3.invoice);
            expect(receipt3.totalPaid).toBe(300.00);
            expect(receipt3.remainingBalance).toBe(0);
        });

        it('should handle overpayment scenario', () => {
            // Create invoice
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 1000.00 }
            ];
            let invoice = createInvoice(items, 0);

            // First payment
            const payment1 = processPayment(invoice, 300.00, PaymentMethod.CASH);
            expect(payment1.invoice.outstandingAmount).toBe(700.00);

            // Overpayment
            const payment2 = processPayment(payment1.invoice, 750.00, PaymentMethod.BANK_TRANSFER);
            expect(payment2.success).toBe(true);
            expect(payment2.invoice.status).toBe(InvoiceStatus.OVERPAID);
            expect(payment2.invoice.outstandingAmount).toBe(-50.00);

            const receipt2 = generateReceipt(payment2.payment, payment2.invoice);
            expect(receipt2.totalPaid).toBe(750.00);
            expect(receipt2.remainingBalance).toBe(-50.00);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero-amount invoice items', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Free Item', quantity: 1, unitPrice: 0 },
                { description: 'Paid Item', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            expect(invoice.subtotal).toBe(100.00);
            expect(invoice.totalAmount).toBe(107.00);

            const paymentResult = processPayment(invoice, 107.00, PaymentMethod.CASH);
            expect(paymentResult.success).toBe(true);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);
            expect(receipt.items).toHaveLength(2);
        });

        it('should handle very large amounts', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Large Service', quantity: 1, unitPrice: 450000.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const paymentResult = processPayment(invoice, invoice.totalAmount, PaymentMethod.BANK_TRANSFER);
            expect(paymentResult.success).toBe(true);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);
            expect(receipt.totalPaid).toBe(invoice.totalAmount);
        });

        it('should handle many small payments', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            let invoice = createInvoice(items, 0);

            // Make 10 payments of $10 each
            for (let i = 0; i < 10; i++) {
                const result = processPayment(invoice, 10.00, PaymentMethod.CASH);
                expect(result.success).toBe(true);
                invoice = result.invoice;
            }

            expect(invoice.outstandingAmount).toBe(0);
            expect(invoice.status).toBe(InvoiceStatus.PAID);
        });

        it('should maintain precision across multiple operations', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item 1', quantity: 3, unitPrice: 33.33 },
                { description: 'Item 2', quantity: 7, unitPrice: 14.29 }
            ];
            const invoice = createInvoice(items, taxRate);

            // Make multiple partial payments
            let currentInvoice = invoice;
            const payments = [50.00, 75.00, 100.00];

            payments.forEach(amount => {
                const result = processPayment(currentInvoice, amount, PaymentMethod.CASH);
                expect(result.success).toBe(true);
                currentInvoice = result.invoice;
            });

            // Verify calculations are consistent
            // Total payments = 225, invoice total should be around 206.97
            // So we expect overpayment
            const totalPaid = payments.reduce((sum, p) => sum + p, 0);
            const expectedOutstanding = currentInvoice.totalAmount - totalPaid;

            // Allow for small rounding differences (within 1 cent)
            expect(Math.abs(currentInvoice.outstandingAmount - expectedOutstanding)).toBeLessThan(0.01);
        });

        it('should handle invoice with single item and multiple payments', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Single Service', quantity: 1, unitPrice: 500.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const payment1 = processPayment(invoice, 200.00, PaymentMethod.CASH);
            const receipt1 = generateReceipt(payment1.payment, payment1.invoice);

            expect(receipt1.items).toHaveLength(1);
            expect(receipt1.items[0].amountAllocated).toBeLessThanOrEqual(200.00);

            const payment2 = processPayment(payment1.invoice, 335.00, PaymentMethod.CASH);
            const receipt2 = generateReceipt(payment2.payment, payment2.invoice);

            expect(receipt2.items).toHaveLength(1);
            expect(payment2.invoice.status).toBe(InvoiceStatus.PAID);
        });
    });
});
