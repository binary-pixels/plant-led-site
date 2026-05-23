import productsData from '@/data/products.json';

export type ProductCategory = 'plant' | 'energy';

export interface Product {
  id: string;
  slug: string;
  name: Record<string, string>;
  category: ProductCategory;
  image: string;
  images: string[];
  description: Record<string, string>;
  specs: Record<string, Record<string, string>>;
  features: Record<string, string[]>;
}

export const products: Product[] = productsData as unknown as Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory | 'all'): Product[] {
  if (category === 'all') return products;
  return products.filter((p) => p.category === category);
}

export function getRelatedProducts(product: Product, count = 3): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, count);
}
