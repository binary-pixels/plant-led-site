'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/settings-context';
import { Link } from '@/i18n/navigation';

const images = [
  '/images/hero/product-showcase.jpg',
  '/images/hero/product-showcase-2.jpg',
];

export default function Hero() {
  const locale = useLocale();
  const { settings } = useSettings();
  const [current, setCurrent] = useState(0);

  const heroContent = settings?.hero?.[locale] ?? settings?.hero?.en ?? null;

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background images - crossfade carousel */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white">
            {heroContent?.title || 'Professional LED Grow Lights'}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white leading-relaxed">
            {heroContent?.subtitle || ''}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition-colors"
            >
              {heroContent?.cta || 'Explore Products'}
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              {heroContent?.learnMore || 'Learn More'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
