'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useChat } from '@/components/chat/chat-widget';

export default function ContactSection() {
  const t = useTranslations('about.contact');
  const ct = useTranslations('chat');
  const { open } = useChat();

  return (
    <section className="py-16 sm:py-20 bg-linear-to-r from-purple-600 to-purple-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">{t('title')}</h2>
        <p className="mt-4 text-lg text-purple-100">{t('desc')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={open}
            className="inline-flex items-center px-8 py-3 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {ct('button')}
          </button>
          <Link
            href="/about"
            className="inline-flex items-center px-8 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            {t('title')}
          </Link>
        </div>
      </div>
    </section>
  );
}
