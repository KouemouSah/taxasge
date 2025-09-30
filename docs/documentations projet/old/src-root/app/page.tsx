@@ .. @@
 import { Metadata } from 'next'
+import { Suspense } from 'react'
 import { HeroSection } from '@/components/home/HeroSection'
 import { QuickActions } from '@/components/home/QuickActions'
 import { PopularServices } from '@/components/home/PopularServices'
 import { RecentUpdates } from '@/components/home/RecentUpdates'
 import { StatsSection } from '@/components/home/StatsSection'
 import { FeaturesSection } from '@/components/home/FeaturesSection'
+import { TrustIndicators } from '@/components/home/TrustIndicators'
+import { NewsletterSignup } from '@/components/home/NewsletterSignup'

 export const metadata: Metadata = {
   title: 'TaxasGE - Services Fiscaux Guinée Équatoriale Officiel',
-  description: 'Accédez aux 547 services fiscaux officiels de Guinée Équatoriale. Calculatrice gratuite, recherche avancée, assistant IA et procédures complètes. Service public numérique.',
+  description: 'Application officielle des 547 services fiscaux de Guinée Équatoriale. Calculatrice gratuite, recherche avancée, assistant IA hors ligne et procédures complètes. Service public numérique gratuit.',
+  keywords: [
+    'taxes guinée équatoriale',
+    'impôts GQ', 
+    'services fiscaux',
+    'calculatrice fiscale',
+    'DGI guinée équatoriale',
+    'assistant fiscal IA',
+    'procédures administratives',
+    'république guinée équatoriale',
+    'BANGE paiements',
+    'services publics numériques'
+  ],
   openGraph: {
     title: 'TaxasGE - Application Fiscale Officielle',
-    description: '547 services fiscaux avec calculatrice et assistant IA',
+    description: '547 services fiscaux officiels avec calculatrice, assistant IA hors ligne et paiements BANGE sécurisés',
     images: ['/og-home.png'],
+    locale: 'es_GQ',
+    type: 'website',
+    siteName: 'TaxasGE',
   },
+  twitter: {
+    card: 'summary_large_image',
+    title: 'TaxasGE - Services Fiscaux Guinée Équatoriale',
+    description: '547 services fiscaux avec calculatrice et IA',
+    images: ['/twitter-image.png'],
+    creator: '@TaxasGE_GQ',
+  },
+  alternates: {
+    canonical: '/',
+    languages: {
+      'es-GQ': '/',
+      'fr-GQ': '/fr',
+      'en': '/en',
+    },
+  },
 }

 export default function HomePage() {
   return (
     <div className="flex flex-col">
       {/* Hero Section avec recherche prominente */}
-      <HeroSection />
+      <Suspense fallback={<div className="h-96 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-pulse" />}>
+        <HeroSection />
+      </Suspense>
       
       {/* Actions rapides */}
-      <QuickActions />
+      <Suspense fallback={<div className="h-64 bg-muted/30 animate-pulse" />}>
+        <QuickActions />
+      </Suspense>
       
       {/* Statistiques impressionnantes */}
-      <StatsSection />
+      <Suspense fallback={<div className="h-48 bg-background animate-pulse" />}>
+        <StatsSection />
+      </Suspense>
+      
+      {/* Indicateurs de confiance */}
+      <TrustIndicators />
       
       {/* Services populaires */}
-      <PopularServices />
+      <Suspense fallback={<div className="h-96 bg-muted/30 animate-pulse" />}>
+        <PopularServices />
+      </Suspense>
       
       {/* Fonctionnalités clés */}
-      <FeaturesSection />
+      <Suspense fallback={<div className="h-64 bg-background animate-pulse" />}>
+        <FeaturesSection />
+      </Suspense>
       
       {/* Mises à jour récentes */}
-      <RecentUpdates />
+      <Suspense fallback={<div className="h-48 bg-muted/30 animate-pulse" />}>
+        <RecentUpdates />
+      </Suspense>
+      
+      {/* Newsletter signup */}
+      <NewsletterSignup />
     </div>
   )
 }