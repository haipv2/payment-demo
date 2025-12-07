/**
 * Example Usage of the Billing System
 * 
 * This file demonstrates how to use the billing system
 * for common scenarios.
 */

import {
    createInvoice,
    formatReceipt,
    generateReceipt,
    InvoiceItemInput,
    PaymentMethod,
    processPayment,
    resetCounters
} from '../index';
import {getTaxRate} from "../config";

// Reset counters for clean demo
resetCounters();

console.log('='.repeat(70));
console.log('START:: BILLING SYSTEM DEMO');
console.log('='.repeat(70));
console.log('');

// ============================================================================
// Example 1: Basic Invoice Calculation (from requirements)
// ============================================================================
console.log('Example 1: Basic Invoice Calculation');
console.log('-'.repeat(70));

const basicItems: InvoiceItemInput[] = [
    { description: 'Monthly Fee', quantity: 1, unitPrice: 500.00 },
    { description: 'Activity Fee', quantity: 2, unitPrice: 25.50 }
];
const taxRate = getTaxRate();

const invoice1 = createInvoice(basicItems, taxRate);

console.log(`Invoice Number: ${invoice1.invoiceNumber}`);
console.log(`Invoice Date: ${invoice1.invoiceDate.toLocaleDateString()}`);
console.log('');
console.log('Items:');
invoice1.items.forEach(item => {
    console.log(`  ${item.description}`);
    console.log(`    Quantity: ${item.quantity} × $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`);
    console.log(`    Tax (7%): $${item.taxAmount.toFixed(2)}`);
    console.log(`    Line Total: $${item.lineTotal.toFixed(2)}`);
});
console.log('');
console.log(`Subtotal: $${invoice1.subtotal.toFixed(2)}`);
console.log(`Tax (7%): $${invoice1.totalTax.toFixed(2)}`);
console.log(`Total: $${invoice1.totalAmount.toFixed(2)}`);
console.log(`Status: ${invoice1.status}`);
console.log('');

// ============================================================================
// Example 2: Partial Payment and Overpayment (from requirements)
// ============================================================================
console.log('Example 2: Partial Payment and Overpayment');
console.log('-'.repeat(70));

const invoice2Items: InvoiceItemInput[] = [
    { description: 'Service Package', quantity: 1, unitPrice: 1000.00 }
];
let invoice2 = createInvoice(invoice2Items, 0); // No tax for simplicity

console.log(`Initial Invoice Total: $${invoice2.totalAmount.toFixed(2)}`);
console.log(`Outstanding: $${invoice2.outstandingAmount.toFixed(2)}`);
console.log('');

// First payment: $300
console.log('Processing Payment 1: $300.00 (Cash)');
const payment1Result = processPayment(invoice2, 300.00, PaymentMethod.CASH);
invoice2 = payment1Result.invoice;

console.log(`  Payment Status: ${payment1Result.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Payment Reference: ${payment1Result.payment.referenceNumber}`);
console.log(`  Outstanding After Payment: $${invoice2.outstandingAmount.toFixed(2)}`);
console.log(`  Invoice Status: ${invoice2.status}`);
console.log('');

// Generate receipt for first payment
const receipt1 = generateReceipt(payment1Result.payment, invoice2);
console.log(`Receipt Generated: ${receipt1.receiptNumber}`);
console.log('');

// Second payment: $750 (overpayment)
console.log('Processing Payment 2: $750.00 (Bank Transfer)');
const payment2Result = processPayment(invoice2, 750.00, PaymentMethod.BANK_TRANSFER);
invoice2 = payment2Result.invoice;

console.log(`  Payment Status: ${payment2Result.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Payment Reference: ${payment2Result.payment.referenceNumber}`);
console.log(`  Outstanding After Payment: $${invoice2.outstandingAmount.toFixed(2)}`);
console.log(`  Invoice Status: ${invoice2.status}`);
console.log(`  Overpayment Amount: $${Math.abs(invoice2.outstandingAmount).toFixed(2)}`);
console.log('');

// Generate receipt for second payment
const receipt2 = generateReceipt(payment2Result.payment, invoice2);
console.log('Receipt for Payment 2:');
console.log(formatReceipt(receipt2, invoice2));
console.log('');

// ============================================================================
// Example 3: Multiple Payments to Completion
// ============================================================================
console.log('Example 3: Multiple Payments to Completion');
console.log('-'.repeat(70));

const invoice3Items: InvoiceItemInput[] = [
    { description: 'Consulting Services', quantity: 10, unitPrice: 150.00 },
    { description: 'Materials', quantity: 5, unitPrice: 50.00 }
];
let invoice3 = createInvoice(invoice3Items, taxRate);

console.log(`Invoice Total: $${invoice3.totalAmount.toFixed(2)}`);
console.log('');

const payments = [
    { amount: 500.00, method: PaymentMethod.CASH },
    { amount: 700.00, method: PaymentMethod.BANK_TRANSFER }
];

payments.forEach((payment, index) => {
    console.log(`Payment ${index + 1}: $${payment.amount.toFixed(2)} (${payment.method})`);
    const result = processPayment(invoice3, payment.amount, payment.method);
    invoice3 = result.invoice;

    console.log(`  Outstanding: $${invoice3.outstandingAmount.toFixed(2)}`);
    console.log(`  Status: ${invoice3.status}`);

    const receipt = generateReceipt(result.payment, invoice3);
    console.log(`  Receipt: ${receipt.receiptNumber}`);
    console.log('');
});

// ============================================================================
// Example 4: Edge Case - Zero Amount Item
// ============================================================================
console.log('Example 4: Edge Case - Zero Amount Item');
console.log('-'.repeat(70));

const invoice4Items: InvoiceItemInput[] = [
    { description: 'Free Promotional Item', quantity: 1, unitPrice: 0 },
    { description: 'Regular Item', quantity: 1, unitPrice: 100.00 }
];
const invoice4 = createInvoice(invoice4Items, taxRate);

console.log('Items:');
invoice4.items.forEach(item => {
    console.log(`  ${item.description}: $${item.lineTotal.toFixed(2)}`);
});
console.log(`Total: $${invoice4.totalAmount.toFixed(2)}`);
console.log('');

// ============================================================================
// Example 5: Error Handling
// ============================================================================
console.log('Example 5: Error Handling');
console.log('-'.repeat(70));

const invoice5Items: InvoiceItemInput[] = [
    { description: 'Service', quantity: 1, unitPrice: 100.00 }
];
const invoice5 = createInvoice(invoice5Items, 0);

// Try to process negative payment
console.log('Attempting negative payment: -$50.00');
const negativePaymentResult = processPayment(invoice5, -50, PaymentMethod.CASH);
console.log(`  Success: ${negativePaymentResult.success}`);
console.log(`  Error: ${negativePaymentResult.error}`);
console.log(`  Payment Status: ${negativePaymentResult.payment.status}`);
console.log('');

// Try to process zero payment
console.log('Attempting zero payment: $0.00');
const zeroPaymentResult = processPayment(invoice5, 0, PaymentMethod.CASH);
console.log(`  Success: ${zeroPaymentResult.success}`);
console.log(`  Error: ${zeroPaymentResult.error}`);
console.log('');

// ============================================================================
// Example 6: Large Transaction
// ============================================================================
console.log('Example 6: Large Transaction');
console.log('-'.repeat(70));

const invoice6Items: InvoiceItemInput[] = [
    { description: 'Enterprise License', quantity: 1, unitPrice: 99999.99 }
];
const invoice6 = createInvoice(invoice6Items, taxRate);

console.log(`Invoice Total: $${invoice6.totalAmount.toFixed(2)}`);

const largePaymentResult = processPayment(invoice6, invoice6.totalAmount, PaymentMethod.BANK_TRANSFER);
console.log(`Payment Processed: $${largePaymentResult.payment.amount.toFixed(2)}`);
console.log(`Invoice Status: ${largePaymentResult.invoice.status}`);
console.log('');

console.log('='.repeat(70));
console.log('END:: DEMO COMPLETE');
console.log('='.repeat(70));
