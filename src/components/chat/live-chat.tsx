'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

// Replace these with your own Tawk.to credentials
// Register at https://tawk.to and create a property to get these
const TAWKTO_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
const TAWKTO_WIDGET_ID = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

export default function LiveChat() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check consent before loading
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'rejected') return;

    if (TAWKTO_PROPERTY_ID && TAWKTO_WIDGET_ID) {
      setLoaded(true);
    }
  }, []);

  if (!loaded) return null;

  return (
    <Script
      id="tawkto"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
          (function() {
            var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/${TAWKTO_PROPERTY_ID}/${TAWKTO_WIDGET_ID}';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            s0.parentNode.insertBefore(s1, s0);
          })();
        `,
      }}
    />
  );
}
