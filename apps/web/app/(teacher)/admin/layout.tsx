'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'SISWA') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role === 'SISWA') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b px-8 py-4 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {/* We can dynamically set title based on route if needed */}
            Admin Management
          </h2>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
