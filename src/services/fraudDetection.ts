import { ChargeRequest, FraudRules } from '../types';
import * as fraudRules from '../config/fraudRules.json';

export class FraudDetectionService {
  private rules: FraudRules;

  constructor(customRules?: Partial<FraudRules>) {
    this.rules = { ...fraudRules, ...customRules };
  }

  /**
   * Calculate fraud risk score based on multiple heuristics
   */
  calculateRiskScore(request: ChargeRequest): number {
    let score = 0;
    
    // Base risk score (random component to simulate real-world variability)
    score += Math.random() * 0.1;

    // Amount-based risk
    const amountRisk = this.calculateAmountRisk(request.amount);
    score += amountRisk;

    // Email domain risk
    const domainRisk = this.calculateDomainRisk(request.email);
    score += domainRisk;

    // Currency risk (some currencies might be higher risk)
    const currencyRisk = this.calculateCurrencyRisk(request.currency);
    score += currencyRisk;

    // Source token risk (simulate some tokens being riskier)
    const sourceRisk = this.calculateSourceRisk(request.source);
    score += sourceRisk;

    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Determine payment provider based on risk score
   */
  determineProvider(riskScore: number): 'stripe' | 'paypal' | 'blocked' {
    if (riskScore >= this.rules.blockingThreshold) {
      return 'blocked';
    }
    
    if (riskScore <= this.rules.stripeThreshold) {
      return 'stripe';
    }
    
    return 'paypal';
  }

  /**
   * Get risk factors for explanation generation
   */
  getRiskFactors(request: ChargeRequest): string[] {
    const factors: string[] = [];

    if (request.amount > this.rules.highRiskAmountThreshold) {
      factors.push('large amount');
    }

    const hasSuspiciousDomain = this.rules.suspiciousDomains.some(domain => 
      request.email.toLowerCase().includes(domain.toLowerCase())
    );
    
    if (hasSuspiciousDomain) {
      factors.push('suspicious email domain');
    }

    if (request.currency !== 'USD') {
      factors.push('non-USD currency');
    }

    if (request.source.includes('test')) {
      factors.push('test payment source');
    }

    return factors;
  }

  private calculateAmountRisk(amount: number): number {
    // Higher amounts = higher risk (logarithmic scale)
    if (amount > this.rules.highRiskAmountThreshold) {
      return 0.4;
    }
    if (amount > 10000) {
      return 0.2;
    }
    if (amount > 1000) {
      return 0.1;
    }
    return 0.05;
  }

  private calculateDomainRisk(email: string): number {
    const hasSuspiciousDomain = this.rules.suspiciousDomains.some(domain => 
      email.toLowerCase().includes(domain.toLowerCase())
    );
    
    return hasSuspiciousDomain ? 0.3 : 0;
  }

  private calculateCurrencyRisk(currency: string): number {
    // USD is considered lowest risk
    const riskyCurrencies = ['RUB', 'CNY', 'KRW'];
    if (riskyCurrencies.includes(currency.toUpperCase())) {
      return 0.15;
    }
    if (currency.toUpperCase() !== 'USD') {
      return 0.05;
    }
    return 0;
  }

  private calculateSourceRisk(source: string): number {
    // Test tokens are higher risk
    if (source.includes('test') || source.includes('tok_test')) {
      return 0.1;
    }
    return 0;
  }
}