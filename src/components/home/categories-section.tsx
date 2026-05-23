'use client';

import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/settings-context';
import { Link } from '@/i18n/navigation';

export default function CategoriesSection() {
  const locale = useLocale();
  const { settings } = useSettings();
  const plant = settings?.plantCategory?.[locale] ?? settings?.plantCategory?.en ?? { title: 'LED Grow Lights', desc: '' };
  const energy = settings?.energyCategory?.[locale] ?? settings?.energyCategory?.en ?? { title: 'Energy-Saving Lights', desc: '' };

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Our Products
          </h2>
          <div className="mt-2 w-16 h-1 bg-purple-600 rounded mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plant Grow Lights */}
          <Link
            href="/products?category=plant"
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-600 to-purple-800 p-8 sm:p-12 text-white min-h-[280px] flex flex-col justify-end"
          >
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-white/5 rounded-full" />
            <h3 className="text-2xl sm:text-3xl font-bold relative">
              {plant.title}
            </h3>
            <p className="mt-3 text-purple-100 relative max-w-md">
              {plant.desc}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-yellow-300 group-hover:translate-x-1 transition-transform">
              Our Products →
            </span>
          </Link>

          {/* Energy Saving */}
          <Link
            href="/products?category=energy"
            className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-blue-800 p-8 sm:p-12 text-white min-h-[280px] flex flex-col justify-end"
          >
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-white/5 rounded-full" />
            <h3 className="text-2xl sm:text-3xl font-bold relative">
              {energy.title}
            </h3>
            <p className="mt-3 text-blue-100 relative max-w-md">
              {energy.desc}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-yellow-300 group-hover:translate-x-1 transition-transform">
              Our Products →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
