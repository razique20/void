/**
 * lib/whatsappCatalog.ts
 * WhatsApp Business API Catalog integration.
 * Fetches products from the WABA catalog, caches them locally,
 * and provides AI-friendly search/recommend functions.
 */

import connectDB from '@/lib/mongodb';
import WhatsAppCatalog from '@/models/WhatsAppCatalog';
import User from '@/models/User';

const FB_GRAPH_URL = 'https://graph.facebook.com/v25.0';

export interface WABAProduct {
  id: string;
  title: string;
  description?: string;
  availability?: string;
  condition?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  link?: string;
  status?: string;
  category?: string;
  variants?: WABAProductVariant[];
}

export interface WABAProductVariant {
  id: string;
  name: string;
  price: number;
  currency: string;
  availability?: string;
}

export interface CatalogSearchResult {
  products: WABAProduct[];
  total: number;
  query: string;
}

/**
 * Resolve the access token for a given user's WhatsApp credential.
 */
async function resolveAccessToken(
  userId: string,
  credentialId?: string
): Promise<{ accessToken: string; phoneNumberId: string } | null> {
  const user = await User.findOne({ clerkId: userId });
  if (!user) return null;

  // Try vault credential first
  if (credentialId) {
    const cred = user.whatsappCredentials?.find(
      (c: any) => c._id.toString() === credentialId
    );
    if (cred?.accessToken && cred.phoneNumberId) {
      return { accessToken: cred.accessToken, phoneNumberId: cred.phoneNumberId };
    }
  }

  // Fallback to legacy config
  if (user.whatsappConfig?.accessToken && user.whatsappConfig?.phoneNumberId) {
    return {
      accessToken: user.whatsappConfig.accessToken,
      phoneNumberId: user.whatsappConfig.phoneNumberId,
    };
  }

  // Fallback to first vault credential
  if (user.whatsappCredentials?.length > 0) {
    const first = user.whatsappCredentials[0];
    if (first.accessToken && first.phoneNumberId) {
      return { accessToken: first.accessToken, phoneNumberId: first.phoneNumberId };
    }
  }

  return null;
}

/**
 * Fetch products from the WhatsApp Business catalog via Graph API.
 * The wabaId (WhatsApp Business Account ID) is required for catalog access.
 */
export async function fetchCatalogProducts(
  userId: string,
  wabaId: string,
  credentialId?: string
): Promise<WABAProduct[]> {
  const auth = await resolveAccessToken(userId, credentialId);
  if (!auth) throw new Error('No valid WhatsApp credentials found');

  const products: WABAProduct[] = [];
  let after: string | undefined;

  // Paginate through all products
  do {
    const params = new URLSearchParams({
      access_token: auth.accessToken,
      limit: '100',
    });
    if (after) params.set('after', after);

    const url = `${FB_GRAPH_URL}/${wabaId}/products?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `WhatsApp API error ${res.status}: ${err.error?.message || 'Unknown error'}`
      );
    }

    const data = await res.json();
    if (data.data) {
      products.push(...data.data.map((p: any) => normalizeProduct(p)));
    }
    after = data.paging?.cursors?.after;
  } while (after);

  return products;
}

/**
 * Normalize a raw Graph API product into our interface.
 */
function normalizeProduct(raw: any): WABAProduct {
  const variant = raw.variants?.[0]; // WhatsApp typically has one default variant
  return {
    id: raw.id,
    title: raw.title || 'Untitled',
    description: raw.description || '',
    availability: raw.availability || 'in stock',
    condition: raw.condition || 'new',
    price: variant?.price || raw.price || 0,
    currency: variant?.currency || raw.currency || 'USD',
    image_url: raw.image_url || raw.retailer_id || '',
    link: raw.link || '',
    status: raw.status || 'ACTIVE',
    category: raw.category || '',
    variants: raw.variants?.map((v: any) => ({
      id: v.id,
      name: v.name || '',
      price: v.price || 0,
      currency: v.currency || 'USD',
      availability: v.availability || 'in stock',
    })),
  };
}

/**
 * Sync catalog products from WhatsApp API and cache in MongoDB.
 * Returns the count of products synced.
 */
export async function syncCatalogToDatabase(
  userId: string,
  wabaId: string,
  credentialId?: string
): Promise<{ synced: number; products: WABAProduct[] }> {
  await connectDB();

  const products = await fetchCatalogProducts(userId, wabaId, credentialId);

  // Upsert each product
  for (const product of products) {
    await WhatsAppCatalog.findOneAndUpdate(
      { userId, productId: product.id },
      {
        userId,
        productId: product.id,
        title: product.title,
        description: product.description || '',
        availability: product.availability || 'in stock',
        condition: product.condition || 'new',
        price: product.price || 0,
        currency: product.currency || 'USD',
        imageUrl: product.image_url || '',
        link: product.link || '',
        status: product.status || 'ACTIVE',
        category: product.category || '',
        variants: product.variants || [],
        wabaId,
        lastSyncedAt: new Date(),
      },
      { upsert: true }
    );
  }

  // Mark any products not in the latest sync as inactive
  const syncedIds = products.map((p) => p.id);
  if (syncedIds.length > 0) {
    await WhatsAppCatalog.updateMany(
      { userId, productId: { $nin: syncedIds }, isActive: true },
      { $set: { isActive: false } }
    );
  }

  // Also reactivate any that were previously inactive but are now present
  if (syncedIds.length > 0) {
    await WhatsAppCatalog.updateMany(
      { userId, productId: { $in: syncedIds } },
      { $set: { isActive: true } }
    );
  }

  return { synced: products.length, products };
}

/**
 * Search cached catalog products by keyword.
 * Returns matching products ranked by relevance.
 */
export async function searchCatalog(
  userId: string,
  query: string,
  limit: number = 10
): Promise<CatalogSearchResult> {
  await connectDB();

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (keywords.length === 0) {
    // No keywords, return recent active products
    const products = await WhatsAppCatalog.find({ userId, isActive: true })
      .sort({ lastSyncedAt: -1 })
      .limit(limit)
      .lean();

    return { products: products.map(normalizeCachedProduct), total: products.length, query };
  }

  // Score-based search across title and description
  const allProducts = await WhatsAppCatalog.find({ userId, isActive: true }).lean();

  const scored = allProducts
    .map((doc) => {
      let score = 0;
      const titleLower = (doc.title || '').toLowerCase();
      const descLower = (doc.description || '').toLowerCase();

      for (const kw of keywords) {
        // Exact title match (highest weight)
        if (titleLower === kw) score += 10;
        // Title contains keyword
        else if (titleLower.includes(kw)) score += 5;
        // Description contains keyword
        if (descLower.includes(kw)) score += 2;
        // Category match
        if ((doc.category || '').toLowerCase().includes(kw)) score += 3;
      }

      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    products: scored.map((item) => normalizeCachedProduct(item.doc)),
    total: scored.length,
    query,
  };
}

/**
 * Get a single product by ID from the cache.
 */
export async function getProductById(
  userId: string,
  productId: string
): Promise<WABAProduct | null> {
  await connectDB();
  const doc = await WhatsAppCatalog.findOne({ userId, productId, isActive: true }).lean();
  return doc ? normalizeCachedProduct(doc) : null;
}

/**
 * Build an AI-friendly prompt snippet listing top products for the conversation context.
 * Used by the system prompt injector in the webhook handler.
 */
export async function buildCatalogPrompt(
  userId: string,
  recentMessage?: string,
  maxProducts: number = 8
): Promise<string> {
  let products: WABAProduct[];

  if (recentMessage) {
    const searchResult = await searchCatalog(userId, recentMessage, maxProducts);
    products = searchResult.products;
  } else {
    const cached = await WhatsAppCatalog.find({ userId, isActive: true })
      .sort({ lastSyncedAt: -1 })
      .limit(maxProducts)
      .lean();
    products = cached.map(normalizeCachedProduct);
  }

  if (products.length === 0) {
    return '\n\nPRODUCT CATALOG: No products are currently synced from the WhatsApp Business Catalog.';
  }

  const productList = products
    .map(
      (p) =>
        `- ${p.title} (ID: ${p.id})` +
        `${p.price ? ` — $${p.price} ${p.currency}` : ''}` +
        `${p.description ? `\n  ${p.description.substring(0, 120)}` : ''}`
    )
    .join('\n');

  return `\n\nPRODUCT CATALOG (available products from your WhatsApp Business Catalog):
${productList}

When a customer asks about products, pricing, availability, or recommendations, use the above catalog data to answer. Be helpful and specific about pricing and availability. If they want to see a product, you can share the product link if available.`;
}

/**
 * Normalize a cached Mongoose document to the WABAProduct interface.
 */
function normalizeCachedProduct(doc: any): WABAProduct {
  return {
    id: doc.productId,
    title: doc.title,
    description: doc.description,
    availability: doc.availability,
    condition: doc.condition,
    price: doc.price,
    currency: doc.currency,
    image_url: doc.imageUrl,
    link: doc.link,
    status: doc.status,
    category: doc.category,
    variants: doc.variants || [],
  };
}
