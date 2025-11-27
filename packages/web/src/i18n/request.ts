import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the requested locale (await the promise)
  const requested = await requestLocale;

  // Validate that the incoming locale parameter is valid
  const locale = locales.includes(requested as Locale) ? requested : defaultLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
