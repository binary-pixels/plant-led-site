'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface Settings {
  contact: { email: string; phone: string };
  hero: Record<string, { title: string; subtitle: string; cta: string; learnMore: string }>;
  plantCategory: Record<string, { title: string; desc: string }>;
  energyCategory: Record<string, { title: string; desc: string }>;
  about: Record<string, { subtitle: string; desc1: string; desc2: string }>;
  features: Record<string, { title: string; desc: string }>[];
  footer: Record<string, { companyDesc: string; copyright: string }>;
}

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  refetch: () => void;
}

const defaultSettings: Settings = {
  contact: { email: 'info@greenledtech.com', phone: '+86-755-8888-8888' },
  hero: {},
  plantCategory: {},
  energyCategory: {},
  about: {},
  features: [],
  footer: {},
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: false,
  refetch: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // fallback to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
