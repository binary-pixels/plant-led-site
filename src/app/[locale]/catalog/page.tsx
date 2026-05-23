'use client';

import { useTranslations } from 'next-intl';
import { products } from '@/lib/products';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function CatalogPage() {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Product Catalog
        </h1>
        <div className="mt-2 w-16 h-1 bg-purple-600 rounded mx-auto" />
        <p className="mt-4 text-gray-600">
          Browse our complete product catalog. Contact us for pricing and bulk orders.
        </p>
      </div>

      <div className="space-y-8">
        {/* Plant Grow Lights */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            {t('plant')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products
              .filter((p) => p.category === 'plant')
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-sm transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-emerald-50 flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {p.name[locale as keyof typeof p.name]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {p.specs[locale as keyof typeof p.specs]?.['Power'] ?? p.specs.en['Power']}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Energy Saving Lights */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            {t('energy')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products
              .filter((p) => p.category === 'energy')
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-50 flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {p.name[locale as keyof typeof p.name]}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {p.specs[locale as keyof typeof p.specs]?.['Power'] ?? p.specs.en['Power']}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm mb-4">
          To download a PDF version or request a printed catalog, please contact us.
        </p>
        <Link
          href="/about"
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Contact Us for Catalog
        </Link>
      </div>
    </div>
  );
}
