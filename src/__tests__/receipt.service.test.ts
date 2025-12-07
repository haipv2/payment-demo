/**
 * Receipt Service Tests
 */

import { generateReceipt, formatReceipt } from '../services/receipt.service';
import { processPayment } from '../services/payment.service';
import { createInvoice, InvoiceItemInput } from '../services/invoice.service';
import { PaymentMethod } from '../types';
import { resetCounters } from '../utils/generators';
import {getTaxRate} from "../config";

describe('Receipt Service', () => {
    beforeEach(() => {
        resetCounters();
    });

    const taxRate = getTaxRate();
    
    describe('generateReceipt', () => {
        it('should generate receipt for full payment', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);
            const paymentResult = processPayment(invoice, 107.00, PaymentMethod.CASH);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            expect(receipt.id).toBeDefined();
            expect(receipt.receiptNumber).toMatch(/^RCP-\d{8}-\d{4}$/);
            expect(receipt.paymentId).toBe(paymentResult.payment.id);
            expect(receipt.invoiceId).toBe(invoice.id);
            expect(receipt.totalPaid).toBe(107.00);
            expect(receipt.remainingBalance).toBe(0);
            expect(receipt.paymentMethod).toBe(PaymentMethod.CASH);
            expect(receipt.items).toHaveLength(1);
        });

        it('should generate receipt for partial payment', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);
            const paymentResult = processPayment(invoice, 50.00, PaymentMethod.CASH);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            expect(receipt.totalPaid).toBe(50.00);
            expect(receipt.remainingBalance).toBe(57.00);
        });

        it('should allocate payment proportionally across multiple items', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item 1', quantity: 1, unitPrice: 100.00 },
                { description: 'Item 2', quantity: 1, unitPrice: 200.00 }
            ];
            const invoice = createInvoice(items, 0); // No tax for simplicity
            const paymentResult = processPayment(invoice, 150.00, PaymentMethod.CASH);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            // Payment should be allocated 1:2 ratio (100:200)
            expect(receipt.items).toHaveLength(2);
            expect(receipt.items[0].amountAllocated).toBe(50.00);  // 150 * (100/300)
            expect(receipt.items[1].amountAllocated).toBe(100.00); // 150 * (200/300)

            // Verify total allocation equals payment
            const totalAllocated = receipt.items.reduce((sum, item) => sum + item.amountAllocated, 0);
            expect(totalAllocated).toBe(150.00);
        });

        it('should allocate full amounts when payment covers invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item 1', quantity: 1, unitPrice: 100.00 },
                { description: 'Item 2', quantity: 1, unitPrice: 200.00 }
            ];
            const invoice = createInvoice(items, 0);
            const paymentResult = processPayment(invoice, 300.00, PaymentMethod.CASH);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            expect(receipt.items[0].amountAllocated).toBe(100.00);
            expect(receipt.items[1].amountAllocated).toBe(200.00);
        });

        it('should handle overpayment in receipt', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0);
            const paymentResult = processPayment(invoice, 150.00, PaymentMethod.CASH);

            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            expect(receipt.totalPaid).toBe(150.00);
            expect(receipt.remainingBalance).toBe(-50.00); // Overpayment
            expect(receipt.items[0].amountAllocated).toBe(100.00);
        });

        it('should throw error if payment invoice ID does not match', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice1 = createInvoice(items, taxRate);
            const invoice2 = createInvoice(items, taxRate);
            const paymentResult = processPayment(invoice1, 107.00, PaymentMethod.CASH);

            expect(() => {
                generateReceipt(paymentResult.payment, invoice2);
            }).toThrow();
        });

        it('should generate unique receipt numbers', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);

            const payment1 = processPayment(invoice, 50.00, PaymentMethod.CASH);
            const payment2 = processPayment(payment1.invoice, 57.00, PaymentMethod.CASH);

            const receipt1 = generateReceipt(payment1.payment, payment1.invoice);
            const receipt2 = generateReceipt(payment2.payment, payment2.invoice);

            expect(receipt1.receiptNumber).not.toBe(receipt2.receiptNumber);
        });
    });

    describe('formatReceipt', () => {
        it('should format receipt as readable string', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, taxRate);
            const paymentResult = processPayment(invoice, 107.00, PaymentMethod.CASH);
            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            const formatted = formatReceipt(receipt, invoice);

            expect(formatted).toContain('PAYMENT RECEIPT');
            expect(formatted).toContain(receipt.receiptNumber);
            expect(formatted).toContain(invoice.invoiceNumber);
            expect(formatted).toContain('Service');
            expect(formatted).toContain('107.00');
            expect(formatted).toContain('0.00'); // Remaining balance
        });

        it('should format receipt with multiple items', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item 1', quantity: 1, unitPrice: 100.00 },
                { description: 'Item 2', quantity: 1, unitPrice: 200.00 }
            ];
            const invoice = createInvoice(items, 0);
            const paymentResult = processPayment(invoice, 150.00, PaymentMethod.BANK_TRANSFER);
            const receipt = generateReceipt(paymentResult.payment, paymentResult.invoice);

            const formatted = formatReceipt(receipt, invoice);

            expect(formatted).toContain('Item 1');
            expect(formatted).toContain('Item 2');
            expect(formatted).toContain('BANK_TRANSFER');
        });
    });
});
