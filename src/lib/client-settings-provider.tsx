'use client';

import dynamic from 'next/dynamic';

const SettingsProvider = dynamic(
  () => import('@/lib/settings-context').then((m) => m.SettingsProvider),
  { ssr: false }
);

export default function ClientSettingsProvider({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
