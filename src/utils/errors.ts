/**
 * Custom error classes for the billing system
 */



/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Error thrown when payment processing fails
 */
export class PaymentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PaymentError';
        Object.setPrototypeOf(this, PaymentError.prototype);
    }
}


