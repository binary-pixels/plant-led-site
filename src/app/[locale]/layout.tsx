import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ChatWidget from "@/components/chat/chat-widget";
import { ChatProvider } from "@/components/chat/chat-context";
import LiveChat from "@/components/chat/live-chat";
import WhatsAppButton from "@/components/chat/whatsapp-button";
import CookieConsent from "@/components/layout/cookie-consent";
import Analytics from "@/components/layout/analytics";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      <ChatProvider>
        <Analytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <LiveChat />
        <WhatsAppButton />
        <CookieConsent />
      </ChatProvider>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
