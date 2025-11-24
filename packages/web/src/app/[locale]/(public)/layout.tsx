/**
 * Public Layout
 * Used for all public pages (homepage, services, ministries, etc.)
 * Includes Header, Footer, and FloatingChatbot
 */

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingChatbot from '@/components/shared/FloatingChatbot';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChatbot />
    </div>
  );
}
