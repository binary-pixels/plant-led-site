import { setRequestLocale } from 'next-intl/server';
import { products, getProductBySlug } from '@/lib/products';
import ProductDetailClient from './product-detail-client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const name = product.name[locale as keyof typeof product.name] ?? product.name.en;
  const desc =
    product.description[locale as keyof typeof product.description] ??
    product.description.en;

  return {
    title: `${name} | GreenLedTech`,
    description: desc,
    openGraph: {
      title: name,
      description: desc,
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <ProductDetailClient product={product} />
  );
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}
