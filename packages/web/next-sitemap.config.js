/**
 * next-sitemap configuration
 * Generates sitemap.xml and robots.txt for TaxasGE Web
 *
 * @see https://github.com/iamvishnusankar/next-sitemap
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Site URL - dynamically determined based on environment
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://taxasge-dev.web.app',

  // Generate both sitemap.xml and robots.txt
  generateRobotsTxt: true,

  // Generate a separate sitemap for each locale
  generateIndexSitemap: false,

  // Number of entries per sitemap file (max 50000)
  sitemapSize: 7000,

  // Change frequency for pages
  changefreq: 'daily',

  // Default priority for all pages
  priority: 0.7,

  // Paths to exclude from sitemap
  exclude: [
    '/api/*',
    '/admin/*',
    '/dashboard/*',
    '/auth/*',
    '/_next/*',
    '/*.json',
    '/*.xml',
  ],

  // Additional paths to include
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
  ],

  // robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/_next/',
        ],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps here if needed
    ],
  },

  // Transform function to customize each sitemap entry
  transform: async (config, path) => {
    // Custom priority for important pages
    const customPriorities = {
      '/': 1.0,
      '/services': 0.9,
      '/about': 0.8,
      '/contact': 0.8,
    };

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: customPriorities[path] || config.priority,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
  },
};
