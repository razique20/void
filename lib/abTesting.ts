import crypto from 'crypto';
import ABTest from '@/models/ABTest';
import { Types } from 'mongoose';

export interface VariantAssignment {
  variantId: Types.ObjectId;
  variantName: string;
  workerId: Types.ObjectId;
  isControl: boolean;
  overrides?: {
    personality?: string;
    tone?: string;
    language?: string;
    trainingDataIds?: Types.ObjectId[];
  };
}

/**
 * Deterministic hash function for consistent user assignment
 * Uses SHA-256 to distribute users evenly across variants
 */
function deterministicHash(input: string): number {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  // Convert first 8 hex chars to a number between 0 and 1
  const hex = hash.substring(0, 8);
  return parseInt(hex, 16) / 0xffffffff;
}

/**
 * Assign a user to a variant based on their identifier
 * Uses deterministic hashing for consistent assignment
 */
export function assignToVariant(
  userId: string,
  testId: string,
  variants: Array<{
    _id: Types.ObjectId;
    name: string;
    workerId: Types.ObjectId;
    trafficPercentage: number;
    overrides?: any;
  }>
): VariantAssignment | null {
  if (!variants || variants.length === 0) return null;

  // Create a deterministic seed from user + test
  const seed = `${userId}:${testId}`;
  const hash = deterministicHash(seed);

  // Calculate cumulative percentages
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.trafficPercentage / 100;
    
    // If hash falls within this variant's range, assign user
    if (hash < cumulative) {
      return {
        variantId: variant._id,
        variantName: variant.name,
        workerId: variant.workerId,
        isControl: variant.name.toLowerCase().includes('control'),
        overrides: variant.overrides,
      };
    }
  }

  // Fallback to last variant (handles floating point edge cases)
  const lastVariant = variants[variants.length - 1];
  return {
    variantId: lastVariant._id,
    variantName: lastVariant.name,
    workerId: lastVariant.workerId,
    isControl: lastVariant.name.toLowerCase().includes('control'),
    overrides: lastVariant.overrides,
  };
}

/**
 * Get the active A/B test for a worker
 */
export async function getActiveTestForWorker(
  workerId: string | Types.ObjectId,
  channel?: string
): Promise<any | null> {
  const query: any = {
    baseWorkerId: workerId,
    'config.status': 'running',
  };

  // Filter by channel if specified
  if (channel) {
    query['config.targeting.channels'] = { $in: [channel, 'all'] };
  }

  const test = await ABTest.findOne(query).sort({ createdAt: -1 });
  return test;
}

/**
 * Get variant assignment for a conversation
 * Returns cached assignment if exists, otherwise creates new one
 */
export async function getVariantForConversation(
  conversationId: string,
  externalId: string,
  test: any,
  channel: string
): Promise<VariantAssignment | null> {
  if (!test || !test.variants || test.variants.length === 0) {
    return null;
  }

  // Use externalId (customer identifier) for consistent assignment
  // This ensures the same customer always sees the same variant
  const assignment = assignToVariant(
    externalId,
    test._id.toString(),
    test.variants
  );

  return assignment;
}

/**
 * Record a metric for a variant
 */
export async function recordVariantMetric(
  testId: string | Types.ObjectId,
  variantId: string | Types.ObjectId,
  metricType: 'conversation' | 'message' | 'conversion' | 'satisfaction' | 'responseTime' | 'bounce',
  value: number = 1
): Promise<void> {
  const updateQuery: any = {};
  
  switch (metricType) {
    case 'conversation':
      updateQuery['$inc'] = {
        'variants.$.metrics.totalConversations': 1,
        'metrics.totalConversations': 1,
      };
      break;
    case 'message':
      updateQuery['$inc'] = {
        'variants.$.metrics.totalMessages': 1,
        'metrics.totalMessages': 1,
      };
      break;
    case 'conversion':
      updateQuery['$inc'] = {
        'variants.$.metrics.conversions': 1,
      };
      break;
    case 'satisfaction':
      updateQuery['$inc'] = {
        'variants.$.metrics.satisfactionSum': value,
        'variants.$.metrics.satisfactionCount': 1,
      };
      break;
    case 'responseTime':
      updateQuery['$inc'] = {
        'variants.$.metrics.avgResponseTime': value,
        'variants.$.metrics.responseTimeCount': 1,
      };
      break;
    case 'bounce':
      updateQuery['$inc'] = {
        'variants.$.metrics.bounceRate': 1,
      };
      break;
  }

  await ABTest.findOneAndUpdate(
    { _id: testId, 'variants._id': variantId },
    updateQuery
  );
}

/**
 * Calculate conversion rate for a variant
 */
export function calculateConversionRate(variant: any): number {
  if (variant.metrics.totalConversations === 0) return 0;
  return (variant.metrics.conversions / variant.metrics.totalConversations) * 100;
}

/**
 * Calculate average satisfaction score for a variant
 */
export function calculateAvgSatisfaction(variant: any): number {
  if (variant.metrics.satisfactionCount === 0) return 0;
  return variant.metrics.satisfactionSum / variant.metrics.satisfactionCount;
}

/**
 * Calculate average response time for a variant
 */
export function calculateAvgResponseTime(variant: any): number {
  if (variant.metrics.responseTimeCount === 0) return 0;
  return variant.metrics.avgResponseTime / variant.metrics.responseTimeCount;
}

/**
 * Simple statistical significance test (Z-test for proportions)
 * Returns p-value indicating if the difference is statistically significant
 */
export function calculateStatisticalSignificance(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number
): { pValue: number; isSignificant: boolean; confidenceLevel: number } {
  if (controlTotal === 0 || variantTotal === 0) {
    return { pValue: 1, isSignificant: false, confidenceLevel: 0 };
  }

  const p1 = controlConversions / controlTotal;
  const p2 = variantConversions / variantTotal;
  
  // Pooled proportion
  const pPool = (controlConversions + variantConversions) / (controlTotal + variantTotal);
  
  // Standard error
  const se = Math.sqrt(
    pPool * (1 - pPool) * (1/controlTotal + 1/variantTotal)
  );
  
  if (se === 0) {
    return { pValue: 1, isSignificant: false, confidenceLevel: 0 };
  }
  
  // Z-score
  const z = (p2 - p1) / se;
  
  // Approximate p-value using normal distribution
  // For two-tailed test
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  return {
    pValue,
    isSignificant: pValue < 0.05, // 95% confidence level
    confidenceLevel: (1 - pValue) * 100,
  };
}

/**
 * Approximate cumulative distribution function for standard normal distribution
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Determine the winning variant based on primary metric
 */
export function determineWinner(
  variants: any[],
  primaryMetric: 'conversion' | 'satisfaction' | 'engagement' = 'conversion'
): { winnerId: Types.ObjectId; confidence: number } | null {
  if (variants.length < 2) return null;

  let bestVariant = variants[0];
  let bestScore = 0;

  for (const variant of variants) {
    let score = 0;
    
    switch (primaryMetric) {
      case 'conversion':
        score = calculateConversionRate(variant);
        break;
      case 'satisfaction':
        score = calculateAvgSatisfaction(variant);
        break;
      case 'engagement':
        // Engagement score = (messages per conversation) * (1 - bounce rate)
        const msgsPerConv = variant.metrics.totalConversations > 0 
          ? variant.metrics.totalMessages / variant.metrics.totalConversations 
          : 0;
        const bounceRate = variant.metrics.totalConversations > 0
          ? variant.metrics.bounceRate / variant.metrics.totalConversations
          : 0;
        score = msgsPerConv * (1 - bounceRate);
        break;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  }

  return {
    winnerId: bestVariant._id,
    confidence: bestVariant.metrics.totalConversations >= 30 ? 95 : 80,
  };
}
