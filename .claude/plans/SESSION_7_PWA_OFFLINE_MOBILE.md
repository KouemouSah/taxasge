# Session 7 — PWA Offline + Mobile Optimization

**Prérequis** : Session 6 (Encaissement + Dashboard superviseur complet)
**Durée estimée** : 3h

---

## Phase 8 : PWA Configuration + Offline + Mobile (3h)

### 8.1 PWA Manifest (30min)

**Fichier** : `packages/web/public/manifest.json`

```json
{
  "name": "Facil — Control Terrain",
  "short_name": "Facil Control",
  "description": "Application de contrôle et recouvrement terrain",
  "start_url": "/es/dashboard/agent",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2d5a03",
  "icons": [
    { "src": "/logo192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/logo512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Barre de statut réseau : banner vert "En ligne" / rouge "Hors ligne"
- Installation prompt sur mobile (beforeinstallprompt)

### 8.2 Service Worker (1h)

**Stratégie cache** :
- **Static assets** : Cache-first (CSS, JS, images, fonts)
- **API filter data** : Stale-while-revalidate (zones, sectors, formas)
- **API search/inspections** : Network-first (données fraîches prioritaires)
- **Offline queue** : Background Sync API pour les POST en attente

**Offline Queue** :
```typescript
// Intercepte les POST /inspections/* quand offline
// Stocke dans IndexedDB
// Sync automatique quand navigator.onLine revient
// Badge "N inspections en attente de sync"
```

### 8.3 IndexedDB pour inspections offline (1h)

**Schema** :
```typescript
interface OfflineInspection {
  id: string // UUID local
  licenseId: string
  companyName: string
  result: string
  photos: Blob[] // Stockées localement
  gps: { lat: number; lng: number; accuracy: number }
  notes: string
  createdAt: string
  synced: boolean
  syncError?: string
}
```

**Flow offline** :
1. Agent ouvre le scan → données licence en cache (stale-while-revalidate)
2. Agent complète l'inspection → stockée en IndexedDB
3. Photos compressées (<500KB) avant stockage
4. Banner : "1 inspection en attente de synchronisation"
5. Retour réseau → sync automatique via Background Sync
6. Si sync échoue → retry 3x puis notification agent

### 8.4 Touch UX (30min)

- Bottom sheet pour les actions (valider/sceller/encaisser) : Sheet side="bottom"
- Boutons : min 44px (WCAG 2.1 touch target)
- Pull-to-refresh sur les listes (via onTouchStart/onTouchMove)
- Haptic feedback : `navigator.vibrate(50)` sur actions critiques (scellé)
- Camera : plein écran avec overlay crosshair pour le scan QR
- Photos : accès direct caméra (`capture="environment"` sur input file)

---

## Validation Session 7

- [ ] PWA installable sur mobile (manifest + service worker)
- [ ] Banner online/offline visible
- [ ] Inspection créée offline → stockée IndexedDB
- [ ] Sync automatique au retour réseau
- [ ] Photos compressées (<500KB)
- [ ] Badge "N en attente" visible
- [ ] Touch targets 44px minimum
- [ ] Pull-to-refresh fonctionne
- [ ] Camera scan plein écran sur mobile
- [ ] Test zone sans réseau : inspection complète possible
- [ ] ESLint 0 erreurs, TypeScript 0 erreurs
- [ ] Push + CI green

---

## POST-LIVRAISON : Tests terrain

### Scénarios de test (avec agents réels)

| # | Scénario | Attendu |
|---|---|---|
| 1 | Scan QR licence autonomo conforme + payée | Rapport inspection OK + email/SMS |
| 2 | Saisie NIF entreprise SA + non-payée | Affiche obligations impayées |
| 3 | Mise en demeure sur commerce impayé | PDF MED + email + deadline 72h |
| 4 | Scellé après MED expirée | Pending supervisor + notification |
| 5 | Superviseur approuve scellé | Company inactive + license suspended + PV PDF |
| 6 | Encaissement cash terrain | Reçu numéroté + flow trésorerie |
| 7 | Encaissement mobile money | Redirect BANGE + webhook auto |
| 8 | Réconciliation fin de journée | Liste cash + total à reverser |
| 9 | Inspection offline (mode avion) | Stockée localement + sync au retour |
| 10 | 2 agents inspectent même commerce le même jour | Bloqué par constraint unique |
