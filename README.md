# Billing and Payment Processing System

## Installation

```bash
npm install
```

## API Documentation

### 1. Invoice Service

#### `calculateInvoiceTotal(items, taxRate)`

Calculates invoice totals from line items.

**Parameters:**
- `items: InvoiceItemInput[]` - Array of invoice items
- `taxRate: number` - Tax rate (e.g., 0.07 for 7%)

**Returns:** `InvoiceTotals` - Calculated totals with processed items

**Example:**
```typescript
const totals = calculateInvoiceTotal(
  [{ description: 'Service', quantity: 1, unitPrice: 100.00 }],
  0.07
);
// Returns: { subtotal: 100.00, totalTax: 7.00, totalAmount: 107.00, items: [...] }
```

#### `createInvoice(items, taxRate, invoiceDate?)`

Creates a new invoice with unique ID and invoice number.

**Parameters:**
- `items: InvoiceItemInput[]` - Array of invoice items
- `taxRate: number` - Tax rate to apply
- `invoiceDate?: Date` - Invoice date (defaults to current date)

**Returns:** `Invoice` - Complete invoice object

### 2. Payment Service

#### `processPayment(invoice, paymentAmount, paymentMethod, paymentDate?)`

Processes a payment against an invoice.

**Parameters:**
- `invoice: Invoice` - The invoice to pay
- `paymentAmount: number` - Amount being paid
- `paymentMethod: PaymentMethod` - Payment method
- `paymentDate?: Date` - Payment date (defaults to current date)

**Returns:** `PaymentResult` - Result with updated invoice and payment record

**Example:**
```typescript
const result = processPayment(
  invoice,
  300.00,
  PaymentMethod.BANK_TRANSFER
);

if (result.success) {
  console.log(`Payment successful: ${result.payment.referenceNumber}`);
  console.log(`Outstanding: $${result.invoice.outstandingAmount}`);
} else {
  console.error(`Payment failed: ${result.error}`);
}
```

#### `validatePaymentAmount(invoice, paymentAmount)`

Validates if a payment amount is acceptable.

**Returns:** `{ valid: boolean, message?: string }`

### 3. Receipt Service

#### `generateReceipt(payment, invoice)`

Generates a receipt for a payment.

**Parameters:**
- `payment: Payment` - The payment record
- `invoice: Invoice` - The invoice

**Returns:** `Receipt` - Complete receipt object

#### `formatReceipt(receipt, invoice)`

Formats a receipt as a readable string.

**Returns:** `string` - Formatted receipt text

## Payment Methods

The system supports the following payment methods:

- `CASH` - Cash payment
- `BANK_TRANSFER` - Bank transfer
- `CREDIT_CARD` - Credit card
- `DEBIT_CARD` - Debit card
- `CHECK` - Check payment

## Invoice Statuses

- `PENDING` - Invoice created but not paid
- `PARTIALLY_PAID` - Invoice partially paid
- `PAID` - Invoice fully paid
- `OVERPAID` - Payment exceeds invoice total
- `CANCELLED` - Invoice cancelled

## Usage Examples

### Example 1: Basic Invoice (from requirements)

```typescript
const items = [
  { description: 'Monthly Fee', quantity: 1, unitPrice: 500.00 },
  { description: 'Activity Fee', quantity: 2, unitPrice: 25.50 }
];
const invoice = createInvoice(items, 0.07);

// Expected:
// Subtotal: $551.00
// Tax: $38.57
// Total: $589.57
```

### Example 2: Partial Payments and Overpayment

```typescript
const invoice = createInvoice(
  [{ description: 'Service', quantity: 1, unitPrice: 1000.00 }],
  0
);

// First payment
const payment1 = processPayment(invoice, 300.00, PaymentMethod.CASH);
// Outstanding: $700.00

// Second payment (overpayment)
const payment2 = processPayment(payment1.invoice, 750.00, PaymentMethod.BANK_TRANSFER);
// Outstanding: -$50.00 (overpayment)
// Status: OVERPAID
```

### Example 3: Multiple Payments to Completion

```typescript
let invoice = createInvoice(items, 0.07);

const payments = [300, 400, 300];
payments.forEach(amount => {
  const result = processPayment(invoice, amount, PaymentMethod.CASH);
  invoice = result.invoice;
  
  const receipt = generateReceipt(result.payment, invoice);
  console.log(formatReceipt(receipt, invoice));
});
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Design Decisions

### 1. Decimal Precision

The system uses standard JavaScript numbers with rounding to 2 decimal places for all financial calculations. This is implemented through the `roundToTwoDecimals()` utility function.

**Trade-off:** For production systems handling very large volumes or requiring absolute precision, consider using a decimal library like `decimal.js` or `big.js`.

### 2. Overpayment Handling

When a payment exceeds the outstanding amount, the system:
- Sets the outstanding amount to a negative value
- Updates the invoice status to `OVERPAID`
- Does NOT automatically issue refunds or create credit notes

**Rationale:** This provides flexibility for different business rules around overpayments (refund, credit, etc.).

### 3. Payment Allocation

For partial payments, the receipt service allocates payment proportionally across invoice items based on their line totals.

**Example:** If an invoice has items worth $100 and $200, a $150 payment is allocated as $50 and $100 respectively.

### 4. Immutability

The `processPayment` function clones the invoice before updating it to avoid mutations. This ensures the original invoice object remains unchanged.

### 5. Reference Number Generation

Invoice numbers, receipt numbers, and payment references use a sequential counter with date-based prefixes (e.g., `INV-20231207-0001`).

**Note:** In a production system, these should be stored in a database to ensure uniqueness across application restarts.

## Known Limitations

1. **Counter Persistence**: Sequential counters for reference numbers are in-memory only and reset on application restart. Production systems should use database sequences.

2. **Decimal Precision**: Uses JavaScript's native number type. For applications requiring arbitrary precision, integrate a decimal library.

3. **Concurrency**: No built-in concurrency control or locking mechanisms. In a multi-user environment, implement optimistic locking, database transactions, or similar mechanisms to prevent race conditions when processing simultaneous payments on the same invoice.

4. **Scalability**: Cannot handle high request volumes. No support for load balancing, horizontal scaling, caching, or queue-based processing. In-memory counters and synchronous processing limit scalability.

5. **Payment Reversal**: No built-in support for payment reversals or refunds. These would need to be implemented as separate features.

6. **Currency**: No multi-currency support. All amounts are assumed to be in the same currency.

7. **Audit Trail**: Limited audit trail. Production systems should log all state changes with timestamps and user information.

8. **Security**: No authentication, authorization, encryption, or other security features.

## Project Structure

```
billing-system/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces and enums
│   ├── services/
│   │   ├── invoice.service.ts    # Invoice operations
│   │   ├── payment.service.ts    # Payment processing
│   │   └── receipt.service.ts    # Receipt generation
│   ├── utils/
│   │   ├── errors.ts         # Custom error classes
│   │   ├── validation.ts     # Input validation
│   │   ├── calculations.ts   # Financial calculations
│   │   └── generators.ts     # ID generation
│   ├── __tests__/
│   │   ├── invoice.service.test.ts
│   │   ├── payment.service.test.ts
│   │   ├── receipt.service.test.ts
│   │   └── integration.test.ts
│   ├── examples/
│   │   └── usage.ts          # Example usage
│   └── index.ts              # Main entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Running Examples

To run the example usage file:

```bash
npm run example
```

This will demonstrate:
- Basic invoice calculation
- Partial payments and overpayments
- Multiple payments to completion
- Edge cases (zero amounts, large transactions)
- Error handling

## Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

Type checking without compilation:

```bash
npm run lint
```