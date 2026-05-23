'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getRelatedProducts: (product: Product, count?: number) => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  );

  const getRelatedProducts = useCallback(
    (product: Product, count = 3) =>
      products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, count),
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        refetch: fetchProducts,
        getProductBySlug,
        getRelatedProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return ctx;
}
