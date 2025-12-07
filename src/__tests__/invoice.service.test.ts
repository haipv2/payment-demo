/**
 * Invoice Service Tests
 */

import {
    calculateInvoiceTotal,
    createInvoice,
    updateInvoiceStatus,
    InvoiceItemInput
} from '../services/invoice.service';
import { InvoiceStatus } from '../types';
import { ValidationError } from '../utils/errors';
import { resetCounters } from '../utils/generators';

describe('Invoice Service', () => {
    beforeEach(() => {
        resetCounters();
    });

    describe('calculateInvoiceTotal', () => {
        it('should calculate correct totals for basic invoice (Scenario 1)', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Monthly Fee', quantity: 1, unitPrice: 500.00 },
                { description: 'Activity Fee', quantity: 2, unitPrice: 25.50 }
            ];
            const taxRate = 0.07; // 7% GST

            const result = calculateInvoiceTotal(items, taxRate);

            // Subtotal: 500 + (2 * 25.50) = 551.00
            expect(result.subtotal).toBe(551.00);

            // Tax: 551.00 * 0.07 = 38.57
            expect(result.totalTax).toBe(38.57);

            // Total: 551.00 + 38.57 = 589.57
            expect(result.totalAmount).toBe(589.57);

            // Verify items
            expect(result.items).toHaveLength(2);
            expect(result.items[0].lineTotal).toBe(535.00); // 500 + 35 tax
            expect(result.items[1].lineTotal).toBe(54.57);  // 51 + 3.57 tax
        });

        it('should handle single item invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service Fee', quantity: 1, unitPrice: 100.00 }
            ];
            const taxRate = 0.07;

            const result = calculateInvoiceTotal(items, taxRate);

            expect(result.subtotal).toBe(100.00);
            expect(result.totalTax).toBe(7.00);
            expect(result.totalAmount).toBe(107.00);
        });

        it('should handle zero tax rate', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service Fee', quantity: 1, unitPrice: 100.00 }
            ];
            const taxRate = 0;

            const result = calculateInvoiceTotal(items, taxRate);

            expect(result.subtotal).toBe(100.00);
            expect(result.totalTax).toBe(0);
            expect(result.totalAmount).toBe(100.00);
        });

        it('should handle fractional quantities', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Hourly Rate', quantity: 2.5, unitPrice: 50.00 }
            ];
            const taxRate = 0.07;

            const result = calculateInvoiceTotal(items, taxRate);

            expect(result.subtotal).toBe(125.00);
            expect(result.totalTax).toBe(8.75);
            expect(result.totalAmount).toBe(133.75);
        });

        it('should throw error for empty items array', () => {
            expect(() => {
                calculateInvoiceTotal([], 0.07);
            }).toThrow(ValidationError);
        });

        it('should throw error for negative unit price', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item', quantity: 1, unitPrice: -10 }
            ];

            expect(() => {
                calculateInvoiceTotal(items, 0.07);
            }).toThrow(ValidationError);
        });

        it('should throw error for negative quantity', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item', quantity: -1, unitPrice: 10 }
            ];

            expect(() => {
                calculateInvoiceTotal(items, 0.07);
            }).toThrow(ValidationError);
        });

        it('should throw error for zero quantity', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item', quantity: 0, unitPrice: 10 }
            ];

            expect(() => {
                calculateInvoiceTotal(items, 0.07);
            }).toThrow(ValidationError);
        });

        it('should throw error for invalid tax rate', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Item', quantity: 1, unitPrice: 10 }
            ];

            expect(() => {
                calculateInvoiceTotal(items, -0.07);
            }).toThrow(ValidationError);

            expect(() => {
                calculateInvoiceTotal(items, 1.5);
            }).toThrow(ValidationError);
        });

        it('should throw error for empty description', () => {
            const items: InvoiceItemInput[] = [
                { description: '', quantity: 1, unitPrice: 10 }
            ];

            expect(() => {
                calculateInvoiceTotal(items, 0.07);
            }).toThrow(ValidationError);
        });

        it('should handle very large amounts', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Large Item', quantity: 1, unitPrice: 450000.00 }
            ];
            const taxRate = 0.07;

            const result = calculateInvoiceTotal(items, taxRate);

            expect(result.subtotal).toBe(450000.00);
            expect(result.totalTax).toBe(31500.00);
            expect(result.totalAmount).toBe(481500.00);
        });

        it('should handle zero unit price', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Free Item', quantity: 1, unitPrice: 0 }
            ];
            const taxRate = 0.07;

            const result = calculateInvoiceTotal(items, taxRate);

            expect(result.subtotal).toBe(0);
            expect(result.totalTax).toBe(0);
            expect(result.totalAmount).toBe(0);
        });
    });

    describe('createInvoice', () => {
        it('should create invoice with correct structure', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const taxRate = 0.07;
            const invoiceDate = new Date('2023-12-07');

            const invoice = createInvoice(items, taxRate, invoiceDate);

            expect(invoice.id).toBeDefined();
            expect(invoice.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
            expect(invoice.invoiceDate).toEqual(invoiceDate);
            expect(invoice.status).toBe(InvoiceStatus.PENDING);
            expect(invoice.outstandingAmount).toBe(invoice.totalAmount);
            expect(invoice.items).toHaveLength(1);
        });

        it('should generate unique invoice numbers', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const taxRate = 0.07;

            const invoice1 = createInvoice(items, taxRate);
            const invoice2 = createInvoice(items, taxRate);

            expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
        });
    });

    describe('updateInvoiceStatus', () => {
        it('should set status to PENDING for unpaid invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0.07);

            const updated = updateInvoiceStatus(invoice);
            expect(updated.status).toBe(InvoiceStatus.PENDING);
        });

        it('should set status to PARTIALLY_PAID for partial payment', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0.07);
            invoice.outstandingAmount = 50.00;

            const updated = updateInvoiceStatus(invoice);
            expect(updated.status).toBe(InvoiceStatus.PARTIALLY_PAID);
        });

        it('should set status to PAID for fully paid invoice', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0.07);
            invoice.outstandingAmount = 0;

            const updated = updateInvoiceStatus(invoice);
            expect(updated.status).toBe(InvoiceStatus.PAID);
        });

        it('should set status to OVERPAID for overpayment', () => {
            const items: InvoiceItemInput[] = [
                { description: 'Service', quantity: 1, unitPrice: 100.00 }
            ];
            const invoice = createInvoice(items, 0.07);
            invoice.outstandingAmount = -10.00;

            const updated = updateInvoiceStatus(invoice);
            expect(updated.status).toBe(InvoiceStatus.OVERPAID);
        });
    });
});
