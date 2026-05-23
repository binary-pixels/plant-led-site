'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { products } from '@/lib/products';
import ProductCard from '@/components/products/product-card';

export default function FeaturedProducts() {
  const t = useTranslations('featured');
  const featured = products.slice(0, 4);

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {t('title')}
            </h2>
            <div className="mt-2 w-16 h-1 bg-purple-600 rounded" />
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            {t('viewAll')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            {t('viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
