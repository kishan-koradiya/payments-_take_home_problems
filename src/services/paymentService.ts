import { v4 as uuidv4 } from 'uuid';
import { ChargeRequest, ChargeResponse, Transaction } from '../types';
import { FraudDetectionService } from './fraudDetection';
import { LLMService } from './llmService';

export class PaymentService {
  private transactions: Transaction[] = [];
  private fraudDetection: FraudDetectionService;
  private llmService: LLMService;

  constructor() {
    this.fraudDetection = new FraudDetectionService();
    this.llmService = new LLMService();
  }

  /**
   * Process a charge request through fraud detection and provider routing
   */
  async processCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Calculate fraud risk score
    const riskScore = this.fraudDetection.calculateRiskScore(request);
    
    // Determine provider based on risk
    const provider = this.fraudDetection.determineProvider(riskScore);
    
    // Get risk factors for explanation
    const riskFactors = this.fraudDetection.getRiskFactors(request);
    
    // Generate transaction ID
    const transactionId = this.generateTransactionId();
    
    // Determine status based on provider
    const status = provider === 'blocked' ? 'blocked' : 'success';
    
    // Generate explanation using LLM
    const explanation = await this.llmService.generatePaymentExplanation(
      request,
      riskScore,
      provider,
      riskFactors
    );

    // Create transaction record
    const transaction: Transaction = {
      id: transactionId,
      amount: request.amount,
      currency: request.currency,
      source: request.source,
      email: request.email,
      provider,
      status,
      riskScore,
      explanation,
      timestamp: new Date(),
      metadata: {
        riskFactors,
        userAgent: 'PaymentGatewayProxy/1.0',
        ipAddress: '127.0.0.1' // Simulated
      }
    };

    // Store transaction
    this.transactions.push(transaction);

    // Simulate provider processing delay
    await this.simulateProviderProcessing(provider);

    return {
      transactionId,
      provider,
      status,
      riskScore: Math.round(riskScore * 100) / 100, // Round to 2 decimal places
      explanation
    };
  }

  /**
   * Get all transactions (for GET /transactions endpoint)
   */
  getAllTransactions(): Transaction[] {
    return [...this.transactions].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  /**
   * Get transactions with filters
   */
  getFilteredTransactions(filters: {
    provider?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date;
    endDate?: Date;
  }): Transaction[] {
    let filtered = this.transactions;

    if (filters.provider) {
      filtered = filtered.filter(t => t.provider === filters.provider);
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }

    if (filters.startDate) {
      filtered = filtered.filter(t => t.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => t.timestamp <= filters.endDate!);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(): {
    total: number;
    successful: number;
    blocked: number;
    totalAmount: number;
    averageRiskScore: number;
    providerBreakdown: Record<string, number>;
  } {
    const total = this.transactions.length;
    const successful = this.transactions.filter(t => t.status === 'success').length;
    const blocked = this.transactions.filter(t => t.status === 'blocked').length;
    const totalAmount = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageRiskScore = total > 0 
      ? this.transactions.reduce((sum, t) => sum + t.riskScore, 0) / total 
      : 0;

    const providerBreakdown: Record<string, number> = {};
    this.transactions.forEach(t => {
      providerBreakdown[t.provider] = (providerBreakdown[t.provider] || 0) + 1;
    });

    return {
      total,
      successful,
      blocked,
      totalAmount,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      providerBreakdown
    };
  }

  private generateTransactionId(): string {
    return `txn_${uuidv4().substring(0, 8)}`;
  }

  private async simulateProviderProcessing(provider: string): Promise<void> {
    // Simulate different processing times for different providers
    const delays: Record<string, number> = {
      stripe: 100,
      paypal: 150,
      blocked: 50
    };
    
    const delay = delays[provider] || 100;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Clear all transactions (useful for testing)
   */
  clearTransactions(): void {
    this.transactions = [];
  }
}