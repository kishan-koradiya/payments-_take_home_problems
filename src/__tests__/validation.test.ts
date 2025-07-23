import { 
  chargeRequestSchema, 
  subscriptionRequestSchema,
  transactionQuerySchema,
  donorIdSchema,
  enhancedChargeRequestSchema,
  enhancedSubscriptionRequestSchema
} from '../validation/schemas';

describe('Validation Schemas', () => {
  describe('chargeRequestSchema', () => {
    it('should validate a correct charge request', () => {
      const validRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      const result = chargeRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should reject negative amounts', () => {
      const invalidRequest = {
        amount: -100,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      expect(() => chargeRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject non-integer amounts', () => {
      const invalidRequest = {
        amount: 10.5,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      expect(() => chargeRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid currency codes', () => {
      const invalidRequest = {
        amount: 1000,
        currency: 'INVALID',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      expect(() => chargeRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid email addresses', () => {
      const invalidRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'invalid-email'
      };

      expect(() => chargeRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject empty source', () => {
      const invalidRequest = {
        amount: 1000,
        currency: 'USD',
        source: '',
        email: 'user@example.com'
      };

      expect(() => chargeRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('subscriptionRequestSchema', () => {
    it('should validate a correct subscription request', () => {
      const validRequest = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'USD',
        interval: 'monthly' as const,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      const result = subscriptionRequestSchema.parse(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should reject invalid donor ID format', () => {
      const invalidRequest = {
        donorId: 'donor@123!',
        amount: 1500,
        currency: 'USD',
        interval: 'monthly' as const,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      expect(() => subscriptionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject amounts below minimum', () => {
      const invalidRequest = {
        donorId: 'donor123',
        amount: 50, // Below $1 minimum
        currency: 'USD',
        interval: 'monthly' as const,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      expect(() => subscriptionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid intervals', () => {
      const invalidRequest = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'USD',
        interval: 'hourly' as any,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      expect(() => subscriptionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject short campaign descriptions', () => {
      const invalidRequest = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'USD',
        interval: 'monthly' as const,
        campaignDescription: 'Too short'
      };

      expect(() => subscriptionRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should trim whitespace from campaign description', () => {
      const request = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'USD',
        interval: 'monthly' as const,
        campaignDescription: '  Emergency food and clean water for earthquake victims  '
      };

      const result = subscriptionRequestSchema.parse(request);
      expect(result.campaignDescription).toBe('Emergency food and clean water for earthquake victims');
    });
  });

  describe('transactionQuerySchema', () => {
    it('should validate empty query', () => {
      const result = transactionQuerySchema.parse({});
      expect(result).toEqual({});
    });

    it('should validate query with all parameters', () => {
      const query = {
        provider: 'stripe',
        status: 'success',
        minAmount: '100',
        maxAmount: '1000',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };

      const result = transactionQuerySchema.parse(query);
      expect(result.provider).toBe('stripe');
      expect(result.status).toBe('success');
      expect(result.minAmount).toBe(100);
      expect(result.maxAmount).toBe(1000);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should reject invalid provider', () => {
      const query = {
        provider: 'invalid'
      };

      expect(() => transactionQuerySchema.parse(query)).toThrow();
    });

    it('should reject minAmount > maxAmount', () => {
      const query = {
        minAmount: '1000',
        maxAmount: '100'
      };

      expect(() => transactionQuerySchema.parse(query)).toThrow();
    });

    it('should reject startDate > endDate', () => {
      const query = {
        startDate: '2023-12-31',
        endDate: '2023-01-01'
      };

      expect(() => transactionQuerySchema.parse(query)).toThrow();
    });
  });

  describe('donorIdSchema', () => {
    it('should validate correct donor ID', () => {
      const valid = { donorId: 'donor_123-abc' };
      const result = donorIdSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it('should reject donor ID with special characters', () => {
      const invalid = { donorId: 'donor@123!' };
      expect(() => donorIdSchema.parse(invalid)).toThrow();
    });

    it('should reject empty donor ID', () => {
      const invalid = { donorId: '' };
      expect(() => donorIdSchema.parse(invalid)).toThrow();
    });
  });

  describe('enhancedChargeRequestSchema', () => {
    it('should accept supported currencies', () => {
      const validRequest = {
        amount: 1000,
        currency: 'EUR',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      const result = enhancedChargeRequestSchema.parse(validRequest);
      expect(result.currency).toBe('EUR');
    });

    it('should reject unsupported currencies', () => {
      const invalidRequest = {
        amount: 1000,
        currency: 'XYZ',
        source: 'tok_visa',
        email: 'user@example.com'
      };

      expect(() => enhancedChargeRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('enhancedSubscriptionRequestSchema', () => {
    it('should accept supported currencies', () => {
      const validRequest = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'GBP',
        interval: 'monthly' as const,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      const result = enhancedSubscriptionRequestSchema.parse(validRequest);
      expect(result.currency).toBe('GBP');
    });

    it('should reject unsupported currencies', () => {
      const invalidRequest = {
        donorId: 'donor123',
        amount: 1500,
        currency: 'XYZ',
        interval: 'monthly' as const,
        campaignDescription: 'Emergency food and clean water for earthquake victims'
      };

      expect(() => enhancedSubscriptionRequestSchema.parse(invalidRequest)).toThrow();
    });
  });
});