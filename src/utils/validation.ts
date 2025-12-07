/**
 * Enhanced validation utilities with environment-based limits
 */

import { ValidationError } from './errors';
import { PaymentMethod } from '../types';
import { getMaxInvoiceAmount, getMaxPaymentAmount, getMaxLineItemAmount, getMinPaymentAmount } from '../config';

/**
 * Validates that a number is positive
 * @param value - The number to validate
 * @param fieldName - Name of the field for error messages
 * @throws ValidationError if the value is not positive
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a valid number`);
    }
    if (value <= 0) {
        throw new ValidationError(`${fieldName} must be positive`);
    }
    if (!isFinite(value)) {
        throw new ValidationError(`${fieldName} must be a finite number`);
    }
}

/**
 * Validates that a number is non-negative
 * @param value - The number to validate
 * @param fieldName - Name of the field for error messages
 * @throws ValidationError if the value is negative
 */
export function validateNonNegativeNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`${fieldName} must be a valid number`);
    }
    if (value < 0) {
        throw new ValidationError(`${fieldName} cannot be negative`);
    }
    if (!isFinite(value)) {
        throw new ValidationError(`${fieldName} must be a finite number`);
    }
}

/**
 * Validates that a string is not empty
 * @param value - The string to validate
 * @param fieldName - Name of the field for error messages
 * @throws ValidationError if the string is empty
 */
export function validateNonEmptyString(value: string, fieldName: string): void {
    if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`);
    }
    if (value.trim().length === 0) {
        throw new ValidationError(`${fieldName} cannot be empty`);
    }
}

/**
 * Validates that an array is not empty
 * @param value - The array to validate
 * @param fieldName - Name of the field for error messages
 * @throws ValidationError if the array is empty
 */
export function validateNonEmptyArray<T>(value: T[], fieldName: string): void {
    if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`);
    }
    if (value.length === 0) {
        throw new ValidationError(`${fieldName} cannot be empty`);
    }
}

/**
 * Validates that a date is valid
 * @param value - The date to validate
 * @param fieldName - Name of the field for error messages
 * @throws ValidationError if the date is invalid
 */
export function validateDate(value: Date, fieldName: string): void {
    if (!(value instanceof Date)) {
        throw new ValidationError(`${fieldName} must be a Date object`);
    }
    if (isNaN(value.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid date`);
    }
}

/**
 * Validates that a payment method is valid
 * @param value - The payment method to validate
 * @throws ValidationError if the payment method is invalid
 */
export function validatePaymentMethod(value: string): void {
    const validMethods = Object.values(PaymentMethod);
    if (!validMethods.includes(value as PaymentMethod)) {
        throw new ValidationError(
            `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
        );
    }
}





/**
 * Validates a tax rate
 * @param taxRate - The tax rate to validate (e.g., 0.07 for 7%)
 * @throws ValidationError if the tax rate is invalid
 */
export function validateTaxRate(taxRate: number): void {
    validateNonNegativeNumber(taxRate, 'Tax rate');
    if (taxRate > 1) {
        throw new ValidationError('Tax rate must be between 0 and 1 (e.g., 0.07 for 7%)');
    }
}

/**
 * Validates payment amount against configured limits
 * @param amount - The payment amount to validate
 * @throws ValidationError if amount exceeds limits
 */
export function validatePaymentAmountLimits(amount: number): void {
    const minAmount = getMinPaymentAmount();
    const maxAmount = getMaxPaymentAmount();

    if (amount < minAmount) {
        throw new ValidationError(`Payment amount must be at least $${minAmount}`);
    }

    if (amount > maxAmount) {
        throw new ValidationError(`Payment amount cannot exceed $${maxAmount.toLocaleString()}`);
    }
}

/**
 * Validates invoice amount against configured limits
 * @param amount - The invoice amount to validate
 * @throws ValidationError if amount exceeds limits
 */
export function validateInvoiceAmount(amount: number): void {
    const maxAmount = getMaxInvoiceAmount();

    if (amount > maxAmount) {
        throw new ValidationError(`Invoice amount cannot exceed $${maxAmount.toLocaleString()}`);
    }
}

/**
 * Validates line item amount against configured limits
 * @param amount - The line item amount to validate
 * @throws ValidationError if amount exceeds limits
 */
export function validateLineItemAmount(amount: number): void {
    const maxAmount = getMaxLineItemAmount();

    if (amount > maxAmount) {
        throw new ValidationError(`Line item amount cannot exceed $${maxAmount.toLocaleString()}`);
    }
}
