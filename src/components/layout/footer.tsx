'use client';

import { useLocale } from 'next-intl';
import { useSettings } from '@/lib/settings-context';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const locale = useLocale();
  const { settings } = useSettings();
  const contact = settings?.contact ?? { email: 'info@greenledtech.com', phone: '+86-755-8888-8888' };
  const footerText = settings?.footer?.[locale] ?? settings?.footer?.en ?? { companyDesc: '', copyright: 'All rights reserved.' };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-bold text-xl text-white">
                Green<span className="text-purple-400">Led</span>Tech
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {footerText.companyDesc}
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products?category=plant"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  LED Grow Lights
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=energy"
                  className="text-sm hover:text-purple-400 transition-colors"
                >
                  Energy-Saving Lights
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: {contact.email}</li>
              <li>Phone: {contact.phone}</li>
              <li>
                <Link
                  href="/about"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Contact Us →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} GreenLedTech. {footerText.copyright}
        </div>
      </div>
    </footer>
  );
}
