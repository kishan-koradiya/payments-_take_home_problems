import { v4 as uuidv4 } from 'uuid';
import { 
  SubscriptionRequest, 
  Subscription, 
  SubscriptionTransaction,
  CampaignAnalysis 
} from '../types';
import { LLMService } from './llmService';

export class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private transactions: SubscriptionTransaction[] = [];
  private llmService: LLMService;
  private backgroundJobInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.llmService = new LLMService();
    this.startBackgroundJob();
  }

  /**
   * Create a new subscription with LLM campaign analysis
   */
  async createSubscription(request: SubscriptionRequest): Promise<Subscription> {
    // Analyze campaign using LLM
    const analysis = await this.llmService.analyzeCampaign(request.campaignDescription);
    
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      donorId: request.donorId,
      amount: request.amount,
      currency: request.currency,
      interval: request.interval,
      campaignDescription: request.campaignDescription,
      tags: analysis.tags,
      summary: analysis.summary,
      createdAt: new Date(),
      nextChargeAt: this.calculateNextChargeDate(request.interval),
      isActive: true
    };

    this.subscriptions.set(request.donorId, subscription);
    
    console.log(`Created subscription for donor ${request.donorId}: ${analysis.summary}`);
    console.log(`Tags: ${analysis.tags.join(', ')}`);

    return subscription;
  }

  /**
   * Cancel a subscription
   */
  cancelSubscription(donorId: string): boolean {
    const subscription = this.subscriptions.get(donorId);
    if (!subscription) {
      return false;
    }

    subscription.isActive = false;
    console.log(`Cancelled subscription for donor ${donorId}`);
    return true;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get subscription by donor ID
   */
  getSubscriptionByDonorId(donorId: string): Subscription | undefined {
    return this.subscriptions.get(donorId);
  }

  /**
   * Get all subscription transactions
   */
  getTransactions(): SubscriptionTransaction[] {
    return [...this.transactions].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get transactions for a specific donor
   */
  getTransactionsByDonor(donorId: string): SubscriptionTransaction[] {
    return this.transactions
      .filter(t => t.donorId === donorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    totalActive: number;
    totalCancelled: number;
    monthlyRecurringRevenue: number;
    campaignsByTag: Record<string, number>;
    intervalBreakdown: Record<string, number>;
  } {
    const allSubscriptions = Array.from(this.subscriptions.values());
    const active = allSubscriptions.filter(s => s.isActive);
    const cancelled = allSubscriptions.filter(s => !s.isActive);

    // Calculate MRR (Monthly Recurring Revenue)
    const monthlyRecurringRevenue = active.reduce((total, sub) => {
      const monthlyAmount = this.convertToMonthlyAmount(sub.amount, sub.interval);
      return total + monthlyAmount;
    }, 0);

    // Count campaigns by tag
    const campaignsByTag: Record<string, number> = {};
    active.forEach(sub => {
      sub.tags.forEach(tag => {
        campaignsByTag[tag] = (campaignsByTag[tag] || 0) + 1;
      });
    });

    // Count by interval
    const intervalBreakdown: Record<string, number> = {};
    active.forEach(sub => {
      intervalBreakdown[sub.interval] = (intervalBreakdown[sub.interval] || 0) + 1;
    });

    return {
      totalActive: active.length,
      totalCancelled: cancelled.length,
      monthlyRecurringRevenue,
      campaignsByTag,
      intervalBreakdown
    };
  }

  /**
   * Process recurring charges (called by background job)
   */
  private async processRecurringCharges(): Promise<void> {
    const now = new Date();
    const activeSubscriptions = this.getActiveSubscriptions();
    
    for (const subscription of activeSubscriptions) {
      if (now >= subscription.nextChargeAt) {
        await this.chargeSubscription(subscription);
      }
    }
  }

  /**
   * Charge a single subscription
   */
  private async chargeSubscription(subscription: Subscription): Promise<void> {
    try {
      // Simulate payment processing
      const success = Math.random() > 0.05; // 95% success rate
      
      const transaction: SubscriptionTransaction = {
        id: this.generateTransactionId(),
        subscriptionId: subscription.id,
        donorId: subscription.donorId,
        amount: subscription.amount,
        currency: subscription.currency,
        status: success ? 'success' : 'failed',
        timestamp: new Date(),
        type: 'recurring'
      };

      this.transactions.push(transaction);

      if (success) {
        subscription.lastChargedAt = new Date();
        subscription.nextChargeAt = this.calculateNextChargeDate(subscription.interval, new Date());
        
        console.log(`✅ Charged $${(subscription.amount / 100).toFixed(2)} for ${subscription.donorId} - ${subscription.summary}`);
      } else {
        console.log(`❌ Failed to charge ${subscription.donorId} - ${subscription.summary}`);
        // In a real system, you might implement retry logic or cancel after multiple failures
      }

    } catch (error) {
      console.error(`Error processing subscription ${subscription.id}:`, error);
    }
  }

  /**
   * Start background job for processing recurring payments
   */
  private startBackgroundJob(): void {
    // Check for charges every hour (in production, this might be daily)
    this.backgroundJobInterval = setInterval(async () => {
      console.log('🔄 Processing recurring charges...');
      await this.processRecurringCharges();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Background job started for subscription processing');
  }

  /**
   * Stop background job (useful for testing/cleanup)
   */
  stopBackgroundJob(): void {
    if (this.backgroundJobInterval) {
      clearInterval(this.backgroundJobInterval);
      this.backgroundJobInterval = null;
      console.log('Background job stopped');
    }
  }

  /**
   * Manually trigger charge processing (useful for testing)
   */
  async triggerChargeProcessing(): Promise<void> {
    console.log('🔄 Manually triggering recurring charges...');
    await this.processRecurringCharges();
  }

  private generateSubscriptionId(): string {
    return `sub_${uuidv4().substring(0, 8)}`;
  }

  private generateTransactionId(): string {
    return `txn_${uuidv4().substring(0, 8)}`;
  }

  private calculateNextChargeDate(interval: string, baseDate: Date = new Date()): Date {
    const date = new Date(baseDate);
    
    switch (interval) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    return date;
  }

  private convertToMonthlyAmount(amount: number, interval: string): number {
    switch (interval) {
      case 'daily':
        return amount * 30; // Approximate
      case 'weekly':
        return amount * 4.33; // Approximate weeks per month
      case 'monthly':
        return amount;
      case 'yearly':
        return amount / 12;
      default:
        return amount; // Default to monthly
    }
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    this.subscriptions.clear();
    this.transactions = [];
  }
}