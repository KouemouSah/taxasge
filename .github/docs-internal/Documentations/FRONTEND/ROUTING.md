# 🛣️ ROUTING TAXASGE
## Guide Complet Next.js App Router

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Framework** : Next.js 14 App Router

---

## 📋 TABLE DES MATIÈRES

1. [Concepts fondamentaux](#concepts-fondamentaux)
2. [Structure fichiers](#structure-fichiers)
3. [Routes statiques](#routes-statiques)
4. [Routes dynamiques](#routes-dynamiques)
5. [Nested Routes & Layouts](#nested-routes--layouts)
6. [Route Groups](#route-groups)
7. [Navigation](#navigation)
8. [Redirections](#redirections)
9. [Middleware & Protection](#middleware--protection)
10. [Best Practices](#best-practices)

---

## 🎯 CONCEPTS FONDAMENTAUX

### App Router vs Pages Router

```
❌ ANCIEN (Pages Router - Next.js <13)
pages/
├── index.tsx              → /
├── services.tsx           → /services
├── services/[id].tsx      → /services/123
└── _app.tsx

✅ NOUVEAU (App Router - Next.js 13+)
app/
├── page.tsx               → /
├── layout.tsx             → Layout global
├── services/
│   ├── page.tsx           → /services
│   └── [id]/
│       └── page.tsx       → /services/123
```

**Avantages App Router** :
- ✅ Server Components par défaut
- ✅ Layouts imbriqués
- ✅ Loading states intégrés
- ✅ Error boundaries automatiques
- ✅ Streaming & Suspense natifs

---

### Fichiers Spéciaux

| Fichier | Rôle | Type | Exemple |
|---------|------|------|---------|
| `page.tsx` | Définit route accessible | Required | `/services/page.tsx` → `/services` |
| `layout.tsx` | Layout partagé routes enfants | Optional | Sidebar dashboard |
| `loading.tsx` | UI pendant chargement | Optional | Spinner, Skeleton |
| `error.tsx` | UI erreur (Error Boundary) | Optional | Message d'erreur |
| `not-found.tsx` | 404 page | Optional | Page introuvable |
| `route.ts` | API Route handler | Optional | `/api/services/route.ts` |
| `template.tsx` | Re-render à chaque navigation | Optional | Animations page |

---

## 📁 STRUCTURE FICHIERS

### Architecture TaxasGE Actuelle

```
packages/web/src/app/
├── layout.tsx                     → Layout global (Header, Footer)
├── page.tsx                       → Landing page (/)
├── globals.css                    → Styles globaux
│
├── auth/                          → Routes authentification
│   ├── login/
│   │   └── page.tsx               → /auth/login
│   └── register/
│       └── page.tsx               → /auth/register
│
├── dashboard/                     → Routes dashboard (privées)
│   ├── layout.tsx                 → Layout avec sidebar
│   ├── page.tsx                   → /dashboard
│   ├── profile/
│   │   └── page.tsx               → /dashboard/profile
│   └── settings/
│       └── page.tsx               → /dashboard/settings
│
├── services/                      → Routes services
│   ├── page.tsx                   → /services (liste)
│   └── [id]/
│       └── page.tsx               → /services/123 (détail)
│
├── declarations/                  → Routes déclarations
│   ├── page.tsx                   → /declarations
│   ├── new/
│   │   └── page.tsx               → /declarations/new
│   └── [id]/
│       └── page.tsx               → /declarations/123
│
└── api/                           → API Routes
    ├── auth/
    │   └── route.ts               → POST /api/auth
    └── services/
        └── route.ts               → GET /api/services
```

---

## 🔗 ROUTES STATIQUES

### Créer une Route Simple

**Fichier** : `app/services/page.tsx`  
**URL** : `/services`

```tsx
// app/services/page.tsx
export default function ServicesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Services Fiscaux</h1>
      <p>Liste des services disponibles...</p>
    </main>
  );
}
```

---

### Route avec Metadata

```tsx
// app/services/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services Fiscaux - TaxasGE',
  description: 'Découvrez tous les services fiscaux disponibles en Guinée Équatoriale',
};

export default function ServicesPage() {
  return <main>...</main>;
}
```

---

### Route avec Data Fetching (Server Component)

```tsx
// app/services/page.tsx
import { getServices } from '@/lib/api/services';
import { ServiceCard } from '@/components/cards/service-card';

export default async function ServicesPage() {
  // ✅ Fetch côté serveur
  const services = await getServices();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Services Fiscaux</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </main>
  );
}
```

---

## 🎯 ROUTES DYNAMIQUES

### Route avec Paramètre Simple

**Fichier** : `app/services/[id]/page.tsx`  
**URLs** : `/services/123`, `/services/abc`, etc.

```tsx
// app/services/[id]/page.tsx
interface PageProps {
  params: {
    id: string;
  };
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { id } = params;
  
  return (
    <main>
      <h1>Service ID: {id}</h1>
    </main>
  );
}
```

---

### Route Dynamique avec Data Fetching

```tsx
// app/services/[id]/page.tsx
import { getServiceById } from '@/lib/api/services';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const service = await getServiceById(params.id);
  
  // Si service n'existe pas, afficher 404
  if (!service) {
    notFound();
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{service.name}</h1>
      <p className="text-muted-foreground mb-8">{service.description}</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Détails</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Prix:</dt>
              <dd className="font-bold">{service.price} XAF</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Durée:</dt>
              <dd>{service.duration}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
```

---

### Générer Metadata Dynamique

```tsx
// app/services/[id]/page.tsx
import { Metadata } from 'next';
import { getServiceById } from '@/lib/api/services';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const service = await getServiceById(params.id);
  
  return {
    title: `${service.name} - TaxasGE`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  // ... (code page)
}
```

---

### Route avec Multiples Paramètres

**Fichier** : `app/users/[userId]/posts/[postId]/page.tsx`  
**URL** : `/users/123/posts/456`

```tsx
// app/users/[userId]/posts/[postId]/page.tsx
interface PageProps {
  params: {
    userId: string;
    postId: string;
  };
}

export default function UserPostPage({ params }: PageProps) {
  const { userId, postId } = params;
  
  return (
    <main>
      <h1>User {userId} - Post {postId}</h1>
    </main>
  );
}
```

---

### Catch-All Routes

**Fichier** : `app/docs/[...slug]/page.tsx`  
**URLs** : `/docs/a`, `/docs/a/b`, `/docs/a/b/c`, etc.

```tsx
// app/docs/[...slug]/page.tsx
interface PageProps {
  params: {
    slug: string[]; // Array de segments
  };
}

export default function DocsPage({ params }: PageProps) {
  const { slug } = params;
  
  // /docs/a/b/c → slug = ['a', 'b', 'c']
  
  return (
    <main>
      <h1>Documentation: {slug.join(' / ')}</h1>
    </main>
  );
}
```

---

### Optional Catch-All Routes

**Fichier** : `app/shop/[[...slug]]/page.tsx`  
**URLs** : `/shop`, `/shop/electronics`, `/shop/electronics/phones`, etc.

```tsx
// app/shop/[[...slug]]/page.tsx
interface PageProps {
  params: {
    slug?: string[]; // Optional
  };
}

export default function ShopPage({ params }: PageProps) {
  const { slug } = params;
  
  // /shop → slug = undefined
  // /shop/electronics → slug = ['electronics']
  // /shop/electronics/phones → slug = ['electronics', 'phones']
  
  if (!slug) {
    return <h1>Tous les produits</h1>;
  }
  
  return <h1>Catégorie: {slug.join(' > ')}</h1>;
}
```

---

## 🎨 NESTED ROUTES & LAYOUTS

### Layout Imbriqués

**Structure** :
```
app/
├── layout.tsx              ← Layout global (Header + Footer)
└── dashboard/
    ├── layout.tsx          ← Layout dashboard (Sidebar)
    ├── page.tsx            ← /dashboard
    └── profile/
        └── page.tsx        ← /dashboard/profile
```

---

**Root Layout** :
```tsx
// app/layout.tsx
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

---

**Dashboard Layout** (Nested) :
```tsx
// app/dashboard/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
```

**Résultat** : 
- `/dashboard` → Header + Sidebar + Content + Footer
- `/dashboard/profile` → Header + Sidebar + Profile Content + Footer

---

### Layouts avec Loading States

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

// app/dashboard/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchData(); // Pendant fetch → loading.tsx s'affiche
  
  return <div>Dashboard Content</div>;
}
```

---

### Layouts avec Error Boundaries

```tsx
// app/dashboard/error.tsx
'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
```

---

## 📂 ROUTE GROUPS

**Route Groups** permettent d'organiser les routes **sans affecter l'URL**.

### Syntaxe : `(nom)`

**Structure** :
```
app/
├── (marketing)/           ← Groupe (PAS dans URL)
│   ├── layout.tsx         ← Layout marketing
│   ├── page.tsx           ← / (landing)
│   └── about/
│       └── page.tsx       ← /about (pas /marketing/about)
│
└── (dashboard)/           ← Groupe (PAS dans URL)
    ├── layout.tsx         ← Layout dashboard
    └── profile/
        └── page.tsx       ← /profile (pas /dashboard/profile)
```

---

### Exemple : Layouts Différents

```tsx
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}

// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

**Résultat** :
- `/` → Layout marketing
- `/about` → Layout marketing
- `/profile` → Layout dashboard (sidebar)

---

### Exemple : Organisation par Feature

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx       ← /login
│   └── register/
│       └── page.tsx       ← /register
│
└── (admin)/
    ├── users/
    │   └── page.tsx       ← /users
    └── settings/
        └── page.tsx       ← /settings
```

---

## 🧭 NAVIGATION

### Navigation `<Link>` (Recommandé)

```tsx
import Link from 'next/link';

// Navigation simple
<Link href="/services">Services</Link>

// Navigation avec paramètres dynamiques
<Link href={`/services/${serviceId}`}>
  Voir le service
</Link>

// Navigation avec query params
<Link href="/services?category=license&sort=price">
  Services filtrés
</Link>

// Navigation avec className (styling)
<Link 
  href="/dashboard" 
  className="text-primary hover:underline"
>
  Dashboard
</Link>

// Navigation avec Button
import { Button } from '@/components/ui/button';

<Button asChild>
  <Link href="/services">Voir les services</Link>
</Button>

// OU
<Link href="/services">
  <Button>Voir les services</Button>
</Link>
```

---

### Navigation Programmatique

```tsx
'use client';

import { useRouter } from 'next/navigation'; // ⚠️ PAS 'next/router'

export function LoginForm() {
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Login logic...
    
    // Navigation après succès
    router.push('/dashboard');
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### Méthodes `useRouter`

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function NavigationExample() {
  const router = useRouter();
  
  return (
    <div>
      {/* Push (ajoute à l'historique) */}
      <button onClick={() => router.push('/dashboard')}>
        Aller au dashboard
      </button>
      
      {/* Replace (remplace dans l'historique) */}
      <button onClick={() => router.replace('/login')}>
        Rediriger vers login
      </button>
      
      {/* Back */}
      <button onClick={() => router.back()}>
        Retour
      </button>
      
      {/* Forward */}
      <button onClick={() => router.forward()}>
        Avant
      </button>
      
      {/* Refresh (re-fetch server components) */}
      <button onClick={() => router.refresh()}>
        Rafraîchir
      </button>
    </div>
  );
}
```

---

### Prefetching (Optimisation)

```tsx
// ✅ Prefetch automatique (Link visible dans viewport)
<Link href="/services">Services</Link>

// ❌ Désactiver prefetch
<Link href="/services" prefetch={false}>
  Services
</Link>

// Prefetch programmatique
'use client';

import { useRouter } from 'next/navigation';

export function PrefetchExample() {
  const router = useRouter();
  
  // Prefetch au hover
  const handleMouseEnter = () => {
    router.prefetch('/services');
  };
  
  return (
    <button 
      onMouseEnter={handleMouseEnter}
      onClick={() => router.push('/services')}
    >
      Services
    </button>
  );
}
```

---

## 🔄 REDIRECTIONS

### Redirect Server-Side

```tsx
// app/old-page/page.tsx
import { redirect } from 'next/navigation';

export default function OldPage() {
  // Redirect permanent
  redirect('/new-page');
}

// Avec condition
export default async function PrivatePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return <div>Page privée</div>;
}
```

---

### Redirect dans next.config.js

```js
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true, // 308 (permanent) ou false = 307 (temporaire)
      },
      {
        source: '/services/:id',
        destination: '/service/:id', // Renommage route
        permanent: true,
      },
      {
        source: '/docs/:slug*',
        destination: '/documentation/:slug*', // Catch-all
        permanent: true,
      },
    ];
  },
};
```

---

### Redirect avec Query Params

```tsx
import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  const session = await getSession();
  
  if (!session) {
    // Redirect vers login avec returnUrl
    redirect('/auth/login?returnUrl=/checkout');
  }
  
  return <div>Checkout</div>;
}

// Dans login page, récupérer returnUrl
export default function LoginPage({ searchParams }: { searchParams: { returnUrl?: string } }) {
  const returnUrl = searchParams.returnUrl || '/dashboard';
  
  const handleLogin = () => {
    // Après login
    router.push(returnUrl);
  };
  
  return <form>...</form>;
}
```

---

## 🔐 MIDDLEWARE & PROTECTION

### Middleware (Route Protection)

```ts
// middleware.ts (racine du projet)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  // Protéger routes /dashboard/*
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      // Redirect vers login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Config : routes où middleware s'applique
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/declarations/:path*',
  ],
};
```

---

### Auth Guard (Composant)

```tsx
// components/auth/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) {
    return null; // Ou <LoadingSpinner />
  }
  
  return <>{children}</>;
}

// Usage dans layout
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex">
        <Sidebar />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}
```

---

## 🎯 BEST PRACTICES

### ✅ DO (À FAIRE)

```tsx
// ✅ Typage strict des params
interface PageProps {
  params: { id: string };
  searchParams: { query?: string };
}

export default function Page({ params, searchParams }: PageProps) {
  // ...
}

// ✅ Utiliser Link pour navigation
<Link href="/services">Services</Link>

// ✅ Gérer 404 explicitement
import { notFound } from 'next/navigation';

const data = await fetchData(params.id);
if (!data) notFound();

// ✅ Layouts imbriqués pour structure
app/dashboard/layout.tsx (sidebar)
app/dashboard/profile/page.tsx (hérite sidebar)

// ✅ Route Groups pour organisation
app/(marketing)/page.tsx
app/(dashboard)/profile/page.tsx

// ✅ Middleware pour protection routes
middleware.ts avec matcher

// ✅ Loading states
app/dashboard/loading.tsx

// ✅ Error boundaries
app/dashboard/error.tsx
```

---

### ❌ DON'T (À ÉVITER)

```tsx
// ❌ Navigation avec <a>
<a href="/services">Services</a> // Pas de prefetch, full reload
// ✅ Utiliser <Link>
<Link href="/services">Services</Link>

// ❌ useRouter depuis 'next/router' (ancien)
import { useRouter } from 'next/router'; // ❌ Pages Router
// ✅ Utiliser 'next/navigation'
import { useRouter } from 'next/navigation'; // ✅ App Router

// ❌ Router.push() dans Server Component
export default async function Page() {
  router.push('/dashboard'); // ❌ Impossible
}
// ✅ Utiliser redirect()
import { redirect } from 'next/navigation';
redirect('/dashboard');

// ❌ Params non typés
export default function Page({ params }: any) { // ❌
}
// ✅ Types explicites
interface PageProps { params: { id: string } }
export default function Page({ params }: PageProps) { // ✅
}

// ❌ Layouts dans pages
export default function Page() {
  return (
    <>
      <Header />
      <main>Content</main>
      <Footer />
    </>
  );
}
// ✅ Utiliser layout.tsx
```

---

## 🗺️ RÉFÉRENCE ROUTES TAXASGE

### Routes Publiques

```
/                           → Landing page
/services                   → Liste services
/services/[id]              → Détail service
/about                      → À propos
/contact                    → Contact
/faq                        → FAQ
```

---

### Routes Authentification

```
/auth/login                 → Connexion
/auth/register              → Inscription
/auth/forgot-password       → Mot de passe oublié
/auth/reset-password        → Réinitialiser mot de passe
```

---

### Routes Dashboard (Privées)

```
/dashboard                  → Dashboard home
/dashboard/profile          → Profil utilisateur
/dashboard/declarations     → Mes déclarations
/dashboard/declarations/new → Nouvelle déclaration
/dashboard/declarations/[id] → Détail déclaration
/dashboard/payments         → Mes paiements
/dashboard/settings         → Paramètres
```

---

### Routes Admin (Privées)

```
/admin                      → Admin dashboard
/admin/users                → Gestion utilisateurs
/admin/services             → Gestion services
/admin/declarations         → Toutes déclarations
/admin/analytics            → Analytiques
```

---

## 📚 RÉFÉRENCES

- **Next.js Routing** : https://nextjs.org/docs/app/building-your-application/routing
- **Next.js Navigation** : https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating
- **ARCHITECTURE.md** : Architecture Next.js complète

---

**Document** : Routing Next.js  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
