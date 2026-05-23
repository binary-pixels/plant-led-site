import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'es', 'ja', 'ko', 'de', 'fi'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
