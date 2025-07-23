import { z } from 'zod';

// Charge request schema
export const chargeRequestSchema = z.object({
  amount: z.number()
    .int('Amount must be an integer')
    .min(1, 'Amount must be greater than 0')
    .max(10000000, 'Amount cannot exceed $100,000'), // in cents
  currency: z.string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters only'),
  source: z.string()
    .min(1, 'Source is required')
    .max(100, 'Source cannot exceed 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email cannot exceed 254 characters')
});

// Subscription request schema
export const subscriptionRequestSchema = z.object({
  donorId: z.string()
    .min(1, 'Donor ID is required')
    .max(50, 'Donor ID cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Donor ID can only contain letters, numbers, hyphens, and underscores'),
  amount: z.number()
    .int('Amount must be an integer')
    .min(100, 'Minimum donation amount is $1.00') // $1 minimum in cents
    .max(1000000, 'Maximum donation amount is $10,000'), // in cents
  currency: z.string()
    .length(3, 'Currency must be a 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters only'),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    errorMap: () => ({ message: 'Interval must be one of: daily, weekly, monthly, yearly' })
  }),
  campaignDescription: z.string()
    .min(10, 'Campaign description must be at least 10 characters')
    .max(1000, 'Campaign description cannot exceed 1000 characters')
    .trim()
});

// Query parameters for transaction filtering
export const transactionQuerySchema = z.object({
  provider: z.enum(['stripe', 'paypal', 'blocked']).optional(),
  status: z.enum(['success', 'failed', 'blocked']).optional(),
  minAmount: z.string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0, 'minAmount must be a non-negative number')
    .optional(),
  maxAmount: z.string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0, 'maxAmount must be a non-negative number')
    .optional(),
  startDate: z.string()
    .transform(val => new Date(val))
    .refine(date => !isNaN(date.getTime()), 'startDate must be a valid date')
    .optional(),
  endDate: z.string()
    .transform(val => new Date(val))
    .refine(date => !isNaN(date.getTime()), 'endDate must be a valid date')
    .optional()
}).refine(
  data => !data.minAmount || !data.maxAmount || data.minAmount <= data.maxAmount,
  {
    message: 'minAmount must be less than or equal to maxAmount',
    path: ['minAmount']
  }
).refine(
  data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate']
  }
);

// Donor ID parameter schema
export const donorIdSchema = z.object({
  donorId: z.string()
    .min(1, 'Donor ID is required')
    .max(50, 'Donor ID cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Donor ID can only contain letters, numbers, hyphens, and underscores')
});

// Transaction ID parameter schema
export const transactionIdSchema = z.object({
  id: z.string()
    .min(1, 'Transaction ID is required')
    .regex(/^txn_[a-zA-Z0-9]+$/, 'Invalid transaction ID format')
});

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL'
] as const;

// Update currency validation to use supported currencies
export const supportedCurrencySchema = z.enum(SUPPORTED_CURRENCIES, {
  errorMap: () => ({ 
    message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}` 
  })
});

// Enhanced charge request with supported currencies
export const enhancedChargeRequestSchema = chargeRequestSchema.extend({
  currency: supportedCurrencySchema
});

// Enhanced subscription request with supported currencies
export const enhancedSubscriptionRequestSchema = subscriptionRequestSchema.extend({
  currency: supportedCurrencySchema
});