'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Tag,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BookmarkPlus,
  Ticket,
  X,
  Flame,
  Star,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Deal {
  _id: string;
  title: string;
  description?: string;
  images?: string[];
  country?: string;
  categoryId?: { _id: string; name: string; slug: string } | string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage: number;
  dealType?: string;
  validUntil?: string;
  isHot?: boolean;
  isFeatured?: boolean;
}

interface Redemption {
  message: string;
  redeemCode: string;
  displayCode: string;
  transactionId: string;
  redemptionUrl: string;
  customerLinkUrl: string;
  branding: { poweredBy: string; tagline: string; url: string };
}

function categoryName(deal: Deal): string | null {
  if (deal.categoryId && typeof deal.categoryId === 'object') return deal.categoryId.name;
  return null;
}

function dealTypeLabel(deal: Deal): string {
  if (deal.dealType === 'bogo') return 'BOGO';
  if (deal.dealType === 'flat') return 'FREE';
  return `${deal.discountPercentage}% OFF`;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDeals = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/deals?page=1');
      if (!res.ok) throw new Error('Failed to load deals');
      const data = await res.json();
      setDeals(data.deals || []);
      setTotal(data.total || 0);
    } catch {
      setError('Could not load deals right now. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const redeem = async (deal: Deal) => {
    setRedeemingId(deal._id);
    try {
      const res = await fetch('/api/deals/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal._id }),
      });
      if (!res.ok) throw new Error('Redeem failed');
      const data: Redemption = await res.json();
      setRedemption(data);
    } catch {
      showToast('Could not redeem this deal. Please try again.');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy to clipboard');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-apple-blue" />
            <h1 className="text-2xl font-extrabold tracking-tight">Exclusive Deals</h1>
          </div>
          <p className="text-sm text-silver font-medium">
            Curated partner offers, just for you.
            {total > 0 && (
              <span className="ml-1 text-foreground/70">{total} live deals.</span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchDeals(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-foreground/[0.06] dark:border-white/[0.06] text-silver hover:text-foreground hover:bg-foreground/[0.02] transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="glass border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-400 font-medium">{error}</p>
          <button
            onClick={() => fetchDeals()}
            className="mt-3 text-xs font-bold text-apple-blue hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 bg-foreground/[0.03] dark:bg-white/[0.02] animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : deals.length === 0 && !error ? (
        <div className="glass border border-foreground/[0.04] dark:border-white/[0.05] rounded-2xl p-12 text-center">
          <Tag className="h-8 w-8 text-silver mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">No deals available yet</p>
          <p className="text-xs text-silver mt-1">Check back soon for new offers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => {
            const cat = categoryName(deal);
            const img = deal.images?.[0];
            return (
              <motion.div
                key={deal._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border border-foreground/[0.04] dark:border-white/[0.05] rounded-2xl overflow-hidden group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-36 w-full bg-foreground/[0.04] dark:bg-white/[0.04]">
                  {img ? (
                    <Image
                      src={img}
                      alt={deal.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Ticket className="h-8 w-8 text-silver" />
                    </div>
                  )}

                  {/* Discount badge */}
                  <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-apple-blue text-white uppercase tracking-wider shadow-sm">
                    {dealTypeLabel(deal)}
                  </span>

                  {/* Hot / Featured flags */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {deal.isHot && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full bg-red-500 text-white uppercase tracking-wider shadow-sm">
                        <Flame className="h-3 w-3" /> Hot
                      </span>
                    )}
                    {deal.isFeatured && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full bg-amber-400 text-black uppercase tracking-wider shadow-sm">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  {cat && (
                    <span className="text-[10px] font-bold text-apple-blue uppercase tracking-wider mb-1">
                      {cat}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {deal.title}
                  </h3>
                  {deal.description && (
                    <p className="text-xs text-silver mt-1 line-clamp-2">{deal.description}</p>
                  )}

                  {deal.country && (
                    <div className="flex items-center gap-1 text-[10px] text-silver mt-2">
                      <MapPin className="h-3 w-3" />
                      {deal.country}
                    </div>
                  )}

                  {/* Price */}
                  {(deal.discountedPrice != null || deal.originalPrice != null) && (
                    <div className="flex items-baseline gap-2 mt-3">
                      {deal.discountedPrice != null && (
                        <span className="text-lg font-extrabold text-foreground">
                          ${deal.discountedPrice}
                        </span>
                      )}
                      {deal.originalPrice != null &&
                        deal.originalPrice !== deal.discountedPrice && (
                          <span className="text-xs text-silver line-through">
                            ${deal.originalPrice}
                          </span>
                        )}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => redeem(deal)}
                      disabled={redeemingId === deal._id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-apple-blue text-white hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {redeemingId === deal._id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Redeem Deal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Redemption modal */}
      <AnimatePresence>
        {redemption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setRedemption(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-foreground/[0.08] dark:border-white/[0.08] rounded-3xl p-7 w-full max-w-sm relative"
            >
              <button
                onClick={() => setRedemption(null)}
                className="absolute top-5 right-5 text-silver hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-1 mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-apple-blue/10 mb-2">
                  <Check className="h-6 w-6 text-apple-blue" />
                </div>
                <h2 className="text-lg font-extrabold text-foreground">Deal Unlocked!</h2>
                <p className="text-xs text-silver font-medium">
                  Save this code to your Offrion account to keep & track it.
                </p>
              </div>

              {/* Code */}
              <div className="bg-foreground/[0.04] dark:bg-white/[0.04] border border-dashed border-foreground/[0.1] dark:border-white/[0.1] rounded-2xl p-4 flex items-center justify-between gap-3 mb-4">
                <span className="font-mono font-bold text-base tracking-wider text-foreground">
                  {redemption.displayCode}
                </span>
                <button
                  onClick={() => copyCode(redemption.displayCode)}
                  className="flex items-center gap-1.5 text-xs font-bold text-apple-blue hover:opacity-80 transition-opacity"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Save the code into the user's Offrion account */}
              <a
                href={redemption.redemptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-apple-blue text-white hover:opacity-90 transition-all"
              >
                <BookmarkPlus className="h-4 w-4" />
                Save to my Offrion account
              </a>

              {redemption.branding && (
                <p className="text-center text-[10px] text-silver mt-4">
                  {redemption.branding.tagline} ·{' '}
                  <a
                    href={redemption.branding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:text-foreground"
                  >
                    {redemption.branding.poweredBy}
                  </a>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
