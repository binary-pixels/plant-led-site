import { products } from '@/lib/products';
import type { MetadataRoute } from 'next';

const locales = ['en', 'zh', 'es', 'ja', 'ko', 'de', 'fi'];
const baseUrl = 'https://greenledtech.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  const staticPages = ['', '/about', '/products'];
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }
  }

  // Product pages for each locale
  for (const locale of locales) {
    for (const product of products) {
      entries.push({
        url: `${baseUrl}/${locale}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
