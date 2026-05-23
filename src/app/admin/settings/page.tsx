'use client';

import { useState, useEffect, useCallback } from 'react';

const LOCALES = ['en', 'zh', 'es'] as const;
const LOCALE_NAMES: Record<string, string> = { en: 'English', zh: '中文', es: 'Español' };

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch {
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function update(path: string, value: any) {
    setSettings((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage('Settings saved');
    } catch {
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <details className="bg-white rounded-xl border border-gray-200 overflow-hidden" open>
      <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 sticky top-0 bg-white z-10">
        {title}
      </summary>
      <div className="px-6 pb-6 space-y-4">{children}</div>
    </details>
  );

  const LocaleFields = ({ label, path }: { label: string; path: string }) => (
    <div className="border border-gray-100 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {LOCALES.map((locale) => (
        <div key={locale} className="flex items-start gap-2">
          <span className="text-xs font-medium text-purple-600 w-16 pt-2 shrink-0">
            {LOCALE_NAMES[locale]}
          </span>
          <div className="flex-1 space-y-2">
            {['title', 'subtitle', 'cta', 'learnMore', 'desc', 'desc1', 'desc2'].map((field) => {
              const fullPath = `${path}.${locale}.${field}`;
              const val = fullPath.split('.').reduce((o, k) => o?.[k], settings as any);
              if (val === undefined) return null;
              const isLong = field === 'desc' || field === 'desc1' || field === 'desc2' || field === 'subtitle';
              return (
                <div key={field}>
                  <label className="text-xs text-gray-400 block mb-0.5">{field}</label>
                  {isLong ? (
                    <textarea
                      value={val}
                      onChange={(e) => update(fullPath, e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  ) : (
                    <input
                      value={val}
                      onChange={(e) => update(fullPath, e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.includes('fail') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      {/* Contact Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              value={settings?.contact?.email || ''}
              onChange={(e) => update('contact.email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              value={settings?.contact?.phone || ''}
              onChange={(e) => update('contact.phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Hero */}
      <Section title="Hero Section">
        <LocaleFields label="Hero Content" path="hero" />
      </Section>

      {/* Plant Category */}
      <Section title="Plant Grow Lights Category Card">
        <LocaleFields label="Card Content" path="plantCategory" />
      </Section>

      {/* Energy Category */}
      <Section title="Energy-Saving Lights Category Card">
        <LocaleFields label="Card Content" path="energyCategory" />
      </Section>

      {/* About */}
      <Section title="About Page">
        <LocaleFields label="About Content" path="about" />
      </Section>

      {/* Features */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Features (Why Choose Us)</h2>
        {settings?.features?.map((_: any, i: number) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3">
            <p className="text-xs text-gray-400 mb-2">Feature #{i + 1}</p>
            {LOCALES.map((locale) => (
              <div key={locale} className="flex items-start gap-2 mb-2">
                <span className="text-xs font-medium text-purple-600 w-16 pt-2 shrink-0">
                  {LOCALE_NAMES[locale]}
                </span>
                <div className="flex-1 space-y-1">
                  <input
                    value={settings.features[i]?.[locale]?.title || ''}
                    onChange={(e) => update(`features.${i}.${locale}.title`, e.target.value)}
                    placeholder="Title"
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <textarea
                    value={settings.features[i]?.[locale]?.desc || ''}
                    onChange={(e) => update(`features.${i}.${locale}.desc`, e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Footer */}
      <Section title="Footer">
        <LocaleFields label="Footer Text" path="footer" />
      </Section>
    </div>
  );
}
