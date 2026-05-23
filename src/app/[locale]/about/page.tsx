'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSettings } from '@/lib/settings-context';
import { useChat } from '@/components/chat/chat-widget';

export default function AboutPage() {
  const locale = useLocale();
  const { settings } = useSettings();
  const t = useTranslations('about');
  const ct = useTranslations('chat');
  const about = settings?.about?.[locale] ?? settings?.about?.en ?? { subtitle: '', desc1: '', desc2: '' };
  const { open } = useChat();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {t('title')}
        </h1>
        <p className="mt-2 text-lg text-gray-600">{about.subtitle}</p>
        <div className="mt-2 w-16 h-1 bg-purple-600 rounded mx-auto" />
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto space-y-6 text-gray-600 leading-relaxed">
        <p>{about.desc1}</p>
        <p>{about.desc2}</p>
      </div>

      {/* Values */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          {t('values.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quality */}
          <div className="text-center p-8 rounded-2xl bg-white border border-gray-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('values.quality.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('values.quality.desc')}
            </p>
          </div>

          {/* Innovation */}
          <div className="text-center p-8 rounded-2xl bg-white border border-gray-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('values.innovation.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('values.innovation.desc')}
            </p>
          </div>

          {/* Service */}
          <div className="text-center p-8 rounded-2xl bg-white border border-gray-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('values.service.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('values.service.desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('contact.title')}
        </h2>
        <p className="text-gray-600 mb-6">{t('contact.desc')}</p>
        <button
          onClick={open}
          className="inline-flex items-center px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {ct('button')}
        </button>
      </div>
    </div>
  );
}
