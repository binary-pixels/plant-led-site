import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/home/hero';
import FeaturedProducts from '@/components/home/featured-products';
import Features from '@/components/home/features';
import ContactSection from '@/components/home/contact-section';
import CategoriesSection from '@/components/home/categories-section';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    en: 'GreenLedTech - Professional LED Grow Lights & Energy-Saving Solutions',
    zh: 'GreenLedTech - 专业 LED 植物灯 & 节能照明解决方案',
    es: 'GreenLedTech - Luces LED para Cultivo y Soluciones de Ahorro Energético',
    ja: 'GreenLedTech - プロ用LED植物育成ライト＆省エネソリューション',
    ko: 'GreenLedTech - 전문 LED 식물 재배등 & 에너지 절약 솔루션',
    de: 'GreenLedTech - Professionelle LED-Pflanzenlampen & Energiesparlösungen',
    fi: 'GreenLedTech - Ammattimaiset LED-kasvatusvalot & Energiansäästöratkaisut',
  };

  return {
    title: titles[locale] ?? titles.en,
    description:
      'High-quality LED grow lights for commercial greenhouses and energy-saving LED lighting solutions for industrial applications.',
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <CategoriesSection />
      <Features />
      <FeaturedProducts />
      <ContactSection />
    </>
  );
}
