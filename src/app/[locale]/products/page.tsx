import { setRequestLocale } from 'next-intl/server';
import ProductsPageClient from './products-page-client';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'Products | GreenLedTech',
    zh: '产品中心 | GreenLedTech',
    es: 'Productos | GreenLedTech',
    ja: '製品一覧 | GreenLedTech',
    ko: '제품 | GreenLedTech',
    de: 'Produkte | GreenLedTech',
    fi: 'Tuotteet | GreenLedTech',
  };

  return {
    title: titles[locale] ?? titles.en,
    description: 'Explore our range of LED grow lights and energy-saving lighting solutions.',
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  return <ProductsPageClient initialCategory={category} />;
}
