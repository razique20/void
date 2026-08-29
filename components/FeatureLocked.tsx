'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

interface FeatureLockedProps {
  title: string;
  description: string;
}

export default function FeatureLocked({ title, description }: FeatureLockedProps) {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center text-center p-6 text-foreground relative">
      {/* Ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-apple-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md mx-auto text-center py-16 px-6 bg-bg-subtle-alt border border-border-default rounded-2xl backdrop-blur-3xl shadow-sm relative z-10">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-3 text-foreground">{title}</h2>
        <p className="text-silver text-xs leading-relaxed mb-8">
          {description}
        </p>
        <Link
          href="/billing"
          className="inline-flex items-center justify-center bg-foreground text-background px-8 py-3.5 rounded-full text-xs font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
