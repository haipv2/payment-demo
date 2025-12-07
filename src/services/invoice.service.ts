/**
 * Invoice Service
 * 
 * Handles invoice creation and calculation logic
 */

import {
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    InvoiceTotals
} from '../types';
import {
    validateNonEmptyArray,
    validatePositiveNumber,
    validateNonNegativeNumber,
    validateTaxRate,
    validateNonEmptyString,
    validateDate,
    validateInvoiceAmount,
    validateLineItemAmount
} from '../utils/validation';
import {
    roundToTwoDecimals,
    calculateTaxAmount,
    sumWithRounding
} from '../utils/calculations';
import {
    generateId,
    generateInvoiceNumber
} from '../utils/generators';

/**
 * Input for creating an invoice item
 */
export interface InvoiceItemInput {
    description: string;
    quantity: number;
    unitPrice: number;
}

/**
 * Calculates invoice totals from line items
 * @param items - Array of invoice item inputs
 * @param taxRate - Tax rate to apply (e.g., 0.07 for 7%)
 * @returns Calculated invoice totals with processed items
 */
export function calculateInvoiceTotal(
    items: InvoiceItemInput[],
    taxRate: number
): InvoiceTotals {
    // Validate inputs
    validateNonEmptyArray(items, 'Invoice items');
    validateTaxRate(taxRate);

    // Process each item
    const processedItems: InvoiceItem[] = items.map((item) => {
        // Validate item fields
        validateNonEmptyString(item.description, 'Item description');
        validatePositiveNumber(item.quantity, 'Item quantity');
        validateNonNegativeNumber(item.unitPrice, 'Item unit price');

        // Calculate line total before tax
        const lineSubtotal = roundToTwoDecimals(item.quantity * item.unitPrice);

        // Validate line item amount against configured limit
        validateLineItemAmount(lineSubtotal);

        // Calculate tax for this line
        const taxAmount = calculateTaxAmount(lineSubtotal, taxRate);

        // Calculate total for this line (subtotal + tax)
        const lineTotal = roundToTwoDecimals(lineSubtotal + taxAmount);

        return {
            id: generateId(),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal,
            taxRate,
            taxAmount
        };
    });

    // Calculate totals
    const subtotal = sumWithRounding(
        processedItems.map(item => roundToTwoDecimals(item.quantity * item.unitPrice))
    );
    const totalTax = sumWithRounding(processedItems.map(item => item.taxAmount));
    const totalAmount = roundToTwoDecimals(subtotal + totalTax);

    // Validate total invoice amount against configured limit
    validateInvoiceAmount(totalAmount);

    return {
        subtotal,
        totalTax,
        totalAmount,
        items: processedItems
    };
}

/**
 * Creates a new invoice
 * @param items - Array of invoice item inputs
 * @param taxRate - Tax rate to apply (e.g., 0.07 for 7%)
 * @param invoiceDate - Date of the invoice (defaults to current date)
 * @returns A new invoice object
 */
export function createInvoice(
    items: InvoiceItemInput[],
    taxRate: number,
    invoiceDate: Date = new Date()
): Invoice {
    // Validate date
    validateDate(invoiceDate, 'Invoice date');

    // Calculate totals
    const totals = calculateInvoiceTotal(items, taxRate);

    // Create invoice
    const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateInvoiceNumber(invoiceDate),
        invoiceDate,
        items: totals.items,
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        totalTax: totals.totalTax,
        outstandingAmount: totals.totalAmount,
        status: InvoiceStatus.PENDING
    };

    return invoice;
}

/**
 * Updates the status of an invoice based on its outstanding amount
 * @param invoice - The invoice to update
 * @returns The updated invoice
 */
export function updateInvoiceStatus(invoice: Invoice): Invoice {
    let newStatus: InvoiceStatus;

    if (invoice.outstandingAmount > 0 && invoice.outstandingAmount < invoice.totalAmount) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
    } else if (invoice.outstandingAmount === 0) {
        newStatus = InvoiceStatus.PAID;
    } else if (invoice.outstandingAmount < 0) {
        newStatus = InvoiceStatus.OVERPAID;
    } else {
        newStatus = InvoiceStatus.PENDING;
    }

    return {
        ...invoice,
        status: newStatus
    };
}

/**
 * Gets a copy of an invoice (for immutability)
 * @param invoice - The invoice to copy
 * @returns A deep copy of the invoice
 */
export function cloneInvoice(invoice: Invoice): Invoice {
    return {
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        items: invoice.items.map(item => ({ ...item }))
    };
}
