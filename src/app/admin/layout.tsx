import type { Metadata } from 'next';
import AdminAuthGuard from '@/components/admin/auth-guard';

export const metadata: Metadata = {
  title: 'Admin Dashboard | GreenLedTech',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </div>
  );
}
