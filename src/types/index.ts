export interface ChargeRequest {
  amount: number;
  currency: string;
  source: string;
  email: string;
}

export interface ChargeResponse {
  transactionId: string;
  provider: 'stripe' | 'paypal' | 'blocked';
  status: 'success' | 'failed' | 'blocked';
  riskScore: number;
  explanation: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  source: string;
  email: string;
  provider: 'stripe' | 'paypal' | 'blocked';
  status: 'success' | 'failed' | 'blocked';
  riskScore: number;
  explanation: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface FraudRules {
  suspiciousDomains: string[];
  highRiskAmountThreshold: number;
  blockingThreshold: number;
  stripeThreshold: number;
}

export interface LLMResponse {
  explanation: string;
}

export interface LLMCache {
  [key: string]: {
    response: string;
    timestamp: number;
    ttl: number;
  };
}

// Subscription-related types
export interface SubscriptionRequest {
  donorId: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  campaignDescription: string;
}

export interface Subscription {
  id: string;
  donorId: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  campaignDescription: string;
  tags: string[];
  summary: string;
  createdAt: Date;
  lastChargedAt?: Date;
  nextChargeAt: Date;
  isActive: boolean;
}

export interface CampaignAnalysis {
  tags: string[];
  summary: string;
}

export interface SubscriptionTransaction {
  id: string;
  subscriptionId: string;
  donorId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  timestamp: Date;
  type: 'recurring';
}