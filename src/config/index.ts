/**
 * Environment Configuration
 * 
 * Loads and validates environment variables for the billing system.
 * Supports multiple environments: local, staging, production
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'local';
const envFile = `.env.${env}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * Configuration interface
 */
export interface Config {
    env: string;
    tax: {
        rate: number;
        percentage: number;
    };
    limits: {
        maxInvoiceAmount: number;
        maxPaymentAmount: number;
        maxLineItemAmount: number;
        minPaymentAmount: number;
        minInvoiceAmount: number;
    };
}

/**
 * Parse environment variable as number
 */
function parseNumber(value: string | undefined, defaultValue: number, name: string): number {
    if (!value) {
        console.warn(`Environment variable ${name} not set, using default: ${defaultValue}`);
        return defaultValue;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error(`Invalid number for ${name}: ${value}`);
    }

    return parsed;
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): Config {
    const config: Config = {
        env: process.env.NODE_ENV || 'local',
        tax: {
            rate: parseNumber(process.env.TAX_RATE, 0.07, 'TAX_RATE'),
            percentage: parseNumber(process.env.TAX_RATE_PERCENTAGE, 7, 'TAX_RATE_PERCENTAGE'),
        },
        limits: {
            maxInvoiceAmount: parseNumber(process.env.MAX_INVOICE_AMOUNT, 1000000, 'MAX_INVOICE_AMOUNT'),
            maxPaymentAmount: parseNumber(process.env.MAX_PAYMENT_AMOUNT, 1000000, 'MAX_PAYMENT_AMOUNT'),
            maxLineItemAmount: parseNumber(process.env.MAX_LINE_ITEM_AMOUNT, 500000, 'MAX_LINE_ITEM_AMOUNT'),
            minPaymentAmount: parseNumber(process.env.MIN_PAYMENT_AMOUNT, 0.01, 'MIN_PAYMENT_AMOUNT'),
            minInvoiceAmount: parseNumber(process.env.MIN_INVOICE_AMOUNT, 0.01, 'MIN_INVOICE_AMOUNT'),
        },
    };

    // Validate configuration
    validateConfig(config);

    return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: Config): void {
    // Validate tax rate
    if (config.tax.rate < 0 || config.tax.rate > 1) {
        throw new Error(`Invalid TAX_RATE: ${config.tax.rate}. Must be between 0 and 1.`);
    }

    // Validate limits are positive
    Object.entries(config.limits).forEach(([key, value]) => {
        if (value <= 0) {
            throw new Error(`Invalid ${key}: ${value}. Must be positive.`);
        }
    });

    // Validate max > min
    if (config.limits.maxInvoiceAmount < config.limits.minInvoiceAmount) {
        throw new Error('MAX_INVOICE_AMOUNT must be greater than MIN_INVOICE_AMOUNT');
    }

    if (config.limits.maxPaymentAmount < config.limits.minPaymentAmount) {
        throw new Error('MAX_PAYMENT_AMOUNT must be greater than MIN_PAYMENT_AMOUNT');
    }
}

export function getTaxRate(): number {
    return config.tax.rate;
}

/**
 * Get maximum invoice amount from configuration
 */
export function getMaxInvoiceAmount(): number {
    return config.limits.maxInvoiceAmount;
}

/**
 * Get maximum payment amount from configuration
 */
export function getMaxPaymentAmount(): number {
    return config.limits.maxPaymentAmount;
}

/**
 * Get maximum line item amount from configuration
 */
export function getMaxLineItemAmount(): number {
    return config.limits.maxLineItemAmount;
}

/**
 * Get minimum payment amount from configuration
 */
export function getMinPaymentAmount(): number {
    return config.limits.minPaymentAmount;
}


// Load configuration on module import
export const config = loadConfig();

// Log configuration on startup (excluding sensitive data)
console.log(`[Config] Environment: ${config.env}`);
console.log(`[Config] Tax Rate: ${config.tax.rate} (${config.tax.percentage}%)`);
console.log(`[Config] Max Invoice Amount: $${config.limits.maxInvoiceAmount.toLocaleString()}`);
console.log(`[Config] Max Payment Amount: $${config.limits.maxPaymentAmount.toLocaleString()}`);
