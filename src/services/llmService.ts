import OpenAI from 'openai';
import { LLMCache, LLMResponse, CampaignAnalysis, ChargeRequest } from '../types';

export class LLMService {
  private openai: OpenAI | null = null;
  private cache: LLMCache = {};
  private cacheTTL: number;
  private enableLLM: boolean;

  constructor() {
    this.cacheTTL = parseInt(process.env.LLM_CACHE_TTL || '300') * 1000; // Convert to milliseconds
    this.enableLLM = process.env.ENABLE_LLM === 'true';
    
    if (this.enableLLM && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Generate explanation for payment routing decision
   */
  async generatePaymentExplanation(
    request: ChargeRequest,
    riskScore: number,
    provider: string,
    riskFactors: string[]
  ): Promise<string> {
    if (!this.enableLLM || !this.openai) {
      return this.generateFallbackExplanation(riskScore, provider, riskFactors);
    }

    const cacheKey = this.createCacheKey('payment', { riskScore, provider, riskFactors });
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const prompt = this.createPaymentPrompt(request, riskScore, provider, riskFactors);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection system explaining payment routing decisions. Be concise, professional, and clear about the reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      const explanation = response.choices[0]?.message?.content?.trim() || 
        this.generateFallbackExplanation(riskScore, provider, riskFactors);

      this.setCache(cacheKey, explanation);
      return explanation;

    } catch (error) {
      console.error('LLM API error:', error);
      return this.generateFallbackExplanation(riskScore, provider, riskFactors);
    }
  }

  /**
   * Analyze campaign description and generate tags and summary
   */
  async analyzeCampaign(campaignDescription: string): Promise<CampaignAnalysis> {
    if (!this.enableLLM || !this.openai) {
      return this.generateFallbackCampaignAnalysis(campaignDescription);
    }

    const cacheKey = this.createCacheKey('campaign', { description: campaignDescription });
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const prompt = this.createCampaignPrompt(campaignDescription);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are analyzing charitable campaign descriptions. Extract relevant tags and create a one-sentence summary. Respond only with valid JSON in the format: {"tags": ["tag1", "tag2"], "summary": "Summary sentence"}'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return this.generateFallbackCampaignAnalysis(campaignDescription);
      }

      const analysis = JSON.parse(content) as CampaignAnalysis;
      this.setCache(cacheKey, JSON.stringify(analysis));
      return analysis;

    } catch (error) {
      console.error('LLM API error:', error);
      return this.generateFallbackCampaignAnalysis(campaignDescription);
    }
  }

  private createPaymentPrompt(
    request: ChargeRequest,
    riskScore: number,
    provider: string,
    riskFactors: string[]
  ): string {
    const amount = (request.amount / 100).toFixed(2); // Convert cents to dollars
    const factorsText = riskFactors.length > 0 ? riskFactors.join(', ') : 'standard transaction profile';
    
    return `Explain why a payment of $${amount} ${request.currency} was ${provider === 'blocked' ? 'blocked' : `routed to ${provider.toUpperCase()}`}. Risk score: ${riskScore.toFixed(2)}. Risk factors: ${factorsText}. Keep explanation under 50 words.`;
  }

  private createCampaignPrompt(campaignDescription: string): string {
    return `Analyze this charitable campaign: "${campaignDescription}". Extract 3-5 relevant tags and create a one-sentence summary.`;
  }

  private generateFallbackExplanation(riskScore: number, provider: string, riskFactors: string[]): string {
    const riskLevel = riskScore < 0.3 ? 'low' : riskScore < 0.5 ? 'moderate' : 'high';
    const factorsText = riskFactors.length > 0 ? ` due to ${riskFactors.join(' and ')}` : '';
    
    if (provider === 'blocked') {
      return `Transaction blocked due to ${riskLevel} risk score (${riskScore.toFixed(2)})${factorsText}.`;
    }
    
    return `Payment routed to ${provider.toUpperCase()} based on ${riskLevel} risk score (${riskScore.toFixed(2)})${factorsText}.`;
  }

  private generateFallbackCampaignAnalysis(campaignDescription: string): CampaignAnalysis {
    // Simple keyword-based analysis as fallback
    const tags: string[] = [];
    const description = campaignDescription.toLowerCase();
    
    if (description.includes('disaster') || description.includes('emergency') || description.includes('earthquake')) {
      tags.push('disaster relief');
    }
    if (description.includes('water') || description.includes('clean water')) {
      tags.push('clean water');
    }
    if (description.includes('food') || description.includes('hunger')) {
      tags.push('food aid');
    }
    if (description.includes('children') || description.includes('kids')) {
      tags.push('children');
    }
    if (description.includes('education') || description.includes('school')) {
      tags.push('education');
    }
    if (description.includes('health') || description.includes('medical')) {
      tags.push('healthcare');
    }

    // Extract location if possible
    const locations = ['nepal', 'haiti', 'syria', 'ukraine', 'somalia', 'yemen'];
    locations.forEach(location => {
      if (description.includes(location)) {
        tags.push(location);
      }
    });

    if (tags.length === 0) {
      tags.push('charitable cause');
    }

    const summary = campaignDescription.length > 100 
      ? `${campaignDescription.substring(0, 97)}...`
      : campaignDescription;

    return { tags, summary };
  }

  private createCacheKey(type: string, data: any): string {
    return `${type}_${JSON.stringify(data)}`;
  }

  private getFromCache(key: string): string | null {
    const cached = this.cache[key];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return cached.response;
  }

  private setCache(key: string, response: string): void {
    this.cache[key] = {
      response,
      timestamp: Date.now(),
      ttl: this.cacheTTL
    };
  }

  /**
   * Clear expired cache entries (can be called periodically)
   */
  clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      if (cached && now - cached.timestamp > cached.ttl) {
        delete this.cache[key];
      }
    });
  }
}