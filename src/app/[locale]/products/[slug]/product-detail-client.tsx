'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { type Product } from '@/lib/products';
import { useProducts } from '@/lib/products-context';
import { useChat } from '@/components/chat/chat-widget';
import ProductCard from '@/components/products/product-card';
import ProductImage from '@/components/products/product-image';

export default function ProductDetailClient({
  product,
}: {
  product: Product;
}) {
  const t = useTranslations('products');
  const ct = useTranslations('chat');
  const locale = useLocale();
  const { open } = useChat();
  const { getRelatedProducts } = useProducts();

  const related = getRelatedProducts(product);
  const specs = product.specs[locale as keyof typeof product.specs] ?? {};
  const features = product.features[locale as keyof typeof product.features] ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-purple-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-purple-600">{t('title')}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">
          {product.name[locale as keyof typeof product.name]}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden">
            <ProductImage product={product} className="w-full h-full" />
          </div>
          <div className="mt-4 flex gap-3">
            {product.images.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-lg overflow-hidden"
              >
                <ProductImage product={product} className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-4 ${
            product.category === 'plant'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {product.category === 'plant' ? t('plant') : t('energy')}
          </span>

          <h1 className="text-3xl font-bold text-gray-900">
            {product.name[locale as keyof typeof product.name]}
          </h1>

          <p className="mt-4 text-gray-600 leading-relaxed">
            {product.description[locale as keyof typeof product.description]}
          </p>

          {/* Features */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-900 mb-3">{t('features')}</h3>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Inquire Button */}
          <button
            onClick={open}
            className="mt-8 w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {t('inquire')}
          </button>
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('specs')}</h2>
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
          <table className="w-full">
            <tbody>
              {Object.entries(specs).map(([key, value], i) => (
                <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 w-1/3">
                    {key}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('relatedProducts')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
