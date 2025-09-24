# 🌐 ROADMAP FRONTEND WEB TAXASGE - NEXT.JS PWA
## Canvas de Développement Web Progressive App

---

**Point de départ :** Backend Firebase API + Données 547 taxes + Design mobile existant
**Durée :** 3 semaines (15 jours ouvrables)
**Équipe :** 2 développeurs Full-Stack + 1 UI/UX + 1 DevOps
**Livrables :** PWA complète + Firebase Hosting + 50k+ visites/mois

---

## 🎯 OBJECTIFS FRONTEND WEB

### Fonctionnalités Core Web
- Interface responsive desktop/mobile/tablet
- Progressive Web App (PWA) installable
- Mode offline complet avec Service Workers
- Performance Lighthouse score >90
- SEO optimisé pour recherche Google
- Synchronisation temps réel avec API Firebase

### Avantages Spécifiques Web
- Accessibilité instantanée (pas d'installation)
- Référencement Google pour taxes guinéennes
- Partage direct URLs services fiscaux
- Intégration sociale et embed widgets
- Dashboard administrateur DGI intégré

### Contraintes Techniques
- Bundle size optimisé <1MB initial
- Performance Core Web Vitals excellents
- Support navigateurs 95%+ utilisateurs
- WCAG 2.1 AA accessibility compliant
- PWA criteria 100% respectés

---

## 🏗️ PHASE 1 : SETUP NEXT.JS & PWA (Semaine 1)

### 📋 SPRINT 1.1 : PROJECT SETUP & ARCHITECTURE (Jours 1-2)

#### 🔄 **PROMPT GROUPE A - Next.js Setup Avancé (Parallèle)**
```bash
# PROMPT 1A : Next.js 14 Project Architecture
MISSION: Setup Next.js 14 avec App Router et TypeScript
INITIALISATION:
npx create-next-app@latest taxasge-web --typescript --tailwind --eslint --app

PROJECT STRUCTURE:
taxasge-web/
├── app/
│   ├── (auth)/               # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── admin/           # Dashboard DGI
│   │   └── user/            # Dashboard utilisateur
│   ├── taxes/
│   │   ├── [id]/           # Dynamic routes
│   │   ├── search/
│   │   └── calculate/
│   ├── api/                 # API routes Next.js
│   │   ├── search/
│   │   ├── taxes/
│   │   └── calculate/
│   ├── globals.css
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # Shadcn/ui components
│   ├── forms/               # Form components
│   ├── charts/              # Data visualization
│   └── layout/              # Layout components
├── lib/
│   ├── api.ts               # API client
│   ├── database.ts          # Client-side DB
│   ├── utils.ts             # Utilities
│   └── validations.ts       # Zod schemas
├── public/
│   ├── icons/               # PWA icons
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── styles/                  # Global styles
└── types/                   # TypeScript types

CONFIGURATION:
# next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'https://us-central1-VOTRE-PROJECT-ID.cloudfunctions.net/main/:path*',
      },
    ]
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig

LIVRABLES:
- Architecture Next.js 14 complète
- TypeScript configuration stricte
- Tailwind CSS avec design tokens
- ESLint + Prettier setup
ACCEPTATION:
- npm run dev successful
- TypeScript compilation clean
- Hot reload fonctionnel
- Build production successful

# PROMPT 1B : PWA Configuration Complete
MISSION: Progressive Web App setup avancé
PWA REQUIREMENTS:
1. Web App Manifest complet
2. Service Worker offline strategy
3. Installable prompt natif
4. Push notifications support
5. Background sync capability

MANIFEST.JSON:
{
  "name": "TaxasGE - Taxes Guinée Équatoriale",
  "short_name": "TaxasGE",
  "description": "Application officielle des taxes et impôts de Guinée Équatoriale",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "orientation": "portrait-primary",
  "categories": ["government", "finance", "productivity"],
  "lang": "es",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png", 
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512", 
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Rechercher Taxes",
      "short_name": "Recherche",
      "description": "Rechercher dans les 547 services fiscaux",
      "url": "/search",
      "icons": [{"src": "/icons/search.png", "sizes": "96x96"}]
    },
    {
      "name": "Calculatrice",
      "short_name": "Calcul",
      "description": "Calculer montants fiscaux",
      "url": "/calculate", 
      "icons": [{"src": "/icons/calculator.png", "sizes": "96x96"}]
    }
  ]
}

SERVICE WORKER STRATEGY:
// public/sw.js
const CACHE_NAME = 'taxasge-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/search',
  '/calculate',
  '/offline',
  '/_next/static/css/',
  '/_next/static/js/'
]

// Cache-first pour assets statiques
// Network-first pour API calls
// Stale-while-revalidate pour pages

LIVRABLES:
- PWA manifest configuré
- Service Worker stratégies offline
- Install prompt implementé
- Icons PWA toutes tailles générées
ACCEPTATION:
- Lighthouse PWA score 100%
- Installation PWA fonctionnelle
- Mode offline pages principales
- Audit PWA Chrome DevTools passed
```

#### 🔄 **PROMPT GROUPE B - UI Framework & Design System (Parallèle)**
```bash
# PROMPT 1C : Shadcn/ui + Design System Setup
MISSION: Système de design cohérent avec mobile
INSTALLATION SHADCN/UI:
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select textarea label

DESIGN TOKENS:
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#059669',  // Vert Guinée Équatoriale
          900: '#064e3b',
        },
        secondary: {
          500: '#dc2626',  // Rouge drapeau
        },
        accent: {
          500: '#fbbf24',  // Jaune drapeau
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    }
  }
}

COMPOSANTS UI PRIORITAIRES:
1. TaxCard - Affichage service fiscal
2. SearchInput - Recherche avec suggestions
3. Calculator - Interface calcul
4. DataTable - Liste résultats paginée
5. StatCard - Métriques dashboard
6. NavigationBreadcrumb - Navigation hiérarchique
7. LoadingSkeleton - États de chargement
8. ErrorBoundary - Gestion erreurs

RESPONSIVE DESIGN:
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Grid system flexible
- Typography scale fluide

LIVRABLES:
- Design system complet Shadcn/ui
- Composants UI réutilisables
- Responsive design system
- Storybook documentation
ACCEPTATION:
- 20+ composants UI fonctionnels
- Responsive tests 4 breakpoints
- Design consistency validated
- Accessibility annotations

# PROMPT 1D : State Management & Data Layer
MISSION: Gestion d'état et données client-side
STACK SELECTION:
- Zustand (state management léger)
- TanStack Query (server state)
- Zod (validation schemas)
- React Hook Form (formulaires)

STATE ARCHITECTURE:
// stores/taxStore.ts
interface TaxStore {
  taxes: Tax[]
  favorites: string[]
  searchQuery: string
  filters: SearchFilters
  // Actions
  setTaxes: (taxes: Tax[]) => void
  toggleFavorite: (taxId: string) => void
  updateSearch: (query: string) => void
  setFilters: (filters: SearchFilters) => void
}

// stores/calculatorStore.ts
interface CalculatorStore {
  currentCalculation: Calculation | null
  history: Calculation[]
  // Actions
  calculate: (params: CalculationParams) => Promise<void>
  saveCalculation: (calc: Calculation) => void
  clearHistory: () => void
}

API LAYER:
// lib/api.ts
class TaxasGEApi {
  private client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
  })

  async searchTaxes(query: string, filters?: SearchFilters): Promise<Tax[]> {
    const { data } = await this.client.get('/api/v1/fiscal-services/search', {
      params: { q: query, ...filters }
    })
    return data.results
  }

  async calculateAmount(params: CalculationParams): Promise<CalculationResult> {
    const { data } = await this.client.post('/api/v1/calculate', params)
    return data
  }
}

LIVRABLES:
- State management Zustand configuré
- API client avec TanStack Query
- Form validation avec Zod
- Error handling centralisé
ACCEPTATION:
- State persistence localStorage
- API calls avec cache intelligent
- Form validation fonctionnelle
- Error boundaries working
```

### 📋 SPRINT 1.2 : PAGES CORE & NAVIGATION (Jours 3-5)

#### 🔄 **PROMPT GROUPE C - Pages Principales (Parallèle)**
```bash
# PROMPT 1E : Homepage & Landing Experience
MISSION: Page d'accueil optimisée conversion
LAYOUT HOMEPAGE:
┌─────────────────────────────────────┐
│ Header Navigation + Auth            │
├─────────────────────────────────────┤
│ Hero Section                        │
│ "547 Services Fiscaux GQ"           │
│ [Search Input Prominent]            │
├─────────────────────────────────────┤
│ Quick Actions (4 cards)             │
│ • Rechercher • Calculer             │
│ • Favoris   • Assistant IA          │
├─────────────────────────────────────┤
│ Popular Services (grid 3x2)         │
├─────────────────────────────────────┤
│ Recent Updates (timeline)           │
├─────────────────────────────────────┤
│ Footer + Links                      │
└─────────────────────────────────────┘

SEO OPTIMIZATION:
- Title: "TaxasGE - Services Fiscaux Guinée Équatoriale Officiel"
- Meta description optimisée 160 chars
- Schema.org structured data
- OpenGraph tags réseaux sociaux
- Canonical URLs
- XML sitemap generation

PERFORMANCE:
- Critical CSS inline
- Lazy loading images
- Resource hints (preconnect, dns-prefetch)
- Code splitting automatique Next.js

LIVRABLES:
- Homepage responsive complète
- SEO optimisation avancée
- Performance Core Web Vitals excellents
- Analytics tracking setup
ACCEPTATION:
- Lighthouse score >90 toutes catégories
- Core Web Vitals tous verts
- SEO audit 100% conforme
- Conversion tracking functional

# PROMPT 1F : Search & Results Pages
MISSION: Recherche avancée et affichage résultats
SEARCH PAGE FEATURES:
1. Search input avec autocomplete
2. Filtres avancés (ministère, secteur, type)
3. Tri par pertinence, nom, montant
4. Pagination infinite scroll
5. Sauvegarde recherches favorites
6. Export résultats (PDF, CSV)

SEARCH INTERFACE:
┌─────────────────────────────────────┐
│ Search Input + Voice Search         │
├─────────────────────────────────────┤
│ Filters (ministère, secteur, type)  │
├─────────────────────────────────────┤
│ Results Count + Sort Options        │
├─────────────────────────────────────┤
│ Tax Cards Grid (responsive)         │
│ ┌───────┐ ┌───────┐ ┌───────┐      │
│ │ Tax 1 │ │ Tax 2 │ │ Tax 3 │      │
│ └───────┘ └───────┘ └───────┘      │
├─────────────────────────────────────┤
│ Load More Button                    │
└─────────────────────────────────────┘

ADVANCED SEARCH:
- Boolean search (AND, OR, NOT)
- Wildcard search support
- Search within results
- Faceted search avec counts
- Search suggestions intelligentes

LIVRABLES:
- Search page avec filtres avancés
- Results page optimisée performance
- Export functionality
- Search analytics tracking
ACCEPTATION:
- Search response < 300ms
- Infinite scroll smooth
- Filters combination working
- Export formats functional

# PROMPT 1G : Tax Detail Pages
MISSION: Pages détail service fiscal complètes
DYNAMIC ROUTING:
- /taxes/[id] - Page détail service
- /taxes/[id]/calculate - Calculatrice dédiée
- /taxes/[id]/documents - Documents requis
- /taxes/[id]/procedure - Procédure détaillée

TAX DETAIL LAYOUT:
┌─────────────────────────────────────┐
│ Breadcrumb Navigation               │
├─────────────────────────────────────┤
│ Service Header (nom, code, favoris) │
├─────────────────────────────────────┤
│ Tabs Navigation                     │
│ [Montants][Documents][Procédure]    │
├─────────────────────────────────────┤
│ Content Area (dynamic par tab)      │
│                                     │
│ MONTANTS:                           │
│ • Expédition: 15,000 XAF            │
│ • Renouvellement: 10,000 XAF        │
│ [Calculer Maintenant]               │
├─────────────────────────────────────┤
│ Related Services (suggestions)      │
├─────────────────────────────────────┤
│ Actions (favoris, partager, PDF)    │
└─────────────────────────────────────┘

SEO PER PAGE:
- URL structure: /taxes/permis-de-conduire
- Meta titles spécifiques service
- JSON-LD structured data
- Breadcrumb schema
- FAQ schema si applicable

LIVRABLES:
- Dynamic pages génération SSG
- Tabs navigation avec state
- Social sharing integration
- PDF generation service
ACCEPTATION:
- ISR (Incremental Static Regeneration) working
- Tab switching smooth
- Social sharing functional
- PDF export < 3 secondes
```

#### 🔄 **PROMPT GROUPE D - Navigation & Layout (Parallèle)**
```bash
# PROMPT 1H : Navigation Header & Footer
MISSION: Navigation principale et footer informatif
HEADER NAVIGATION:
┌─────────────────────────────────────┐
│ Logo TaxasGE | Nav Menu | Search | Auth │
│ ┌─────────────────────────────────┐ │
│ │ Accueil │ Taxes │ Calculer │...│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

NAVIGATION FEATURES:
- Responsive hamburger menu mobile
- Search intégrée header
- User menu avec avatar
- Notifications badge
- Language switcher (ES/FR/EN)
- Dark/light mode toggle

FOOTER STRUCTURE:
┌─────────────────────────────────────┐
│ TaxasGE                             │
│ ├── À Propos                        │
│ ├── Services                        │
│ ├── Support                         │
│ └── Légal                           │
├─────────────────────────────────────┤
│ Liens Gouvernementaux               │
│ • DGI • Ministère Finances • etc    │
├─────────────────────────────────────┤
│ © 2024 République de GQ             │
└─────────────────────────────────────┘

RESPONSIVE BEHAVIOR:
- Desktop: Navigation horizontale
- Tablet: Navigation collapsed
- Mobile: Hamburger menu overlay

LIVRABLES:
- Header navigation responsive
- Footer informatif complet
- Mobile menu overlay
- User authentication integration
ACCEPTATION:
- Navigation responsive 3 breakpoints
- Menu animations smooth
- Authentication flow working
- Footer links tous fonctionnels

# PROMPT 1I : Layout System & Templates
MISSION: Système de layouts réutilisables
LAYOUT HIERARCHY:
1. RootLayout (app/layout.tsx) - Global layout
2. DashboardLayout - Pages admin/user
3. AuthLayout - Pages auth
4. PublicLayout - Pages publiques

ROOT LAYOUT:
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  )
}

DASHBOARD LAYOUT:
- Sidebar navigation
- Content area flexible
- Breadcrumb trail
- Action buttons contextuels

PROVIDERS SETUP:
- Theme Provider (dark/light mode)
- Query Client Provider (TanStack)
- Auth Provider (Firebase Auth)
- Language Provider (i18next)

LIVRABLES:
- Layout system hiérarchique
- Providers configuration
- Theme switching functionality
- Breadcrumb system automatic
ACCEPTATION:
- Layout inheritance working
- Theme switching immediate
- Providers state persistent
- Breadcrumbs accurate navigation
```

---

## 🛠️ PHASE 2 : FONCTIONNALITÉS AVANCÉES (Semaine 2)

### 📋 SPRINT 2.1 : CALCULATRICE & FORMULAIRES (Jours 6-8)

#### 🔄 **PROMPT GROUPE E - Calculator Advanced (Parallèle)**
```bash
# PROMPT 2A : Tax Calculator Interactive
MISSION: Calculatrice fiscale avancée web
CALCULATOR TYPES:
1. Simple (montants fixes)
2. Pourcentage (% revenus, tonnage)
3. Tranches progressives (paliers)
4. Formules complexes (douanes, import)

CALCULATOR INTERFACE:
┌─────────────────────────────────────┐
│ Service: Permis de Conduire         │
├─────────────────────────────────────┤
│ Type Calcul:                        │
│ ○ Expédition  ● Renouvellement      │
├─────────────────────────────────────┤
│ Paramètres:                         │
│ └── [Input fields dynamiques]       │
├─────────────────────────────────────┤
│ Résultat:                           │
│ ┌─────────────────────────────────┐ │
│ │ MONTANT TOTAL: 15,000 XAF       │ │
│ │ • Base: 12,000 XAF              │ │
│ │ • Frais: 3,000 XAF              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Sauvegarder] [Exporter PDF]       │
└─────────────────────────────────────┘

FEATURES AVANCÉES:
- Calculs temps réel (debounced)
- Historique calculs utilisateur
- Comparaison scenarios
- Export PDF professionnel
- Partage calculs via URL
- Simulation batch (plusieurs taxes)

VALIDATION & ERROR HANDLING:
- Validation inputs temps réel
- Messages d'erreur contextuels
- Formats monétaires localisés
- Conversions devise automatiques

LIVRABLES:
- Calculator components modulaires
- Logic calculs tous types
- PDF export avec template officiel
- URL sharing calculations
ACCEPTATION:
- Calculs 100% précis vs API
- PDF generation < 3 secondes
- URL sharing working
- Validation UX intuitive

# PROMPT 2B : Forms System Advanced
MISSION: Système de formulaires réutilisable
FORM ARCHITECTURE:
- React Hook Form + Zod validation
- Composants form génériques
- Validation temps réel
- Error handling centralisé
- Multi-step forms support

FORM COMPONENTS:
1. FormInput (text, email, tel, number)
2. FormSelect (single/multi select)
3. FormTextarea (descriptions)
4. FormCheckbox/Radio groups
5. FormDatePicker
6. FormFileUpload
7. FormSteps (multi-step wizard)

VALIDATION SCHEMAS:
// lib/validations.ts
export const taxCalculationSchema = z.object({
  serviceId: z.string().min(1, "Service requis"),
  calculationType: z.enum(["expedition", "renouvellement"]),
  parameters: z.record(z.string(), z.any()),
  currency: z.enum(["XAF", "EUR", "USD"]).default("XAF"),
})

export const searchFiltersSchema = z.object({
  query: z.string().min(2, "2 caractères minimum"),
  ministry: z.string().optional(),
  sector: z.string().optional(), 
  category: z.string().optional(),
  amountRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
})

FORM FEATURES:
- Auto-save brouillons
- Validation progressive
- Accessibility complète
- Loading states
- Success confirmations

LIVRABLES:
- Form system complet réutilisable
- Validation schemas Zod
- Multi-step forms wizard
- Auto-save functionality
ACCEPTATION:
- Forms validation UX fluide
- Accessibility audit passed
- Auto-save working
- Error states user-friendly
```

#### 🔄 **PROMPT GROUPE F - Data Visualization (Parallèle)**
```bash
# PROMPT 2C : Charts & Analytics Dashboard
MISSION: Visualisation données fiscales
CHARTING LIBRARY: Recharts + D3.js pour custom
CHART TYPES:
1. BarChart - Montants par ministère
2. LineChart - Évolution taxes temps
3. PieChart - Répartition secteurs
4. AreaChart - Tendances calculs
5. ScatterPlot - Corrélations montants
6. HeatMap - Usage par région

DASHBOARD ANALYTICS:
┌─────────────────────────────────────┐
│ KPI Cards (4)                       │
│ ┌─────┐┌─────┐┌─────┐┌─────┐        │
│ │ 547 ││15.2k││ 89% ││$2.1M│        │
│ │Taxes││Users││Sat. ││ Rev.│        │
│ └─────┘└─────┘└─────┘└─────┘        │
├─────────────────────────────────────┤
│ Usage Trends (Line Chart)           │
│ ┌─────────────────────────────────┐ │
│ │        ╭─╮                     │ │
│ │       ╱   ╲╱╲                  │ │
│ │ ╭────╱     ╲  ╲───╮            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Top Services (Bar Chart)            │
│ Popular Calculations (Pie Chart)    │
└─────────────────────────────────────┘

INTERACTIVE FEATURES:
- Hover tooltips détaillés
- Click drill-down navigation
- Date range pickers
- Export charts PNG/SVG
- Real-time data updates
- Responsive charts mobile

DATA PROCESSING:
- Aggregation côté client
- Caching intelligent
- Loading skeletons
- Error boundaries charts

LIVRABLES:
- Dashboard analytics complet
- Charts interactifs responsive
- Data export functionality
- Real-time updates
ACCEPTATION:
- Charts responsive tous devices
- Interactions smooth 60fps
- Data accuracy verified
- Export formats working

# PROMPT 2D : Search & Filter System Advanced
MISSION: Recherche et filtrage intelligents
SEARCH FEATURES:
1. Full-text search multi-champs
2. Autocomplete avec suggestions
3. Search-as-you-type (debounced)
4. Boolean queries (AND, OR, NOT)
5. Faceted search avec counts
6. Search within results
7. Saved searches favorites

FILTER ARCHITECTURE:
┌─────────────────────────────────────┐
│ Search Input + Voice               │
├─────────────────────────────────────┤
│ Active Filters Tags                 │
│ [Ministère: Finance] [Type: License]│
├─────────────────────────────────────┤
│ Filter Sidebar                      │
│ ┌─────────────────────────────────┐ │
│ │ Ministère        ▼              │ │
│ │ ☑ Finance (245)                 │ │
│ │ ☐ Commerce (156)                │ │
│ │ ☐ Transport (89)                │ │
│ │                                 │ │
│ │ Montant          ▼              │ │
│ │ ├──────●────────┤ 0-50k XAF     │ │
│ │                                 │ │
│ │ Type Document    ▼              │ │
│ │ ☑ Licence                       │ │
│ │ ☐ Permis                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

SEARCH ALGORITHM:
- Elasticsearch-style queries
- Fuzzy matching typos
- Stemming multilingue
- Phrase matching exact
- Boost scoring pertinence

URL STATE MANAGEMENT:
- Filter state dans URL params
- Bookmarkable search URLs  
- History navigation
- Deep linking search results

LIVRABLES:
- Search system intelligent
- Filter UI responsive
- URL state management
- Performance optimized
ACCEPTATION:
- Search response < 300ms
- Filter combinations accurate
- URL sharing working
- Mobile UX intuitive
```

### 📋 SPRINT 2.2 : OFFLINE & PWA AVANCÉ (Jours 9-10)

#### 🔄 **PROMPT GROUPE G - Service Worker Stratégies (Parallèle)**
```bash
# PROMPT 2E : Offline Strategy Complete
MISSION: Mode offline complet avec Service Worker
CACHING STRATEGIES:
1. Cache-First: Assets statiques (CSS, JS, images)
2. Network-First: API calls (données fraîches)
3. Stale-While-Revalidate: Pages HTML
4. Network-Only: Analytics, logging
5. Cache-Only: Fallback offline pages

SERVICE WORKER IMPLEMENTATION:
// public/sw.js
const CACHE_NAME = 'taxasge-v1.2.0'
const OFFLINE_URL = '/offline'

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/search',
        '/calculate', 
        '/offline',
        '/manifest.json',
        // Critical CSS/JS
        '/_next/static/css/app.css',
        '/_next/static/chunks/main.js'
      ])
    })
  )
})

// Fetch handling
self.addEventListener('fetch', (event) => {
  // API calls - Network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(event.request)
        })
    )
  }
  
  // HTML pages - Stale while revalidate
  else if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone())
              })
              return networkResponse
            })
          
          return cachedResponse || fetchPromise
        })
        .catch(() => caches.match(OFFLINE_URL))
    )
  }
})

OFFLINE FUNCTIONALITY:
- Toutes pages principales accessibles
- Données taxes cachées localement
- Calculatrice offline complète
- Queue requests pour sync
- Offline indicator UI

LIVRABLES:
- Service Worker stratégies avancées
- Offline pages complètes
- Background sync queue
- Offline/online detection UI
ACCEPTATION:
- PWA audit 100% Lighthouse
- Offline navigation fonctionnelle
- Background sync working
- Performance offline équivalente

# PROMPT 2F : Local Storage & IndexedDB
MISSION: Storage client avancé pour offline
STORAGE ARCHITECTURE:
1. IndexedDB - Données taxes complètes (547 services)
2. LocalStorage - Préférences utilisateur
3. SessionStorage - État temporaire navigation
4. Cache API - Réponses API récentes

INDEXEDDB SCHEMA:
// lib/indexeddb.ts
interface TaxDatabase {
  taxes: {
    key: string
    value: {
      id: string
      serviceCode: string
      name: { es: string, fr: string, en: string }
      expeditionAmount?: number
      renewalAmount?: number
      ministry: string
      sector: string
      lastUpdated: number
    }
  }
  
  calculations: {
    key: string  
    value: {
      id: string
      taxId: string
      params: Record<string, any>
      result: number
      timestamp: number
      userId?: string
    }
  }
  
  favorites: {
    key: string
    value: {
      taxId: string
      addedAt: number
    }
  }
}

SYNC STRATEGY:
- Differential sync (dernière modification)
- Conflict resolution (timestamp-based)
- Progressive sync background
- Sync status indicators UI

DATA MANAGEMENT:
class OfflineDataManager {
  async syncTaxes(): Promise<void> {
    try {
      const lastSync = localStorage.getItem('lastTaxSync')
      const response = await fetch(`/api/taxes/sync?since=${lastSync}`)
      const { updated, deleted } = await response.json()
      
      // Update local database
      await this.updateLocalTaxes(updated)
      await this.deleteLocalTaxes(deleted)
      
      localStorage.setItem('lastTaxSync', Date.now().toString())
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
  
  async searchOffline(query: string): Promise<Tax[]> {
    // Search dans IndexedDB local
    const db = await this.openDB()
    const taxes = await db.getAll('taxes')
    
    return taxes.filter(tax => 
      tax.name.es.toLowerCase().includes(query.toLowerCase()) ||
      tax.name.fr.toLowerCase().includes(query.toLowerCase()) ||
      tax.serviceCode.includes(query.toUpperCase())
    )
  }
}

LIVRABLES:
- IndexedDB schema optimisé
- Sync differential intelligent
- Search offline performant
- Conflict resolution robust
ACCEPTATION:
- 547 taxes stockées localement < 5MB
- Search offline < 200ms
- Sync incrémentiel fonctionnel
- Conflict resolution tested
```

---

## 🚀 PHASE 3 : DÉPLOIEMENT & OPTIMISATION (Semaine 3)

### 📋 SPRINT 3.1 : BUILD & FIREBASE DEPLOYMENT (Jours 11-13)

#### 🔄 **PROMPT GROUPE H - Production Build Optimization (Parallèle)**
```bash
# PROMPT 3A : Next.js Production Build
MISSION: Build production optimisé performances
BUILD OPTIMIZATION:
1. Bundle analyzer et tree-shaking
2. Image optimization automatique
3. CSS purging unused styles  
4. JavaScript minification avancée
5. Static generation (SSG) pages
6. Incremental Static Regeneration (ISR)

NEXT.CONFIG.JS OPTIMIZED:
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'date-fns'],
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression
  compress: true,
  
  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Bundle analyzer
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false,
        })
      )
    }
    return config
  },
  
  // Static export pour Firebase Hosting  
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  
  // Headers security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

PERFORMANCE TARGETS:
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s  
- Cumulative Layout Shift < 0.1
- First Input Delay < 100ms
- Bundle size initial < 200KB gzipped

LIVRABLES:
- Build production optimisé
- Bundle analysis report
- Performance metrics baseline
- Security headers configurés
ACCEPTATION:
- Lighthouse score >90 toutes catégories
- Bundle size targets respectés
- Build time < 3 minutes
- Security audit passed

# PROMPT 3B : Firebase Hosting Deployment
MISSION: Déploiement Firebase Hosting optimisé
FIREBASE HOSTING SETUP:
# firebase.json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "main"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(html|json)",
        "headers": [
          {
            "key": "Cache-Control", 
            "value": "public, max-age=3600"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}

DEPLOYMENT WORKFLOW:
# Scripts package.json
{
  "scripts": {
    "build": "next build",
    "export": "next export", 
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:preview": "firebase hosting:channel:deploy preview"
  }
}

CDN OPTIMIZATION:
- Global CDN automatique Firebase
- Compression GZIP/Brotli
- HTTP/2 push headers
- Cache policies optimisées
- SSL/TLS automatique

CUSTOM DOMAIN:
- Configuration domaine custom (si disponible)
- SSL certificate automatique
- Redirections HTTP → HTTPS
- Canonical domain setup

LIVRABLES:
- Firebase Hosting configuré
- Deployment automatisé  
- CDN optimisation active
- Custom domain configuré (optionnel)
ACCEPTATION:
- Site accessible HTTPS
- Performance CDN validée
- Deploy time < 5 minutes
- SSL certificate valid

# PROMPT 3C : CI/CD Pipeline Setup
MISSION: Pipeline déploiement automatisé
GITHUB ACTIONS WORKFLOW:
# .github/workflows/deploy.yml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Run ESLint
      run: npm run lint
      
    - name: Build application
      run: npm run build
      
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        uploadDir: './out'
        
    - name: Deploy to Firebase Hosting
      if: github.ref == 'refs/heads/main'
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        channelId: live
        projectId: VOTRE-PROJECT-ID

ENVIRONMENT SETUP:
- Staging environment (PR previews)  
- Production environment (main branch)
- Environment variables sécurisées
- Secrets management

QUALITY GATES:
- Tests unitaires passage
- ESLint zero errors
- Lighthouse score minimum
- Security scan passed

LIVRABLES:
- GitHub Actions pipeline complet
- Staging/Production environments
- Quality gates enforced  
- Deployment notifications
ACCEPTATION:
- Pipeline execution < 10 minutes
- Staging deployments automatic PR
- Quality gates blocking déploiement
- Notifications Slack/email working
```

### 📋 SPRINT 3.2 : SEO & ANALYTICS (Jours 14-15)

#### 🔄 **PROMPT GROUPE I - SEO Optimization Complete (Parallèle)**
```bash
# PROMPT 3D : SEO On-Page & Technical
MISSION: Optimisation SEO complète référencement Google
ON-PAGE SEO:
1. Title tags optimisés par page
2. Meta descriptions uniques 160 chars
3. Headers hierarchy (H1, H2, H3)
4. Schema.org structured data
5. Open Graph tags réseaux sociaux
6. Canonical URLs
7. XML sitemap génération

SEO STRUCTURE:
// app/taxes/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const tax = await getTax(params.id)
  
  return {
    title: `${tax.name.es} - Taxes Guinée Équatoriale | TaxasGE`,
    description: `Calculez et consultez les informations pour ${tax.name.es}. Montant: ${tax.expeditionAmount} XAF. Documents, procédure et calculs officiels.`,
    keywords: [
      tax.name.es, tax.name.fr, tax.name.en,
      'taxes guinée équatoriale', 'impôts GQ', 'calcul fiscal'
    ],
    openGraph: {
      title: tax.name.es,
      description: `Service fiscal officiel - ${tax.expeditionAmount} XAF`,
      images: [`/api/og?title=${encodeURIComponent(tax.name.es)}`],
      locale: 'es_GQ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tax.name.es,
      description: `Service fiscal - ${tax.expeditionAmount} XAF`,
    },
    alternates: {
      canonical: `https://taxasge.gq/taxes/${tax.serviceCode}`,
      languages: {
        'es-GQ': `/taxes/${tax.serviceCode}`,
        'fr-GQ': `/fr/taxes/${tax.serviceCode}`,
        'en': `/en/taxes/${tax.serviceCode}`,
      }
    }
  }
}

STRUCTURED DATA:
// Schema.org JSON-LD
const taxSchema = {
  "@context": "https://schema.org",
  "@type": "GovernmentService",
  "name": tax.name.es,
  "description": tax.description,
  "provider": {
    "@type": "GovernmentOrganization",
    "name": "République de Guinée Équatoriale",
    "url": "https://guineaecuatorialpress.com"
  },
  "areaServed": "Guinée Équatoriale",
  "availableLanguage": ["es", "fr", "en"],
  "offers": {
    "@type": "Offer",
    "price": tax.expeditionAmount,
    "priceCurrency": "XAF"
  }
}

TECHNICAL SEO:
- Robots.txt optimisé
- XML sitemap automatique
- Image alt tags descriptifs
- Internal linking strategy
- URL structure clean
- Page speed optimization
- Mobile-first indexing ready

LIVRABLES:
- SEO on-page optimisé toutes pages
- Structured data implementation
- XML sitemap génération
- Robots.txt configuré
ACCEPTATION:
- Google Search Console setup
- Core Web Vitals tous verts
- Structured data validation passed
- SEO audit score >90

# PROMPT 3E : Analytics & Tracking Complete
MISSION: Analytics complètes comportement utilisateur
ANALYTICS STACK:
1. Google Analytics 4 (GA4)
2. Google Search Console
3. Hotjar heatmaps & recordings  
4. Firebase Analytics
5. Custom business metrics

GA4 IMPLEMENTATION:
// lib/gtag.ts
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'

export const gtag = {
  pageview: (url: string) => {
    if (typeof window !== 'undefined') {
      window.gtag('config', GA_TRACKING_ID, {
        page_location: url,
      })
    }
  },
  
  event: (action: string, parameters: any) => {
    if (typeof window !== 'undefined') {
      window.gtag('event', action, parameters)
    }
  }
}

// Custom events tracking
export const trackTaxView = (taxId: string, taxName: string) => {
  gtag.event('tax_view', {
    tax_id: taxId,
    tax_name: taxName,
    value: 1
  })
}

export const trackCalculation = (taxId: string, amount: number) => {
  gtag.event('calculate_tax', {
    tax_id: taxId,
    value: amount,
    currency: 'XAF'
  })
}

BUSINESS METRICS TRACKING:
- Page views par service fiscal
- Calculs complétés par type
- Recherches populaires termes
- Conversions favoris ajoutés
- Time spent per tax category
- Geographic usage patterns
- Device/browser analytics

CONVERSION FUNNELS:
1. Homepage → Search → Tax Detail → Calculate
2. Search → Results → Detail → Favorite
3. Landing → Calculator → PDF Export
4. Organic → Tax Page → Related Services

PERFORMANCE MONITORING:
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Error tracking automatique
- API response times
- Conversion rate optimization

LIVRABLES:
- GA4 tracking complet configuré
- Custom business events
- Conversion funnels setup
- Performance monitoring active
ACCEPTATION:
- Analytics data flowing correctly
- Custom events triggering
- Conversion tracking accurate
- Performance alerts setup

# PROMPT 3F : Performance Monitoring Production
MISSION: Monitoring performance production temps réel
MONITORING STACK:
1. Google PageSpeed Insights API
2. Firebase Performance Monitoring
3. Lighthouse CI automation
4. Custom performance API
5. User-centric metrics RUM

PERFORMANCE METRICS:
// lib/performance.ts
class PerformanceMonitor {
  static trackWebVitals() {
    // Core Web Vitals
    getCLS(this.sendToAnalytics)
    getFID(this.sendToAnalytics)  
    getFCP(this.sendToAnalytics)
    getLCP(this.sendToAnalytics)
    getTTFB(this.sendToAnalytics)
  }
  
  static sendToAnalytics = (metric: any) => {
    gtag.event('web_vital', {
      name: metric.name,
      value: Math.round(metric.value),
      metric_delta: metric.delta,
      metric_id: metric.id,
    })
  }
  
  static trackCustomMetrics() {
    // Time to Interactive custom
    const navigationStart = performance.timeOrigin
    const domInteractive = performance.timing.domInteractive
    const tti = domInteractive - navigationStart
    
    gtag.event('custom_performance', {
      metric_name: 'time_to_interactive',
      value: tti
    })
  }
}

ALERTING SYSTEM:
- Performance degradation >20%
- Core Web Vitals failing
- Error rate spike >5%
- API response time >2s
- User satisfaction drop

DASHBOARD SETUP:
- Real-time performance metrics
- Historical trend analysis
- User experience scores
- Competitive benchmarking
- Improvement recommendations

LIVRABLES:
- Performance monitoring complet
- Real-time alerting system
- Performance dashboard 
- Competitive analysis setup
ACCEPTATION:
- All metrics tracking accurately
- Alerts triggering correctly
- Dashboard data real-time
- Performance baselines established
```

---

## 📊 MÉTRIQUES DE SUCCÈS WEB

### 🎯 KPIs Techniques Web

| Phase | Métrique | Target | Validation |
|-------|----------|--------|------------|
| **Phase 1** | Lighthouse Score | >90 | Automated CI |
| | PWA Audit | 100% | Chrome DevTools |
| | Bundle Size | <200KB gzipped | Bundle analyzer |
| **Phase 2** | Offline Functionality | 100% | Manual testing |
| | Search Performance | <300ms | Performance API |
| | Calculator Accuracy | 100% | Backend validation |
| **Phase 3** | Core Web Vitals | All green | PageSpeed Insights |
| | SEO Score | >90 | SEMrush audit |
| | Accessibility | WCAG AA | Axe testing |

### 📈 KPIs Business Web

| Période | Métrique | Target | Impact |
|---------|----------|--------|---------|
| **Semaine 1** | Organic Traffic | 1,000+ visites | SEO foundation |
| **Semaine 2** | Search Queries | 5,000+ | Feature adoption |
| **Semaine 3** | Calculations | 500+ | User engagement |
| **Mois 1** | Monthly Users | 10,000+ | Market penetration |
| **Mois 2** | Search Ranking | Top 3 | "taxes guinea ecuatorial" |
| **Mois 3** | Conversion Rate | 15%+ | Visitor to calculator |

### 🌐 Avantages Spécifiques Web

**Accessibilité Immédiate :**
- Aucune installation requise
- Compatible 95%+ navigateurs
- Responsive mobile/desktop/tablet

**Référencement Google :**
- 547 pages services fiscaux indexées
- Rich snippets montants taxes
- Featured snippets calculs

**Partage & Viralité :**
- URLs partageables services
- Embed calculatrice sites tiers
- Social media integration

**Performance Globale :**
- CDN Firebase mondial
- Cache intelligent multi-niveaux
- Progressive loading

Cette approche web complète le mobile en offrant un accès immédiat et un référencement optimal, maximisant la portée et l'adoption de TaxasGE.
