/**
 * Admin Dashboard Layout
 * Provides consistent layout with sidebar for admin pages
 *
 * @module dashboard/admin
 * @author Claude Code
 * @date 2025-11-18
 */

'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: With output: 'export', we cannot use server-side authentication
  // Auth protection should be handled client-side or via middleware
  // TODO: Implement client-side auth check with useEffect + router.push

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
