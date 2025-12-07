/**
 * Billing System Type Definitions
 * 
 * This module contains all TypeScript interfaces, enums, and types
 * used throughout the billing and payment processing system.
 */

/**
 * Invoice status enumeration
 */
export enum InvoiceStatus {
    /** Invoice has been created but not yet paid */
    PENDING = 'PENDING',
    /** Invoice has been partially paid */
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    /** Invoice has been fully paid */
    PAID = 'PAID',
    /** Invoice has been overpaid (payment exceeds total) */
    OVERPAID = 'OVERPAID',
    /** Invoice has been cancelled */
    CANCELLED = 'CANCELLED'
}

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
    /** Cash payment */
    CASH = 'CASH',
    /** Bank transfer payment */
    BANK_TRANSFER = 'BANK_TRANSFER',
    /** Credit card payment */
    CREDIT_CARD = 'CREDIT_CARD',
    /** Debit card payment */
    DEBIT_CARD = 'DEBIT_CARD',
    /** Check payment */
    CHECK = 'CHECK'
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
    /** Payment is pending processing */
    PENDING = 'PENDING',
    /** Payment has been completed successfully */
    COMPLETED = 'COMPLETED',
    /** Payment has failed */
    FAILED = 'FAILED',
    /** Payment has been refunded */
    REFUNDED = 'REFUNDED'
}

/**
 * Individual line item on an invoice
 */
export interface InvoiceItem {
    /** Unique identifier for the line item */
    id: string;
    /** Description of the item or service */
    description: string;
    /** Quantity of items */
    quantity: number;
    /** Price per unit */
    unitPrice: number;
    /** Total for this line (quantity × unitPrice) */
    lineTotal: number;
    /** Tax rate applied to this item (e.g., 0.07 for 7%) */
    taxRate: number;
    /** Tax amount for this line item */
    taxAmount: number;
}

/**
 * Invoice representing a bill for goods or services
 */
export interface Invoice {
    /** Unique identifier for the invoice */
    id: string;
    /** Human-readable invoice number (e.g., INV-20231207-0001) */
    invoiceNumber: string;
    /** Date the invoice was created */
    invoiceDate: Date;
    /** Line items on the invoice */
    items: InvoiceItem[];
    /** Total amount before tax */
    subtotal: number;
    /** Total amount including tax */
    totalAmount: number;
    /** Total tax amount */
    totalTax: number;
    /** Amount still owed on this invoice */
    outstandingAmount: number;
    /** Current status of the invoice */
    status: InvoiceStatus;
}

/**
 * Payment made against an invoice
 */
export interface Payment {
    /** Unique identifier for the payment */
    id: string;
    /** ID of the invoice this payment is for */
    invoiceId: string;
    /** Method used for payment */
    paymentMethod: PaymentMethod;
    /** Amount paid */
    amount: number;
    /** Date the payment was made */
    paymentDate: Date;
    /** Reference number for the payment (e.g., PAY-20231207-0001) */
    referenceNumber: string;
    /** Current status of the payment */
    status: PaymentStatus;
}

/**
 * Line item on a receipt showing payment allocation
 */
export interface ReceiptItem {
    /** Description of the item from the invoice */
    description: string;
    /** Amount allocated to this item from the payment */
    amountAllocated: number;
}

/**
 * Receipt generated after a payment is processed
 */
export interface Receipt {
    /** Unique identifier for the receipt */
    id: string;
    /** ID of the payment this receipt is for */
    paymentId: string;
    /** ID of the invoice this receipt is for */
    invoiceId: string;
    /** Human-readable receipt number (e.g., RCP-20231207-0001) */
    receiptNumber: string;
    /** Date the receipt was generated */
    receiptDate: Date;
    /** Total amount paid in this transaction */
    totalPaid: number;
    /** Remaining balance on the invoice after this payment */
    remainingBalance: number;
    /** Payment method used */
    paymentMethod: PaymentMethod;
    /** Payment reference number */
    paymentReference: string;
    /** Items showing payment allocation */
    items: ReceiptItem[];
}

/**
 * Result of invoice total calculation
 */
export interface InvoiceTotals {
    /** Total before tax */
    subtotal: number;
    /** Total tax amount */
    totalTax: number;
    /** Total including tax */
    totalAmount: number;
    /** Calculated invoice items with tax */
    items: InvoiceItem[];
}

/**
 * Result of payment processing
 */
export interface PaymentResult {
    /** Whether the payment was successful */
    success: boolean;
    /** The processed payment */
    payment: Payment;
    /** The updated invoice */
    invoice: Invoice;
    /** Error message if payment failed */
    error?: string;
}
