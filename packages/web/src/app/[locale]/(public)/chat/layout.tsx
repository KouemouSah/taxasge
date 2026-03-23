/**
 * Chat Page Layout
 * Minimal layout: no footer, no floating chatbot (we ARE the chatbot).
 * Full viewport height for immersive chat experience.
 */

import { setRequestLocale } from 'next-intl/server';

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
