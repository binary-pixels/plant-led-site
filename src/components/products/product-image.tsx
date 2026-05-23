'use client';

import { useLocale } from 'next-intl';
import type { Product } from '@/lib/products';

const categoryColors: Record<string, { bg: string; icon: string; badge: string }> = {
  plant: {
    bg: 'from-purple-100 to-emerald-50',
    icon: '#9333ea',
    badge: 'bg-purple-100 text-purple-700',
  },
  energy: {
    bg: 'from-blue-100 to-cyan-50',
    icon: '#2563eb',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export default function ProductImage({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const locale = useLocale();
  const colors = categoryColors[product.category];

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} flex items-center justify-center relative overflow-hidden ${className}`}
    >
      {/* Decorative circles */}
      <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/40" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/30" />

      {/* Product icon */}
      <svg className="w-20 h-20 relative z-10" viewBox="0 0 80 80" fill="none">
        {product.category === 'plant' ? (
          // Leaf/plant icon for grow lights
          <>
            <circle cx="40" cy="40" r="38" stroke={colors.icon} strokeWidth="2" opacity="0.3" />
            <path d="M40 18v30M28 36c0-6 5-10 12-10s12 6 12 12" stroke={colors.icon} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M52 40c0 8-5 14-12 14s-12-6-12-14" stroke={colors.icon} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M40 48c-4 0-8-3-8-8" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M48 44c0 5-4 9-8 9" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
          </>
        ) : (
          // Lightbulb icon for energy-saving
          <>
            <circle cx="40" cy="40" r="38" stroke={colors.icon} strokeWidth="2" opacity="0.3" />
            <path d="M40 16c-9 0-16 7-16 16 0 6 3 11 8 14v6c0 1 1 2 2 2h12c1 0 2-1 2-2v-6c5-3 8-8 8-14 0-9-7-16-16-16z" stroke={colors.icon} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M34 42h12" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M36 48h8" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M38 52h4" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M36 28l-3 3" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M44 28l3 3" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
            <path d="M40 24v2" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
