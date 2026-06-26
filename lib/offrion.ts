/**
 * Offrion Deals API client (server-side only).
 *
 * Provides access to partner deals and click-tracking / redemption codes.
 * The API key is secret and must never be exposed to the browser — all calls
 * go through our own /api/deals route handlers.
 */

const BASE_URL = process.env.OFFRION_BASE_URL;
const API_KEY = process.env.OFFRION_API_KEY;

export interface OffrionDeal {
  _id: string;
  title: string;
  description?: string;
  images?: string[];
  country?: string;
  categoryId?: { _id: string; name: string; slug: string } | string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage: number;
  dealType?: 'percentage' | 'bogo' | 'flat' | string;
  validUntil?: string;
  isHot?: boolean;
  isFeatured?: boolean;
  status?: string;
  [key: string]: unknown;
}

export interface OffrionDealsResponse {
  page: number;
  limit?: number;
  total: number;
  pages?: number;
  count?: number;
  deals: OffrionDeal[];
}

export interface OffrionTrackClickResponse {
  message: string;
  redeemCode: string;
  displayCode: string;
  transactionId: string;
  redemptionUrl: string;
  customerLinkUrl: string;
  branding: {
    poweredBy: string;
    tagline: string;
    url: string;
  };
}

function assertConfigured() {
  if (!BASE_URL || !API_KEY) {
    throw new Error(
      'Offrion is not configured. Set OFFRION_BASE_URL and OFFRION_API_KEY in your environment.'
    );
  }
}

async function offrionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  assertConfigured();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Offrion authenticates partners via the x-api-key header.
      'x-api-key': API_KEY!,
      ...init?.headers,
    },
    // Deals are partner-specific and time-sensitive; don't cache.
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Offrion API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch a page of available partner deals. */
export function getDeals(page = 1): Promise<OffrionDealsResponse> {
  return offrionFetch<OffrionDealsResponse>(`/deals?page=${page}`);
}

/**
 * Track a click on a deal and obtain a redemption code for the user.
 * `metadata` lets us attribute the click (e.g. source app, internal userId).
 */
export function trackClick(
  dealId: string,
  metadata: Record<string, unknown> = {}
): Promise<OffrionTrackClickResponse> {
  return offrionFetch<OffrionTrackClickResponse>('/partners/track-click', {
    method: 'POST',
    body: JSON.stringify({ dealId, metadata }),
  });
}
