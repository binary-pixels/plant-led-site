'use client';

import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Product } from '@/lib/products';
import ProductImage from './product-image';

export default function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations('products');

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-300"
    >
      <div className="aspect-square relative overflow-hidden">
        <ProductImage product={product} className="w-full h-full" />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            product.category === 'plant'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {product.category === 'plant' ? t('plant') : t('energy')}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
          {product.name[locale as keyof typeof product.name]}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {product.description[locale as keyof typeof product.description]}
        </p>
        <div className="mt-3 flex items-center text-sm text-purple-600 font-medium">
          {t('viewDetail')} →
        </div>
      </div>
    </Link>
  );
}
