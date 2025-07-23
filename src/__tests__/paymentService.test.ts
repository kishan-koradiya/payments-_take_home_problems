import { PaymentService } from '../services/paymentService';
import { ChargeRequest } from '../types';

// Mock the LLM service to avoid API calls during testing
jest.mock('../services/llmService', () => {
  return {
    LLMService: jest.fn().mockImplementation(() => ({
      generatePaymentExplanation: jest.fn().mockResolvedValue('Mock explanation')
    }))
  };
});

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    paymentService.clearTransactions(); // Start with clean state
  });

  describe('processCharge', () => {
    const validRequest: ChargeRequest = {
      amount: 1000,
      currency: 'USD',
      source: 'tok_visa',
      email: 'user@gmail.com'
    };

    it('should process a valid charge request', async () => {
      const result = await paymentService.processCharge(validRequest);

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('explanation');

      expect(result.transactionId).toMatch(/^txn_[a-zA-Z0-9]+$/);
      expect(['stripe', 'paypal', 'blocked']).toContain(result.provider);
      expect(['success', 'blocked']).toContain(result.status);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(typeof result.explanation).toBe('string');
    });

    it('should store transaction in memory', async () => {
      await paymentService.processCharge(validRequest);
      
      const transactions = paymentService.getAllTransactions();
      expect(transactions).toHaveLength(1);
      
      const transaction = transactions[0];
      expect(transaction).toMatchObject({
        amount: validRequest.amount,
        currency: validRequest.currency,
        source: validRequest.source,
        email: validRequest.email
      });
    });

    it('should handle high-risk transactions', async () => {
      const highRiskRequest: ChargeRequest = {
        amount: 100000, // Large amount
        currency: 'USD',
        source: 'tok_test', // Test source
        email: 'user@test.com' // Suspicious domain
      };

      const result = await paymentService.processCharge(highRiskRequest);
      
      // Should have higher risk score due to multiple risk factors
      expect(result.riskScore).toBeGreaterThan(0.3);
    });
  });

  describe('getAllTransactions', () => {
    it('should return empty array initially', () => {
      const transactions = paymentService.getAllTransactions();
      expect(transactions).toHaveLength(0);
    });

    it('should return transactions sorted by timestamp (newest first)', async () => {
      const request1: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user1@gmail.com'
      };

      const request2: ChargeRequest = {
        amount: 2000,
        currency: 'USD',
        source: 'tok_mastercard',
        email: 'user2@gmail.com'
      };

      await paymentService.processCharge(request1);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await paymentService.processCharge(request2);

      const transactions = paymentService.getAllTransactions();
      expect(transactions).toHaveLength(2);
      expect(transactions[0]?.amount).toBe(2000); // Newest first
      expect(transactions[1]?.amount).toBe(1000);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction when ID exists', async () => {
      const result = await paymentService.processCharge({
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      });

      const transaction = paymentService.getTransactionById(result.transactionId);
      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(result.transactionId);
    });

    it('should return undefined when ID does not exist', () => {
      const transaction = paymentService.getTransactionById('invalid_id');
      expect(transaction).toBeUndefined();
    });
  });

  describe('getFilteredTransactions', () => {
    beforeEach(async () => {
      // Create some test transactions
      await paymentService.processCharge({
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user1@gmail.com'
      });

      await paymentService.processCharge({
        amount: 2000,
        currency: 'EUR',
        source: 'tok_mastercard',
        email: 'user2@test.com' // Suspicious domain
      });
    });

    it('should filter by amount range', () => {
      const filtered = paymentService.getFilteredTransactions({
        minAmount: 1500,
        maxAmount: 2500
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.amount).toBe(2000);
    });

    it('should filter by provider', () => {
      const stripeTransactions = paymentService.getFilteredTransactions({
        provider: 'stripe'
      });

      const paypalTransactions = paymentService.getFilteredTransactions({
        provider: 'paypal'
      });

      const blockedTransactions = paymentService.getFilteredTransactions({
        provider: 'blocked'
      });

      expect(stripeTransactions.length + paypalTransactions.length + blockedTransactions.length).toBe(2);
    });

    it('should filter by status', () => {
      const successTransactions = paymentService.getFilteredTransactions({
        status: 'success'
      });

      const blockedTransactions = paymentService.getFilteredTransactions({
        status: 'blocked'
      });

      expect(successTransactions.length + blockedTransactions.length).toBe(2);
    });
  });

  describe('getTransactionStats', () => {
    it('should return correct stats for empty transactions', () => {
      const stats = paymentService.getTransactionStats();
      
      expect(stats.total).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.blocked).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.averageRiskScore).toBe(0);
      expect(stats.providerBreakdown).toEqual({});
    });

    it('should calculate correct stats for multiple transactions', async () => {
      await paymentService.processCharge({
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      });

      await paymentService.processCharge({
        amount: 2000,
        currency: 'USD',
        source: 'tok_mastercard',
        email: 'user@gmail.com'
      });

      const stats = paymentService.getTransactionStats();
      
      expect(stats.total).toBe(2);
      expect(stats.totalAmount).toBe(3000);
      expect(stats.averageRiskScore).toBeGreaterThan(0);
      expect(Object.keys(stats.providerBreakdown).length).toBeGreaterThan(0);
    });
  });

  describe('clearTransactions', () => {
    it('should clear all transactions', async () => {
      await paymentService.processCharge({
        amount: 1000,
        currency: 'USD',
        source: 'tok_visa',
        email: 'user@gmail.com'
      });

      expect(paymentService.getAllTransactions()).toHaveLength(1);
      
      paymentService.clearTransactions();
      
      expect(paymentService.getAllTransactions()).toHaveLength(0);
    });
  });
});