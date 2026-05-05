# PHASE A — Audit visuel résiduel + finition layout (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : 0 bug visuel P1/P2 sur device réel, EAS preview APK validé, commits sémantiques pushés.
**Cible time** : 0.5 jour
**Branche** : `develop`

---

## 1. CONTEXTE & POSITIONNEMENT

Phase 9 a livré OWASP partiel + Sentry/LogRocket + RGPD export. Plusieurs commits post-Phase 9 ont déjà adressé des bugs visuels remontés terrain :

| Commit | Sujet | Status |
|--------|-------|--------|
| `adc92e4f` | onboarding spacing (B1) | ✅ pushé |
| `309cc848` | support FAB safe-area (B3) | ✅ pushé |
| `748cb252` | documents top-aligned flexGrow:1 (B4) | ✅ pushé puis revert |
| `c661ae50` | documents post-fix sans flexGrow:1 | ✅ pushé puis revert |
| `f24ee282` | safe-area bottom on stack screens | ✅ pushé |
| `8138db79` | vault items bottom-aligned avec flexGrow:1 réintroduit + windowSize fix | ✅ pushé (fix actuel HEAD) |

**Captures device fournies par user (Documentations/workflow/debug/tesoro/post-fix/)** :

| Capture | Bug | Sévérité | Status code |
|---------|-----|----------|-------------|
| `m8.jpg` | RÉFÉRENCE OK (dashboard tabs Demandes/Paiements/Alertes collés) | N/A | N/A |
| `1.jpg` | companies/[id] — dernier item "Certificado de Comercio" coupé par nav bar Android | 🔴 P1 | À vérifier sur HEAD `8138db79` |
| `2.jpg` | documents tab "Générés" — gros gap entre filter chips et liste | 🔴 P1 | Devrait être fixé par `8138db79` (flexGrow:1 + windowSize=21 + pas de removeClippedSubviews) |
| `3.jpg` | documents tab "Mes fichiers" — même bug gros gap | 🔴 P1 | Idem |
| `4.jpg` | (à inspecter) | ? | ? |
| `5.jpg` | (à inspecter) | ? | ? |
| `m1.jpg` | (à inspecter) | ? | ? |
| `m2.jpg` | (à inspecter) | ? | ? |
| `m3.jpg` | (à inspecter) | ? | ? |
| `m5.jpg` | (à inspecter) | ? | ? |

**Hypothèse** : les captures `2-5.jpg` sont **antérieures** à `8138db79` (commit du fix actuel). Phase A doit confirmer sur device réel que le fix `flexGrow:1 + windowSize=21 + sans removeClippedSubviews` résout ces bugs.

---

## 2. OBJECTIFS MESURABLES

| # | Objectif | Méthode |
|---|----------|---------|
| O1 | Vérifier sur device le fix HEAD documents (gap chips ↔ liste) | smoke test EAS preview APK |
| O2 | Vérifier safe-area companies/[id] dernier item visible | smoke 1.jpg scenario |
| O3 | Inspecter les 10 captures restantes (m1-m5, 4-5) pour identifier les bugs non encore traités | analyse user fournit |
| O4 | Audit static des 30+ écrans mobile : tous les FlatList ont le bon pattern (flexGrow:1, windowSize, sans removeClippedSubviews) | grep + Read |
| O5 | Audit static : tous les écrans stack ont `useSafeAreaInsets` bottom OU `SafeAreaView edges=['bottom']` | grep + Read |
| O6 | tsc 0 erreur, ESLint < 100 warnings (déjà cap CI) | npm run type-check + lint |
| O7 | 0 régression sur écrans stables (dashboard, chat, services list) | smoke test device |

---

## 3. ARCHITECTURE — Patterns à valider

### 3.1 Pattern FlatList anti-bug (référence : `documents/index.tsx` HEAD)

```tsx
// ✅ CORRECT (post-fix 8138db79)
<FlatList
  style={styles.flex1}                   // FlatList remplit l'espace disponible
  contentContainerStyle={{
    flexGrow: 1,                          // Top-align via flexbox flex-start
    paddingTop: 8,                        // Breathing room sous chips
    paddingBottom: 96 + insets.bottom,    // FAB clearance + safe-area
  }}
  ListEmptyComponent={...}                // Empty state aligné top
  // PAS DE removeClippedSubviews         // Bug RN Android < ~2× viewport
  initialNumToRender={15}
  maxToRenderPerBatch={20}
  windowSize={21}                         // Large fenêtre = pas d'unmount precipité
/>
```

### 3.2 Pattern safe-area bottom (référence : `companies/[id].tsx` HEAD)

```tsx
// ✅ CORRECT
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<ScrollView contentContainerStyle={{
  paddingBottom: 32 + insets.bottom,    // Inclut nav bar Android gestes
}}>
  {/* contenu */}
</ScrollView>
```

OU pour les FAB / éléments absolutely positioned :
```tsx
<FAB style={{
  position: 'absolute',
  bottom: 16 + insets.bottom,
  right: 16,
}}/>
```

### 3.3 Pattern Stack screen avec header personnalisé

```tsx
// ✅ CORRECT — Stack Screen options
<Stack.Screen options={{ title: '...', headerShown: true }}/>
<SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
  {/* contenu — top safe-area géré par le Stack header */}
</SafeAreaView>
```

---

## 4. FICHIERS CIBLES (audit static)

### 4.1 Liste des écrans avec FlatList à auditer

À identifier dynamiquement via grep `<FlatList\|FlatList\b`. Cible attendue (~10-15 écrans) :
- `app/documents/index.tsx` ✅ HEAD OK
- `app/(tabs)/requests/index.tsx`
- `app/(tabs)/payments/index.tsx`
- `app/(tabs)/services.tsx`
- `app/companies/index.tsx`
- `app/companies/[id]/payments.tsx`
- `app/directorio/index.tsx`
- `app/notifications.tsx`
- `app/support/index.tsx`
- `app/support/[id].tsx`
- `app/wizard/[sessionId]/select.tsx`
- `app/onboarding.tsx` (FlatList horizontal pour slides)

### 4.2 Liste des écrans stack à auditer pour safe-area bottom

- `app/companies/[id].tsx` ✅ HEAD OK (`f24ee282`)
- `app/companies/[id]/payments.tsx`
- `app/documents/[id].tsx`
- `app/documents/upload.tsx`
- `app/(tabs)/requests/[id].tsx`
- `app/(tabs)/payments/[id].tsx`
- `app/wizard/**/*.tsx`
- `app/calculator.tsx`
- `app/support/[id].tsx` (déjà fix `309cc848`)

---

## 5. CHECKLIST OPÉRATIONNELLE

### A.1 — Plan détaillé ✅
- [x] Ce fichier (`MOBILE_PHASE_10_A_VISUAL_FINISH_DETAILED.md`)

### A.2 — EAS Preview Build (background)
- [ ] Récupérer `expo-token` depuis GCP Secret Manager (`taxasge-dev`)
- [ ] Export `EXPO_TOKEN` env
- [ ] Lancer `cd packages/mobile && eas build --profile preview --platform android --non-interactive` (run_in_background)
- [ ] Suivre URL build sur https://expo.dev/accounts/emacsah/projects/facil/builds
- [ ] Une fois APK dispo (~15-25 min), récupérer URL et la communiquer à user
- [ ] User installe APK sur device Android personnel

### A.3 — Audit static FlatList (parallèle au build)
- [ ] Grep tous les fichiers avec `<FlatList`
- [ ] Pour chacun : vérifier pattern §3.1 (flexGrow:1 + windowSize + pas de removeClippedSubviews)
- [ ] Lister les écrans à risque dans `MOBILE_PHASE_10_A_DEVICE_AUDIT.md`

### A.4 — Audit static safe-area (parallèle au build)
- [ ] Grep tous les écrans stack pour `useSafeAreaInsets` ou `SafeAreaView edges`
- [ ] Vérifier que les écrans à scroll vertical ont `paddingBottom + insets.bottom`
- [ ] Vérifier que les FAB ont `bottom + insets.bottom`
- [ ] Lister gaps dans `MOBILE_PHASE_10_A_DEVICE_AUDIT.md`

### A.5 — User test sur device + captures
- [ ] User installe APK preview sur device Android
- [ ] User capture les 5 écrans clés × 2 thèmes (light/dark) :
  1. `/(tabs)/index` dashboard (référence m8.jpg)
  2. `/documents` tab "Mes fichiers" (vérif gap chips)
  3. `/documents` tab "Générés" (vérif gap chips)
  4. `/documents` tab "Alertes" (vérif tab vide propre)
  5. `/companies/[id]` (vérif dernier item visible)
- [ ] User envoie captures → comparaison avec post-fix attendu

### A.6 — Fix bugs résiduels (si trouvés)
- [ ] Pour chaque bug confirmé sur device : code change + test local
- [ ] Pattern §3.1 ou §3.2 appliqué
- [ ] Commit sémantique par bug
- [ ] Re-build EAS preview pour validation finale (optionnel si fix simple)

### A.7 — Critique honnête
- [ ] Écrire `MOBILE_PHASE_10_A_CRITIQUE.md` :
  - Bugs confirmés / réfutés sur device
  - Bugs résiduels non corrigés (avec justification)
  - Risques de régression
  - Recommandation push (oui/non + commits)

### A.8 — Commits + push (après validation user)
- [ ] tsc + ESLint passent
- [ ] Demander confirmation user (mémoire #13)
- [ ] Push develop
- [ ] Vérifier GitHub Actions verts (mobile-build.yml + mobile-eas-build.yml)

---

## 6. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Build EAS échoue (token expiré, deps cassées) | FAIBLE | HAUT | Token rotated 2026-04-30 (cf. .env note), rotation possible si erreur 401 |
| Captures user montrent un bug INATTENDU non encore identifié | MOYENNE | MOYEN | Phase A.6 prévoit fix + nouveau build EAS preview |
| Le fix HEAD documents (`8138db79`) ne résout PAS le gap sur certains devices | FAIBLE | HAUT | Si confirmé, fallback : retirer flexGrow:1 + remettre `justifyContent: 'flex-start'` explicite + `ListHeaderComponent: <View />` 1px pour forcer top |
| Audit static manque des FlatList dynamiquement créées (HOC, render props) | FAIBLE | FAIBLE | Grep multipattern + Read manuel des 5 modules les plus complexes |
| Dark mode non testé → bug visuel post-launch | MOYENNE | MOYEN | Phase A.5 inclut light + dark capture |
| Petit écran (5") non testé → débordement | MOYENNE | MOYEN | User device probablement standard 6"+ ; documenter dans critique si non couvert |

---

## 7. DÉCISIONS

- **Build profile** : `preview` (APK installable direct sans Play Store, pas signing prod) — pas `production` (qui produit AAB upload Play seulement)
- **Plateforme build** : Android uniquement V1 (iOS Simulator pas pertinent pour smoke device user)
- **Background** : `run_in_background: true` car build prend 15-25 min
- **Pas de re-build après chaque fix** : on bundle tous les fixes Phase A puis 1 nouveau build à la fin si nécessaire
- **Captures requises** : 5 écrans × 2 thèmes = 10 captures minimum

---

## 8. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé. Démarrage Phase A.

---

## 9. SORTIE ATTENDUE PHASE A

| Livrable | Localisation |
|----------|--------------|
| Plan détaillé | ✅ ce fichier |
| Audit static rapport | `MOBILE_PHASE_10_A_DEVICE_AUDIT.md` (à créer A.3-A.4) |
| Captures device | `Documentations/workflow/debug/tesoro/phase10-a/` (user fournit) |
| Critique | `MOBILE_PHASE_10_A_CRITIQUE.md` (à créer A.7) |
| Commits | sur `develop`, sémantiques, 1 par bug |
| Master plan | mise à jour §8 SUIVI cocher A.* completed |
