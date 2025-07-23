import { FraudDetectionService } from '../services/fraudDetection';
import { ChargeRequest } from '../types';

describe('FraudDetectionService', () => {
  let fraudDetectionService: FraudDetectionService;

  beforeEach(() => {
    fraudDetectionService = new FraudDetectionService();
  });

  describe('calculateRiskScore', () => {
    it('should return higher risk score for large amounts', () => {
      const lowAmountRequest: ChargeRequest = {
        amount: 1000, // $10
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const highAmountRequest: ChargeRequest = {
        amount: 100000, // $1000
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const lowScore = fraudDetectionService.calculateRiskScore(lowAmountRequest);
      const highScore = fraudDetectionService.calculateRiskScore(highAmountRequest);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should return higher risk score for suspicious domains', () => {
      const normalRequest: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const suspiciousRequest: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@test.com'
      };

      const normalScore = fraudDetectionService.calculateRiskScore(normalRequest);
      const suspiciousScore = fraudDetectionService.calculateRiskScore(suspiciousRequest);

      expect(suspiciousScore).toBeGreaterThan(normalScore);
    });

    it('should return risk score between 0 and 1', () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const score = fraudDetectionService.calculateRiskScore(request);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('determineProvider', () => {
    it('should block high risk transactions', () => {
      const provider = fraudDetectionService.determineProvider(0.8);
      expect(provider).toBe('blocked');
    });

    it('should route low risk to Stripe', () => {
      const provider = fraudDetectionService.determineProvider(0.2);
      expect(provider).toBe('stripe');
    });

    it('should route medium risk to PayPal', () => {
      const provider = fraudDetectionService.determineProvider(0.4);
      expect(provider).toBe('paypal');
    });
  });

  describe('getRiskFactors', () => {
    it('should identify large amount as risk factor', () => {
      const request: ChargeRequest = {
        amount: 100000, // $1000
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const factors = fraudDetectionService.getRiskFactors(request);
      expect(factors).toContain('large amount');
    });

    it('should identify suspicious domain as risk factor', () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@test.com'
      };

      const factors = fraudDetectionService.getRiskFactors(request);
      expect(factors).toContain('suspicious email domain');
    });

    it('should identify test source as risk factor', () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const factors = fraudDetectionService.getRiskFactors(request);
      expect(factors).toContain('test payment source');
    });

    it('should identify non-USD currency as risk factor', () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'EUR',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const factors = fraudDetectionService.getRiskFactors(request);
      expect(factors).toContain('non-USD currency');
    });

    it('should return empty array for low-risk transaction', () => {
      const request: ChargeRequest = {
        amount: 1000, // $10
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      };

      const factors = fraudDetectionService.getRiskFactors(request);
      expect(factors).toHaveLength(0);
    });
  });

  describe('custom rules', () => {
    it('should accept custom fraud rules', () => {
      const customService = new FraudDetectionService({
        blockingThreshold: 0.3,
        stripeThreshold: 0.1
      });

      expect(customService.determineProvider(0.4)).toBe('blocked');
      expect(customService.determineProvider(0.05)).toBe('stripe');
      expect(customService.determineProvider(0.2)).toBe('paypal');
    });
  });
});