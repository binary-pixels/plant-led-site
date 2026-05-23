'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useProducts } from '@/lib/products-context';
import type { ProductCategory } from '@/lib/products-context';
import ProductCard from '@/components/products/product-card';

const categories: { key: ProductCategory | 'all'; filter: string }[] = [
  { key: 'all', filter: '' },
  { key: 'plant', filter: 'plant' },
  { key: 'energy', filter: 'energy' },
];

export default function ProductsPageClient({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const t = useTranslations('products');
  const { products } = useProducts();
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>(
    initialCategory === 'plant' || initialCategory === 'energy'
      ? (initialCategory as ProductCategory)
      : 'all'
  );

  const filtered = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-left mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {t('title')}
        </h1>
        <div className="mt-2 w-16 h-1 bg-purple-600 rounded" />
      </div>

      {/* Category Filter */}
      <div className="flex justify-center gap-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(cat.key)}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No products found.</p>
      )}
    </div>
  );
}
