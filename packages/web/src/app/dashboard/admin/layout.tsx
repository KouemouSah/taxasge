/**
 * Admin Dashboard Layout
 * Protects admin routes and provides consistent layout with sidebar
 *
 * @module dashboard/admin
 * @author Claude Code
 * @date 2025-11-18
 */

import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// This would normally come from your auth context
// For now, we'll create a placeholder
async function getServerSession() {
  // TODO: Implement actual session retrieval
  // This is a placeholder - in production, use next-auth or your auth solution
  return null;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user session
  const session = await getServerSession();

  // Check if user is authenticated
  if (!session) {
    redirect('/auth/login');
  }

  // Check if user has admin role
  // TODO: Implement actual role check from session
  // if (session.user.role?.code !== 'ADMIN') {
  //   redirect('/dashboard');
  // }

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
