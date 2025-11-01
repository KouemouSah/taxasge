# 🏗️ ARCHITECTURE FRONTEND TAXASGE
## Next.js 14 App Router - Structure & Patterns

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Stack** : Next.js 14 + React 18 + TypeScript + Tailwind CSS + shadcn/ui

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des dossiers](#structure-des-dossiers)
3. [App Router Next.js](#app-router-nextjs)
4. [Server vs Client Components](#server-vs-client-components)
5. [Routing & Navigation](#routing--navigation)
6. [Layouts](#layouts)
7. [Data Fetching](#data-fetching)
8. [State Management](#state-management)
9. [Patterns d'architecture](#patterns-darchitecture)

---

## 🎯 VUE D'ENSEMBLE

### Stack Technique

```
Next.js 14 (App Router)
    ↓
React 18 (Server Components + Client Components)
    ↓
TypeScript (Type Safety)
    ↓
Tailwind CSS (Styling)
    ↓
shadcn/ui (UI Components)
    ↓
Zustand (State Management Global)
    ↓
React Hook Form + Zod (Forms & Validation)
```

### Principes Architecturaux

```
✅ Server-First (Server Components par défaut)
✅ Type-Safe (TypeScript strict)
✅ Component-Driven (Composants réutilisables)
✅ Co-located (Fichiers proches de leur usage)
✅ Performance-Optimized (SSR, RSC, Streaming)
```

---

## 📁 STRUCTURE DES DOSSIERS

### Structure Actuelle (`packages/web`)

```
packages/web/
├── src/
│   ├── app/                           ← Next.js App Router (Routes)
│   │   ├── layout.tsx                 ← Root layout (global)
│   │   ├── page.tsx                   ← Landing page (/)
│   │   ├── globals.css                ← Styles globaux + variables CSS
│   │   │
│   │   ├── auth/                      ← Routes authentification
│   │   │   ├── login/
│   │   │   │   └── page.tsx           ← /auth/login
│   │   │   └── register/
│   │   │       └── page.tsx           ← /auth/register
│   │   │
│   │   └── dashboard/                 ← Routes dashboard (privées)
│   │       ├── layout.tsx             ← Layout avec sidebar
│   │       └── page.tsx               ← /dashboard
│   │
│   ├── components/                    ← Composants React
│   │   ├── ui/                        ← shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...                    ← 30+ composants
│   │   │
│   │   └── layout/                    ← Composants layout
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       └── sidebar.tsx
│   │
│   ├── lib/                           ← Logique métier
│   │   ├── api/                       ← Clients API
│   │   │   ├── auth.ts
│   │   │   ├── services.ts
│   │   │   └── declarations.ts
│   │   │
│   │   ├── stores/                    ← Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   └── ui-store.ts
│   │   │
│   │   ├── validations/               ← Schémas Zod
│   │   │   ├── auth.ts
│   │   │   └── declarations.ts
│   │   │
│   │   ├── utils.ts                   ← Utilitaires (cn, formatters)
│   │   └── constants.ts               ← Constantes app
│   │
│   └── types/                         ← Types TypeScript
│       ├── auth.ts
│       ├── tax.ts
│       └── index.ts
│
├── public/                            ← Assets statiques
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tailwind.config.ts                 ← Config Tailwind
├── tsconfig.json                      ← Config TypeScript
├── next.config.js                     ← Config Next.js
└── package.json

```

---

## 🛣️ APP ROUTER NEXT.JS

### Concepts Clés

**App Router** (Next.js 13+) utilise le système de fichiers pour définir les routes :

```
app/
├── page.tsx              → Route : /
├── layout.tsx            → Layout : Toutes les pages
│
├── services/
│   ├── page.tsx          → Route : /services
│   └── [id]/
│       └── page.tsx      → Route : /services/123 (dynamic)
│
├── dashboard/
│   ├── layout.tsx        → Layout : Toutes les pages /dashboard/*
│   ├── page.tsx          → Route : /dashboard
│   └── profile/
│       └── page.tsx      → Route : /dashboard/profile
│
└── auth/
    ├── login/
    │   └── page.tsx      → Route : /auth/login
    └── register/
        └── page.tsx      → Route : /auth/register
```

### Fichiers Spéciaux

| Fichier | Rôle | Exemple |
|---------|------|---------|
| `page.tsx` | Définit une route | `/services/page.tsx` → `/services` |
| `layout.tsx` | Layout partagé pour routes enfants | Sidebar dashboard |
| `loading.tsx` | UI pendant chargement | Skeleton, Spinner |
| `error.tsx` | UI erreur | Error boundary |
| `not-found.tsx` | 404 page | Custom 404 |

---

## ⚙️ SERVER VS CLIENT COMPONENTS

### Server Components (Par Défaut)

**Tous les composants sont Server Components par défaut** dans App Router.

**Avantages** :
- ✅ Chargement initial plus rapide (moins de JS client)
- ✅ Accès direct base de données / API backend
- ✅ SEO optimal (HTML rendu côté serveur)

**Exemple** :
```tsx
// app/services/page.tsx
// Server Component (pas besoin de 'use client')

import { Card } from '@/components/ui/card';

export default async function ServicesPage() {
  // ✅ Peut fetch directement depuis serveur
  const services = await fetchServices();
  
  return (
    <main>
      <h1>Services</h1>
      {services.map(service => (
        <Card key={service.id}>{service.name}</Card>
      ))}
    </main>
  );
}
```

---

### Client Components

**Nécessaire quand** :
- ❌ State interactif (`useState`, `useReducer`)
- ❌ Hooks React (`useEffect`, `useCallback`)
- ❌ Event handlers (`onClick`, `onChange`)
- ❌ Browser APIs (`localStorage`, `window`)

**Déclaration** : Ajouter `'use client'` en haut du fichier

**Exemple** :
```tsx
// components/search-bar.tsx
'use client'; // ← OBLIGATOIRE pour interactivité

import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  const [query, setQuery] = useState('');
  
  return (
    <Input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Rechercher..."
    />
  );
}
```

---

### Pattern Hybride (Recommandé)

**Server Component** (page) + **Client Components** (interactivité)

```tsx
// app/services/page.tsx
// ✅ Server Component (pas de 'use client')

import { SearchBar } from '@/components/search-bar'; // Client
import { ServiceCard } from '@/components/service-card'; // Client

export default async function ServicesPage() {
  const services = await fetchServices(); // Server-side
  
  return (
    <main>
      <h1>Services</h1>
      {/* Client Component pour interactivité */}
      <SearchBar />
      
      {/* Passer data via props */}
      <div className="grid gap-6">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </main>
  );
}
```

---

## 🧭 ROUTING & NAVIGATION

### Navigation `<Link>` (Next.js)

```tsx
import Link from 'next/link';

// Navigation simple
<Link href="/services">Services</Link>

// Navigation avec paramètres
<Link href={`/services/${id}`}>Voir détails</Link>

// Navigation avec state
<Link 
  href="/services/123"
  state={{ from: 'search' }} // ❌ Next.js ne supporte pas state
>
  Voir détails
</Link>

// ✅ Alternative : Query params
<Link href="/services/123?from=search">Voir détails</Link>
```

---

### Navigation Programmatique

```tsx
'use client';

import { useRouter } from 'next/navigation'; // ⚠️ Pas 'next/router'

export function LoginForm() {
  const router = useRouter();
  
  const handleSubmit = async () => {
    // Login logic...
    
    // Navigation après succès
    router.push('/dashboard');
    
    // Autres méthodes
    router.back();           // Retour
    router.forward();        // Avant
    router.refresh();        // Refresh page
    router.replace('/home'); // Replace (pas history)
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### Dynamic Routes (Paramètres)

```tsx
// app/services/[id]/page.tsx
// Route : /services/123

interface PageProps {
  params: {
    id: string; // ✅ TypeScript
  };
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { id } = params; // "123"
  
  return <div>Service ID: {id}</div>;
}
```

**Route avec plusieurs paramètres** :
```
app/users/[userId]/posts/[postId]/page.tsx
→ /users/123/posts/456

params = { userId: "123", postId: "456" }
```

---

### Query Parameters (Search Params)

```tsx
// app/services/page.tsx
// Route : /services?category=license&search=import

interface PageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

export default function ServicesPage({ searchParams }: PageProps) {
  const category = searchParams.category; // "license"
  const search = searchParams.search;     // "import"
  
  return <div>Category: {category}</div>;
}
```

---

## 🎨 LAYOUTS

### Root Layout (Global)

```tsx
// app/layout.tsx
// S'applique à TOUTES les pages

import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TaxasGE - Services Fiscaux',
  description: 'Plateforme des services fiscaux de Guinée Équatoriale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* Header global (si nécessaire) */}
        <header>...</header>
        
        {/* Contenu pages */}
        {children}
        
        {/* Footer global (si nécessaire) */}
        <footer>...</footer>
      </body>
    </html>
  );
}
```

---

### Nested Layouts (Imbriqués)

**Dashboard avec Sidebar** :

```tsx
// app/dashboard/layout.tsx
// S'applique à /dashboard/*

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
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
```

**Pages dashboard** héritent automatiquement du layout :
```
app/dashboard/
├── layout.tsx          ← Sidebar layout
├── page.tsx            ← /dashboard (avec sidebar)
├── profile/
│   └── page.tsx        ← /dashboard/profile (avec sidebar)
└── settings/
    └── page.tsx        ← /dashboard/settings (avec sidebar)
```

---

### Route Groups (Organisation)

**Sans affecter URL** :

```
app/
├── (public)/           ← Groupe (pas dans URL)
│   ├── layout.tsx      ← Layout pages publiques
│   ├── page.tsx        ← /
│   └── services/
│       └── page.tsx    ← /services
│
└── (dashboard)/        ← Groupe (pas dans URL)
    ├── layout.tsx      ← Layout dashboard
    └── home/
        └── page.tsx    ← /home (pas /dashboard/home)
```

---

## 📡 DATA FETCHING

### Server-Side Fetch (Recommandé)

```tsx
// app/services/page.tsx
// Server Component

export default async function ServicesPage() {
  // ✅ Fetch côté serveur (SSR)
  const services = await fetch('https://api.taxasge.gq/services', {
    cache: 'no-store', // Pas de cache (données dynamiques)
    // OU
    next: { revalidate: 60 }, // Cache 60 secondes
  }).then(res => res.json());
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  );
}
```

---

### Client-Side Fetch (Si nécessaire)

```tsx
'use client';

import { useEffect, useState } from 'react';

export function ServicesList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Chargement...</div>;
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  );
}
```

---

### API Client (lib/api/)

**Structure recommandée** :

```tsx
// lib/api/services.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getServices() {
  const response = await fetch(`${API_BASE_URL}/services`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  
  return response.json();
}

export async function getServiceById(id: string) {
  const response = await fetch(`${API_BASE_URL}/services/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch service');
  }
  
  return response.json();
}
```

**Usage dans page** :
```tsx
// app/services/page.tsx
import { getServices } from '@/lib/api/services';

export default async function ServicesPage() {
  const services = await getServices();
  
  return <div>...</div>;
}
```

---

## 🗄️ STATE MANAGEMENT

### Local State (useState)

**Pour état composant seul** :

```tsx
'use client';

import { useState } from 'react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  
  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

---

### Global State (Zustand)

**Pour état partagé entre composants** :

```tsx
// lib/stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

**Usage** :
```tsx
'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export function UserMenu() {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

**Voir** : `STATE_MANAGEMENT.md` pour détails complets

---

## 🎨 PATTERNS D'ARCHITECTURE

### Pattern 1 : Page Server + Composants Client

```tsx
// app/services/page.tsx (Server Component)
import { SearchBar } from '@/components/search-bar'; // Client
import { getServices } from '@/lib/api/services';

export default async function ServicesPage() {
  // Server-side data fetching
  const services = await getServices();
  
  return (
    <main>
      <h1>Services</h1>
      
      {/* Client Component pour interactivité */}
      <SearchBar />
      
      {/* Server Component pour render initial */}
      <div className="grid gap-6">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </main>
  );
}
```

---

### Pattern 2 : Layout Imbriqués

```tsx
// app/layout.tsx (Root)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header /> {/* Global */}
        {children}
        <Footer /> {/* Global */}
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx (Dashboard)
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar /> {/* Dashboard only */}
      <main>{children}</main>
    </div>
  );
}
```

---

### Pattern 3 : API Client Centralisé

```tsx
// lib/api/client.ts
class ApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

---

### Pattern 4 : Type-Safe Routes

```tsx
// lib/routes.ts
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  SERVICE_DETAIL: (id: string) => `/services/${id}`,
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
} as const;

// Usage
<Link href={ROUTES.SERVICE_DETAIL('123')}>Voir détails</Link>
```

---

## 🎯 BEST PRACTICES

### ✅ DO (À FAIRE)

```tsx
// ✅ Server Component par défaut
export default async function Page() { ... }

// ✅ 'use client' seulement si nécessaire
'use client';
import { useState } from 'react';

// ✅ Fetch côté serveur quand possible
const data = await fetch(...);

// ✅ Types TypeScript stricts
interface PageProps {
  params: { id: string };
  searchParams: { query?: string };
}

// ✅ Imports depuis @/
import { Button } from '@/components/ui/button';

// ✅ Co-location (fichiers proches usage)
app/services/
├── page.tsx
├── loading.tsx
└── components/
    └── service-card.tsx
```

---

### ❌ DON'T (À ÉVITER)

```tsx
// ❌ 'use client' partout (perte SSR)
'use client'; // Uniquement si nécessaire !

// ❌ Fetch client-side si possible server-side
useEffect(() => { fetch(...) }); // Préférer await fetch() dans Server Component

// ❌ Layouts dans pages
export default function Page() {
  return (
    <>
      <Header />
      <main>...</main>
      <Footer />
    </>
  );
}
// ✅ Utiliser layout.tsx à la place

// ❌ Imports relatifs longs
import { Button } from '../../../components/ui/button';
// ✅ Utiliser @/
import { Button } from '@/components/ui/button';
```

---

## 📚 RÉFÉRENCES

### Documentation Officielle
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Documentations TaxasGE Complémentaires
- `COMPONENTS.md` - Composants shadcn/ui
- `ROUTING.md` - Routing approfondi
- `STATE_MANAGEMENT.md` - Zustand stores
- `FORMS.md` - Formulaires react-hook-form + Zod
- `STYLING.md` - Tailwind CSS + Charte graphique

---

**Document** : Architecture Frontend  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
