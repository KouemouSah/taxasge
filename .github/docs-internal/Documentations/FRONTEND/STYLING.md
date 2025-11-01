# 🎨 STYLING TAXASGE
## Guide Complet Tailwind CSS + Charte Graphique

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Stack** : Tailwind CSS + CSS Variables + Design System

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Charte graphique](#charte-graphique)
3. [Variables CSS](#variables-css)
4. [Classes Tailwind](#classes-tailwind)
5. [Typographie](#typographie)
6. [Couleurs](#couleurs)
7. [Espacements](#espacements)
8. [Responsive](#responsive)
9. [Animations](#animations)
10. [Best Practices](#best-practices)

---

## 🎯 VUE D'ENSEMBLE

### Stack Styling

```
Charte Graphique TaxasGE
    ↓
CSS Variables (HSL)
    ↓
Tailwind CSS (Utility Classes)
    ↓
shadcn/ui (Components)
    ↓
Design System Cohérent
```

---

### Principes Design

```
✅ Mobile-First (Design pour mobile d'abord)
✅ Accessible (WCAG 2.1 AA)
✅ Performant (CSS optimisé)
✅ Cohérent (Variables centralisées)
✅ Maintenable (Utility classes)
```

---

## 📐 CHARTE GRAPHIQUE

### Référence Complète

**Document principal** : `.github/docs-internal/Documentations/Frontend/CHARTE_GRAPHIQUE_COMPLETE.md`

Ce document contient :
- ✅ Palette couleurs complète (HSL)
- ✅ Typographie (Inter + Poppins)
- ✅ Espacements standardisés
- ✅ Composants UI documentés
- ✅ Gradients personnalisés
- ✅ Animations

**⚠️ TOUJOURS** se référer à la charte graphique avant de créer des styles custom.

---

## 🎨 VARIABLES CSS

### Fichier : `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* === COULEURS PRIMAIRES === */
    --primary: 210 100% 45%;           /* #0073E6 - Bleu Principal */
    --primary-foreground: 0 0% 100%;   /* #FFFFFF */
    
    /* === COULEURS SECONDAIRES === */
    --secondary: 160 84% 39%;          /* #10B981 - Vert Succès */
    --secondary-foreground: 0 0% 100%; /* #FFFFFF */
    
    /* === COULEURS ACCENT === */
    --accent: 210 100% 97%;            /* #EBF5FF - Bleu Clair */
    --accent-foreground: 210 100% 45%; /* #0073E6 */
    
    /* === COULEURS ÉTAT === */
    --success: 160 84% 39%;            /* #10B981 - Vert */
    --success-foreground: 0 0% 100%;   /* #FFFFFF */
    
    --warning: 38 92% 50%;             /* #F59E0B - Orange */
    --warning-foreground: 0 0% 100%;   /* #FFFFFF */
    
    --destructive: 0 84% 60%;          /* #EF4444 - Rouge */
    --destructive-foreground: 0 0% 100%; /* #FFFFFF */
    
    /* === COULEURS NEUTRES === */
    --background: 0 0% 100%;           /* #FFFFFF */
    --foreground: 222 47% 11%;         /* #0F172A - Texte principal */
    
    --muted: 210 40% 96%;              /* #F1F5F9 - Gris clair */
    --muted-foreground: 215 16% 47%;   /* #64748B - Texte secondaire */
    
    --card: 0 0% 100%;                 /* #FFFFFF */
    --card-foreground: 222 47% 11%;    /* #0F172A */
    
    --border: 214 32% 91%;             /* #E2E8F0 */
    --input: 214 32% 91%;              /* #E2E8F0 */
    --ring: 210 100% 45%;              /* #0073E6 */
    
    /* === COULEURS GUINÉE ÉQUATORIALE === */
    --eqGuinea-blue: 196 78% 38%;      /* #1598C3 */
    --eqGuinea-red: 0 85% 60%;         /* #EE3124 */
    --eqGuinea-green: 120 100% 25%;    /* #008000 */
    --eqGuinea-yellow: 48 100% 50%;    /* #FFD700 */
    
    /* === RADIUS === */
    --radius: 0.5rem;                  /* 8px */
  }
  
  /* === DARK MODE === */
  .dark {
    --background: 222 47% 11%;         /* #0F172A */
    --foreground: 210 40% 98%;         /* #F8FAFC */
    
    --primary: 210 100% 55%;           /* #3B9FF2 - Plus clair */
    --primary-foreground: 0 0% 100%;   /* #FFFFFF */
    
    --secondary: 160 84% 45%;          /* #10B981 */
    --secondary-foreground: 0 0% 100%; /* #FFFFFF */
    
    --muted: 217 33% 17%;              /* #1E293B */
    --muted-foreground: 215 20% 65%;   /* #94A3B8 */
    
    --card: 222 47% 11%;               /* #0F172A */
    --card-foreground: 210 40% 98%;    /* #F8FAFC */
    
    --border: 217 33% 17%;             /* #1E293B */
    --input: 217 33% 17%;              /* #1E293B */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* === GRADIENTS CUSTOM === */
@layer utilities {
  .gradient-hero {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
  
  .gradient-card {
    background: linear-gradient(135deg, #0073E6 0%, #0052A3 100%);
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
  }
}

/* === ANIMATIONS === */
@layer utilities {
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  
  .animate-slide-in {
    animation: slide-in 0.4s ease-out;
  }
}
```

---

## 🎨 CLASSES TAILWIND

### Configuration : `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        eqGuinea: {
          blue: 'hsl(var(--eqGuinea-blue))',
          red: 'hsl(var(--eqGuinea-red))',
          green: 'hsl(var(--eqGuinea-green))',
          yellow: 'hsl(var(--eqGuinea-yellow))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## ✍️ TYPOGRAPHIE

### Fonts

**Primary** : Inter (Corps de texte)  
**Heading** : Poppins (Titres)

```tsx
// app/layout.tsx
import { Inter, Poppins } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

### Hiérarchie Typographique

```tsx
// Titres (Poppins)
<h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold">
  Titre Principal
</h1>

<h2 className="font-heading text-3xl md:text-4xl font-bold">
  Titre Niveau 2
</h2>

<h3 className="font-heading text-2xl md:text-3xl font-semibold">
  Titre Niveau 3
</h3>

<h4 className="font-heading text-xl md:text-2xl font-semibold">
  Titre Niveau 4
</h4>

// Corps de texte (Inter)
<p className="text-base leading-relaxed">
  Texte normal - 16px
</p>

<p className="text-sm text-muted-foreground">
  Texte secondaire - 14px
</p>

<p className="text-xs text-muted-foreground">
  Légende - 12px
</p>

// Bold/Medium
<p className="font-medium">Texte medium (500)</p>
<p className="font-semibold">Texte semi-bold (600)</p>
<p className="font-bold">Texte bold (700)</p>
```

---

### Line Height

```tsx
// Défaut (leading-normal)
<p className="leading-normal">Line height: 1.5</p>

// Texte long (leading-relaxed)
<p className="leading-relaxed">Line height: 1.625</p>

// Titres (leading-tight)
<h1 className="leading-tight">Line height: 1.25</h1>

// Très compact (leading-none)
<p className="leading-none">Line height: 1</p>
```

---

## 🎨 COULEURS

### Utilisation Variables CSS

```tsx
// Couleurs primaires
<div className="bg-primary text-primary-foreground">
  Fond bleu, texte blanc
</div>

<Button variant="default">Bouton primaire</Button>

// Couleurs secondaires
<div className="bg-secondary text-secondary-foreground">
  Fond vert, texte blanc
</div>

<Button variant="secondary">Bouton secondaire</Button>

// Couleurs état
<div className="bg-success text-success-foreground">
  Succès
</div>

<div className="bg-warning text-warning-foreground">
  Avertissement
</div>

<div className="bg-destructive text-destructive-foreground">
  Erreur
</div>

// Couleurs neutres
<div className="bg-muted text-muted-foreground">
  Fond gris, texte secondaire
</div>

// Couleurs Guinée Équatoriale
<div className="bg-eqGuinea-blue">Bleu drapeau</div>
<div className="bg-eqGuinea-red">Rouge drapeau</div>
<div className="bg-eqGuinea-green">Vert drapeau</div>
```

---

### Opacity Modifiers

```tsx
// Opacity avec /
<div className="bg-primary/10">10% opacité</div>
<div className="bg-primary/20">20% opacité</div>
<div className="bg-primary/50">50% opacité</div>
<div className="bg-primary/80">80% opacité</div>

// Texte
<p className="text-foreground/70">Texte 70% opacité</p>

// Border
<div className="border border-primary/30">Border 30% opacité</div>
```

---

### Gradients

```tsx
// Gradients custom (dans globals.css)
<div className="gradient-hero">
  Gradient hero (vert)
</div>

<div className="gradient-card">
  Gradient card (bleu)
</div>

// Texte gradient
<h1 className="gradient-text">
  Texte avec gradient
</h1>

// Gradients Tailwind natifs
<div className="bg-gradient-to-r from-primary to-secondary">
  Gradient horizontal
</div>

<div className="bg-gradient-to-b from-primary to-secondary">
  Gradient vertical
</div>

<div className="bg-gradient-to-br from-primary via-accent to-secondary">
  Gradient diagonal avec via
</div>
```

---

## 📏 ESPACEMENTS

### Padding

```tsx
// Padding uniforme
<div className="p-0">0px</div>
<div className="p-1">4px</div>
<div className="p-2">8px</div>
<div className="p-4">16px</div>
<div className="p-6">24px</div>
<div className="p-8">32px</div>
<div className="p-12">48px</div>

// Padding directionnel
<div className="px-4">Horizontal 16px</div>
<div className="py-8">Vertical 32px</div>
<div className="pt-4">Top 16px</div>
<div className="pb-4">Bottom 16px</div>
<div className="pl-4">Left 16px</div>
<div className="pr-4">Right 16px</div>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  4 (mobile), 6 (tablet), 8 (desktop)
</div>
```

---

### Margin

```tsx
// Margin uniforme
<div className="m-4">16px</div>
<div className="m-8">32px</div>

// Margin directionnel
<div className="mx-auto">Centré horizontalement</div>
<div className="my-8">Vertical 32px</div>
<div className="mt-4">Top 16px</div>
<div className="-mt-4">Top négatif -16px</div>

// Responsive margin
<div className="mb-4 md:mb-6 lg:mb-8">
  4 (mobile), 6 (tablet), 8 (desktop)
</div>
```

---

### Gap (Grid/Flex)

```tsx
// Flex gap
<div className="flex gap-2">Gap 8px</div>
<div className="flex gap-4">Gap 16px</div>
<div className="flex gap-6">Gap 24px</div>

// Grid gap
<div className="grid grid-cols-3 gap-4">
  Grid gap 16px
</div>

// Gap directionnel
<div className="flex gap-x-4 gap-y-8">
  Horizontal 16px, Vertical 32px
</div>

// Responsive gap
<div className="grid gap-4 md:gap-6 lg:gap-8">
  4 (mobile), 6 (tablet), 8 (desktop)
</div>
```

---

### Space Between

```tsx
// Vertical spacing entre éléments
<div className="space-y-2">
  <div>Élément 1</div>
  <div>Élément 2</div>
  <div>Élément 3</div>
</div>

<div className="space-y-4">8px entre éléments</div>
<div className="space-y-6">24px entre éléments</div>

// Horizontal spacing
<div className="flex space-x-4">
  <div>Élément 1</div>
  <div>Élément 2</div>
</div>
```

---

## 📱 RESPONSIVE

### Breakpoints

```
sm:  640px   → Tablette portrait
md:  768px   → Tablette landscape
lg:  1024px  → Desktop
xl:  1280px  → Large desktop
2xl: 1536px  → Extra large
```

---

### Mobile First

```tsx
// ✅ Bon : Mobile first (défaut = mobile)
<div className="text-sm md:text-base lg:text-lg">
  sm (mobile), base (tablet), lg (desktop)
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  1 col (mobile), 2 cols (tablet), 3 cols (desktop)
</div>

<div className="hidden md:block">
  Caché mobile, visible tablet+
</div>

<div className="block md:hidden">
  Visible mobile, caché tablet+
</div>

// ❌ Mauvais : Desktop first
<div className="text-lg lg:text-base md:text-sm">
  Ne pas faire
</div>
```

---

### Patterns Responsive Fréquents

```tsx
// Container responsive
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  Padding adaptatif
</div>

// Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  Cards grid
</div>

// Flex responsive
<div className="flex flex-col md:flex-row gap-4">
  Vertical mobile, horizontal tablet+
</div>

// Texte responsive
<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
  Titre adaptatif
</h1>

// Sidebar responsive
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

---

## 🎬 ANIMATIONS

### Transitions

```tsx
// Transition générale
<div className="transition-all duration-300">
  Toutes propriétés - 300ms
</div>

// Transition spécifique
<div className="transition-colors duration-200">
  Couleurs seulement - 200ms
</div>

<div className="transition-transform duration-300">
  Transform seulement - 300ms
</div>

<div className="transition-opacity duration-500">
  Opacity seulement - 500ms
</div>

// Hover transitions
<Button className="transition-all hover:scale-105">
  Scale au hover
</Button>

<Card className="transition-shadow hover:shadow-lg">
  Shadow au hover
</Card>
```

---

### Animations Custom

```tsx
// Animations définies dans globals.css

// Fade in
<div className="animate-fade-in">
  Apparition progressive
</div>

// Slide in
<div className="animate-slide-in">
  Glissement depuis gauche
</div>

// Animations Tailwind natives
<div className="animate-spin">Rotation</div>
<div className="animate-ping">Ping</div>
<div className="animate-pulse">Pulse</div>
<div className="animate-bounce">Bounce</div>
```

---

### Hover States

```tsx
// Background hover
<div className="bg-primary hover:bg-primary/90">
  Darken au hover
</div>

// Scale hover
<Button className="hover:scale-105 transition-transform">
  Agrandir au hover
</Button>

// Shadow hover
<Card className="hover:shadow-lg transition-shadow">
  Shadow au hover
</Card>

// Text hover
<a className="text-primary hover:text-primary/80 hover:underline">
  Lien avec hover
</a>

// Group hover (parent → enfant)
<div className="group">
  <img className="group-hover:scale-110 transition-transform" />
  <p className="group-hover:text-primary">Texte</p>
</div>
```

---

## 🎯 BEST PRACTICES

### ✅ DO (À FAIRE)

```tsx
// ✅ Utiliser variables CSS
<div className="bg-primary text-primary-foreground">

// ✅ Mobile first
<div className="text-sm md:text-base lg:text-lg">

// ✅ Utility classes
<Button className="bg-primary hover:bg-primary/90">

// ✅ Espacements cohérents (4, 6, 8, 12, 16)
<div className="p-4 mb-6">

// ✅ Classes sémantiques
<p className="text-muted-foreground">Texte secondaire</p>

// ✅ Responsive images
<img className="w-full h-auto" />

// ✅ Transitions pour UX
<Button className="transition-colors hover:bg-primary/90">

// ✅ Container responsive
<div className="container mx-auto px-4">
```

---

### ❌ DON'T (À ÉVITER)

```tsx
// ❌ Couleurs en dur
<div style={{ backgroundColor: '#0073E6' }}>
// ✅ Utiliser variables
<div className="bg-primary">

// ❌ Styles inline
<div style={{ padding: '16px', margin: '8px' }}>
// ✅ Utility classes
<div className="p-4 m-2">

// ❌ Valeurs custom non standards
<div className="p-[13px] mb-[27px]">
// ✅ Valeurs standards
<div className="p-4 mb-6">

// ❌ Classes longues répétées
<Card className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
<Card className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
// ✅ Extraire en composant
<ServiceCard />

// ❌ Desktop first
<div className="text-lg md:text-base sm:text-sm">
// ✅ Mobile first
<div className="text-sm md:text-base lg:text-lg">

// ❌ !important partout
<div className="!bg-primary !text-white">
// ✅ Spécificité correcte
<div className="bg-primary text-primary-foreground">
```

---

## 🎨 PATTERNS COMMUNS

### Card Pattern

```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle className="text-xl font-semibold">Titre</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm leading-relaxed">Contenu</p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Action</Button>
  </CardFooter>
</Card>
```

---

### Hero Section Pattern

```tsx
<section className="gradient-hero py-20 md:py-32">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
      Titre Principal
    </h1>
    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
      Description du service
    </p>
    <Button size="lg" variant="secondary">
      Commencer
    </Button>
  </div>
</section>
```

---

### Grid Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id} className="hover:shadow-lg transition-all">
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

### Stats Section Pattern

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Card>
    <CardContent className="pt-6">
      <div className="text-3xl font-bold text-primary mb-2">1,234</div>
      <p className="text-sm text-muted-foreground">Utilisateurs</p>
    </CardContent>
  </Card>
  {/* Répéter pour autres stats */}
</div>
```

---

## 📚 UTILITAIRES HELPER

### cn() Utility (Class Names)

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage** :
```tsx
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    'bg-primary hover:bg-primary/90',
    isLoading && 'opacity-50 cursor-not-allowed',
    className // Props externe
  )}
>
  Click
</Button>
```

---

## 📚 RÉFÉRENCES

- **Tailwind CSS** : https://tailwindcss.com/docs
- **Charte Graphique** : `.github/docs-internal/Documentations/Frontend/CHARTE_GRAPHIQUE_COMPLETE.md`
- **shadcn/ui** : https://ui.shadcn.com/
- **COMPONENTS.md** : Composants UI

---

## 🎨 COULEURS RÉFÉRENCE RAPIDE

```
PRIMARY       : #0073E6 (Bleu)
SECONDARY     : #10B981 (Vert)
SUCCESS       : #10B981 (Vert)
WARNING       : #F59E0B (Orange)
DESTRUCTIVE   : #EF4444 (Rouge)
MUTED         : #F1F5F9 (Gris clair)

EQGUINEA-BLUE : #1598C3
EQGUINEA-RED  : #EE3124
EQGUINEA-GREEN: #008000
EQGUINEA-YELLOW: #FFD700
```

---

**Document** : Styling & Design System  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
