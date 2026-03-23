import { getTranslations } from 'next-intl/server';
import { ChatPage } from '@/modules/chatbot/components/ChatPage';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'chatbot' });

  return {
    title: 'Facil - Asistente IA',
    description: t('chatPage.subtitle'),
    openGraph: {
      title: 'Facil - Asistente IA de Guinea Ecuatorial',
      description: t('chatPage.subtitle'),
      type: 'website',
    },
  };
}

export default function ChatRoute() {
  return <ChatPage />;
}
