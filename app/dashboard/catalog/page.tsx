'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Package,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  ShoppingBag,
  Tag,
  Image as ImageIcon,
  PackageCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/useToast';
import { useData } from '@/lib/DataContext';
import FeatureLocked from '@/components/FeatureLocked';

interface CatalogProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  link: string;
  availability: string;
  status: string;
  category: string;
  lastSyncedAt?: string;
}

export default function WhatsAppCatalogPage() {
  const { sub, hasFeature } = useData();
  const { showToast, Toast } = useToast();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogProduct[] | null>(null);
  const [wabaId, setWabaId] = useState('');
  const [syncCount, setSyncCount] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const canAccess = hasFeature('whatsapp_catalog');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp-catalog');
      const data = await res.json();

      if (res.ok) {
        setProducts(data.products || []);
        setSyncCount(data.syncedCount || 0);
      } else if (res.status === 403) {
        // Feature locked — products stay empty
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) fetchProducts();
  }, [canAccess, fetchProducts]);

  const handleSync = async () => {
    if (!wabaId.trim()) {
      showToast('Please enter your WhatsApp Business Account ID', 'error');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wabaId: wabaId.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Synced ${data.synced} products from WhatsApp Business Catalog`, 'success');
        fetchProducts();
      } else {
        // Show hint if available (e.g. expired token guidance)
        const message = data.hint
          ? `${data.error} ${data.hint}`
          : data.error || 'Failed to sync catalog';
        showToast(message, 'error');
      }
    } catch (err: any) {
      showToast('Failed to sync catalog', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch(`/api/whatsapp-catalog?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (res.ok) {
        setSearchResults(data.products || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleDelete = async (productId: string) => {
    setDeleting(productId);
    try {
      const res = await fetch(`/api/whatsapp-catalog?id=${productId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed', 'success');
        fetchProducts();
        setSearchResults((prev) =>
          prev ? prev.filter((p) => p.id !== productId) : prev
        );
      } else {
        showToast('Failed to remove product', 'error');
      }
    } catch {
      showToast('Failed to remove product', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (!canAccess) {
    return (
      <FeatureLocked
        title="WhatsApp Catalog"
        description="Sync your WhatsApp Business Catalog to let your AI agent browse and recommend products during conversations. Available on Pro and Enterprise plans."
      />
    );
  }

  const displayProducts = searchResults !== null ? searchResults : products;

  return (
    <div className="min-h-[calc(100vh-100px)] w-full relative">
      {/* Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {Toast}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-green-500" />
              WhatsApp Catalog
            </h1>
            <p className="text-xs text-silver mt-1">
              Sync and manage your WhatsApp Business Catalog products. Your AI agent uses these
              products to recommend items during WhatsApp conversations.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Section */}
      <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-green-500" />
          Sync Catalog
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="WhatsApp Business Account ID (WABA ID)"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            className="flex-1 bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-silver/50 focus:outline-none"
          />
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              'px-6 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2',
              syncing
                ? 'bg-bg-elevated text-silver/50 cursor-not-allowed'
                : 'bg-foreground text-background'
            )}
          >
            {syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Sync Products
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-silver mt-2">
          Enter your WhatsApp Business Account ID to fetch all products from your catalog.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-bg-subtle border border-border-default rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Search Products
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name, description, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() === '') setSearchResults(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-bg-elevated border border-border-default rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-silver/50 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold transition-all hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-500" />
          {searchResults !== null
            ? `Search Results (${displayProducts.length})`
            : `Synced Products (${syncCount})`}
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-bg-subtle border border-border-default rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="text-center py-16 bg-bg-subtle rounded-2xl border border-border-default">
          <Package className="w-16 h-16 text-silver/30 mx-auto mb-4" />
          <p className="text-lg font-bold text-silver">
            {searchResults !== null
              ? 'No products match your search.'
              : 'No products synced yet.'}
          </p>
          <p className="text-xs text-silver/60 mt-2 max-w-md mx-auto">
            {searchResults !== null
              ? 'Try a different search term or sync your catalog first.'
              : 'Enter your WABA ID above and click "Sync Products" to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-bg-subtle border border-border-default rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Product Image */}
              {product.imageUrl ? (
                <div className="h-40 bg-bg-elevated flex items-center justify-center overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-40 bg-bg-elevated flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-silver/30" />
                </div>
              )}

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {product.title}
                  </h3>
                  <span
                    className={cn(
                      'shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold',
                      product.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    )}
                  >
                    {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {product.description && (
                  <p className="text-[10px] text-silver mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-3">
                  {product.price > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-500">
                        {product.currency} {product.price.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-silver">
                    {product.availability || 'In stock'}
                  </span>
                </div>

                {product.category && (
                  <div className="text-[10px] text-silver mb-3">
                    Category: {product.category}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] bg-bg-elevated hover:bg-bg-surface text-silver rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] bg-bg-elevated hover:bg-red-500/10 text-silver hover:text-red-500 rounded-lg transition-colors"
                  >
                    {deleting === product.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
