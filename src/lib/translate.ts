const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Map our locale codes to DeepL target language codes
const localeToDeepL: Record<string, string> = {
  en: 'EN',
  zh: 'ZH',
  es: 'ES',
  ja: 'JA',
  ko: 'KO',
  de: 'DE',
  fi: 'FI',
};

export async function translateText(
  text: string,
  targetLocale: string
): Promise<string | null> {
  if (!DEEPL_API_KEY) return null;
  if (!text.trim()) return null;

  const targetLang = localeToDeepL[targetLocale];
  if (!targetLang) return null;

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text,
        target_lang: targetLang,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.translations?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

/**
 * Translate a message to multiple target languages.
 * Returns a map of locale -> translated text.
 */
export async function translateToLanguages(
  text: string,
  targetLocales: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const translations = await Promise.all(
    targetLocales.map((locale) => translateText(text, locale))
  );

  targetLocales.forEach((locale, i) => {
    if (translations[i]) {
      results[locale] = translations[i];
    }
  });

  return results;
}

export function getSupportedLocales(): string[] {
  return Object.keys(localeToDeepL);
}
