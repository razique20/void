import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import WhatsAppCatalog from '@/models/WhatsAppCatalog';
import User from '@/models/User';
import { getUserSubscription } from '@/lib/subscription';
import {
  syncCatalogToDatabase,
  searchCatalog,
  getProductById,
} from '@/lib/whatsappCatalog';

/**
 * GET /api/whatsapp-catalog
 * - ?q=<query>  → search products
 * - ?productId=<id> → get single product
 * - Otherwise → list all synced products
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    // Check subscription feature
    const sub = await getUserSubscription(userId);
    if (!sub.planInfo?.features?.includes('whatsapp_catalog')) {
      return NextResponse.json(
        { error: 'WhatsApp Catalog is available on Pro and Enterprise plans.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const productId = searchParams.get('productId');

    await connectDB();

    // Single product lookup
    if (productId) {
      const product = await getProductById(userId, productId);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    // Search products
    if (query) {
      const results = await searchCatalog(userId, query, 20);
      return NextResponse.json(results);
    }

    // List all products
    const products = await WhatsAppCatalog.find({ userId, isActive: true })
      .sort({ lastSyncedAt: -1 })
      .lean();

    const total = await WhatsAppCatalog.countDocuments({ userId });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.productId,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        imageUrl: p.imageUrl,
        link: p.link,
        availability: p.availability,
        status: p.status,
        category: p.category,
        lastSyncedAt: p.lastSyncedAt,
      })),
      total,
      syncedCount: products.length,
    });
  } catch (error: any) {
    console.error('[WHATSAPP_CATALOG_GET]', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp-catalog
 * Sync products from WhatsApp Business API to local cache.
 * Body: { wabaId: string, credentialId?: string }
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    // Check subscription feature
    const sub = await getUserSubscription(userId);
    if (!sub.planInfo?.features?.includes('whatsapp_catalog')) {
      return NextResponse.json(
        { error: 'WhatsApp Catalog is available on Pro and Enterprise plans.' },
        { status: 403 }
      );
    }

    const { wabaId, credentialId } = await req.json();

    if (!wabaId || !wabaId.trim()) {
      return NextResponse.json(
        { error: 'WhatsApp Business Account ID (wabaId) is required.' },
        { status: 400 }
      );
    }

    const result = await syncCatalogToDatabase(userId, wabaId.trim(), credentialId);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `Synced ${result.synced} products from WhatsApp Business Catalog.`,
    });
  } catch (error: any) {
    console.error('[WHATSAPP_CATALOG_POST]', error);

    const msg = error.message || '';

    // Detect expired / invalid WhatsApp access token
    if (
      msg.includes('Session has expired') ||
      msg.includes('Error validating access token') ||
      msg.includes('Invalid OAuth access token')
    ) {
      return NextResponse.json(
        {
          error: 'WhatsApp access token has expired.',
          hint:
            'Your WhatsApp access token is no longer valid. Please generate a new token in the Facebook Developer Portal (WhatsApp → API Setup) and reconnect in your WhatsApp settings.',
          code: 'TOKEN_EXPIRED',
        },
        { status: 401 }
      );
    }

    // No credentials configured
    if (msg.includes('No valid WhatsApp credentials found')) {
      return NextResponse.json(
        {
          error: 'No WhatsApp credentials configured.',
          hint:
            'Connect your WhatsApp Business account in Settings → WhatsApp before syncing your catalog.',
          code: 'NO_CREDENTIALS',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to sync catalog' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp-catalog?id=<productId>
 * Remove a single product from the local cache.
 */
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await connectDB();

    const deleted = await WhatsAppCatalog.findOneAndDelete({
      userId,
      productId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product removed from cache.' });
  } catch (error: any) {
    console.error('[WHATSAPP_CATALOG_DELETE]', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
