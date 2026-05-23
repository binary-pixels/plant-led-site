'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Allow access to login page without auth
    if (pathname === '/admin/login') {
      setChecked(true);
      return;
    }

    const agent = sessionStorage.getItem('agent');
    if (!agent) {
      router.replace('/admin/login');
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  function handleSignOut() {
    sessionStorage.removeItem('agent');
    window.location.href = '/admin/login';
  }

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <span className="font-semibold text-sm">GreenLedTech Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {pathname !== '/admin/login' && (
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          )}
          <a
            href="/"
            target="_blank"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            View Website →
          </a>
        </div>
      </header>
      {children}
    </>
  );
}
