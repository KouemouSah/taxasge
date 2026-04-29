# PHASE A — Layout & Safe-area (DETAILED PLAN)

**Date** : 2026-04-29
**Phase parent** : `MOBILE_BUGFIX_PHASE9_TO_10_MASTER_PLAN.md`
**Bugs couverts** : B1 onboarding, B3 tickets, B4 documents, B5b companies license UX
**Durée estimée** : 0.5j
**Bloquant pour suite** : Non (Phase B/C/D peuvent partir en parallèle)

---

## 1. CONTEXTE

Phase visuelle pure — corrections CSS, safe-area, paddings. Aucune mutation de données, aucun nouvel endpoint. Faible risque de régression.

Source de vérité : captures `Documentations/workflow/debug/tesoro/{onboard,m3,m4,m5,m6,m11,m12,m14}.jpg` + audit agent (rapport complet en mémoire conversation).

---

## 2. ARCHITECTURE DES CHANGEMENTS

### 2.1 Fichiers à modifier

| Fichier | Type | Bug |
|---------|------|-----|
| `packages/mobile/src/app/onboarding.tsx` | Edit | B1 |
| `packages/mobile/src/app/support/index.tsx` | Edit | B3 |
| `packages/mobile/src/app/support/[id].tsx` | Edit | B3 |
| `packages/mobile/src/app/documents/index.tsx` | Edit | B4 |
| `packages/mobile/src/modules/vault/components/document-empty-state.tsx` | Edit | B4 |
| `packages/mobile/src/app/companies/[id].tsx` | Edit | B5b |

### 2.2 Décisions clés

**B1 onboarding** — au lieu de bumper `marginBottom`, on applique une **double mesure** :
- `desc.marginBottom: 28 → 36` (+8dp aération texte)
- `lastSlideButtons.gap: 10 → 12` (+2dp entre lignes de boutons)
- `lastSlideButtons.paddingTop: undefined → 12` (espace explicite avant le bouton dashed)

Plus robuste qu'un seul changement parce que l'i18n fait varier la longueur de la `desc` (FR > ES > EN).

**B3 support** — pattern unifié `useSafeAreaInsets`. Même fix que `documents/index.tsx:65,316` :
- `index.tsx` : FAB `bottom: 16 + insets.bottom`
- `[id].tsx` : `replyBar.paddingBottom: 8 + insets.bottom` ET `closedBar.paddingBottom: 12 + insets.bottom`. PAS d'`edges={['top','bottom']}` sur SafeAreaView (casserait le KeyboardAvoidingView).

**B4 documents** — fix combiné :
- FlatList : `style={[styles.flex1]}` ajouté → garantit flex:1 sur tous les Android
- `contentContainerStyle` toujours `{ flexGrow: 1, paddingTop: 8, paddingBottom: 16 + insets.bottom + 80 }` (80 = espace FAB) — **pas de variant conditionnel** sur `data.length`
- DocumentEmptyState : suppression de `paddingVertical: 64` (centré visuel) → `paddingTop: 48` only (top-aligned)

**B5b companies license card** — refonte de la License Card seulement :
- 3 chips colorés horizontaux : 🟠 Échéance / 🔵 Total / 🟢 Payé. Couleurs sémantiques cohérentes avec `statusColor`. Layout responsive flex.
- Bouton "Télécharger licence" : `alignSelf: 'flex-start' → 'center'`, full-width sur petits écrans.
- "Historique de paiements" : déplacé dans le `Menu` kebab → ouvre une bottom sheet (ou route dédiée `/companies/{id}/payments`).
- Bug i18n : `t('detail.total')` → `t('companies.detail.total')` (+ ajouter clé manquante dans `es.json`/`fr.json`/`en.json` si absente).

### 2.3 Pattern réutilisé (référence)

```tsx
// FAB safe-area pattern (reused from documents/index.tsx:65,316)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
// ...
<FAB style={[styles.fab, { bottom: 16 + insets.bottom }]} />
```

```tsx
// FlatList top-aligned content pattern
<FlatList
  style={{ flex: 1 }}
  contentContainerStyle={{
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 16 + insets.bottom + 80, // 80 = FAB clearance
  }}
  ListEmptyComponent={<EmptyState />}  // empty state has paddingTop only, no flex centering
/>
```

---

## 3. CHECKLIST ATOMIQUE PHASE A

### A.1 Plan validé ✅

- [x] Plan rédigé et enregistré dans `.claude/plans/`

### A.2 B1 — Onboarding spacing (~5min) ✅

- [x] **A.2.1** Lire `onboarding.tsx` ligne 688 + 710 (états actuels)
- [x] **A.2.2** Patch `desc.marginBottom: 28 → 36`
- [x] **A.2.3** Patch `lastSlideButtons` ajouter `paddingTop: 12, gap: 12`
- [x] **A.2.4** Vérification visuelle (commit `adc92e4f`)

### A.3 B3 — Support safe-area (~10min) ✅

- [x] **A.3.1** `support/index.tsx` : `import { useSafeAreaInsets }` + FAB `bottom: 16 + insets.bottom`
- [x] **A.3.2** `support/[id].tsx` : `import { useSafeAreaInsets }` + `replyBar.paddingBottom` + `closedBar.paddingBottom` avec `insets.bottom`
- [x] **A.3.3** `KeyboardAvoidingView` non cassé (commit `309cc848`)

### A.4 B4 — Documents layout (~15min) ✅

- [x] **A.4.1** `documents/index.tsx` : `style={styles.flex1}` sur les 3 FlatList
- [x] **A.4.2** `contentContainerStyle = listContentStyle` constant (conditionnel supprimé)
- [x] **A.4.3** Empty state simplifié
- [x] **A.4.4** `document-empty-state.tsx` : `paddingTop:48` top-aligned (commit `748cb252`)

### A.5 B5b — Companies license UX (~30min) ✅

- [x] **A.5.1** 3 chips colorés (`primaryContainer` / `tertiaryContainer` / `secondaryContainer`)
- [x] **A.5.2** Refonte License Card avec chips
- [x] **A.5.3** Bouton "Télécharger licence" centré (`alignSelf:'center'`)
- [x] **A.5.4** Clés i18n `companies.detail.summary.{deadline,total,paid}` ajoutées 3 langues
- [x] **A.5.5** Carte historique paiements supprimée de `[id].tsx`, accessible via Menu kebab
- [x] **A.5.6** Route `app/companies/[id]/payments.tsx` créée avec `useBundleMyCompanyPayments`
- [x] **A.5.7** `<Card>` historique inline supprimée (commit `e86461df`)

### A.6 Validation Phase A (~10min) ✅

- [x] **A.6.1** `tsc --noEmit` EXIT=0
- [x] **A.6.2** ESLint 6 warnings préexistants (sous seuil 100)
- [x] **A.6.3** i18n drift = 0 sur 3 langues (Phase A scope)
- [x] **A.6.4** Auto-critique `MOBILE_BUGFIX_PHASE_A_CRITIQUE.md` (104 lignes)
- [x] **A.6.5** Commits sémantiques 4× (B1, B3, B4, B5b) — `adc92e4f`, `309cc848`, `748cb252`, `e86461df`
- [ ] **A.6.6** Push **en attente** confirmation utilisateur (mémoire #13)

---

## 4. CRITÈRES DE VALIDATION (DoD Phase A)

| # | Critère | Méthode |
|---|---------|---------|
| V1 | B1 — gap visible entre desc et CTA "Explorer sans compte" sur device | smoke device |
| V2 | B3 — FAB "Nouveau ticket" entièrement visible, pas sous nav bar | smoke device m12 |
| V3 | B3 — Reply bar input visible avec clavier ouvert ET fermé | smoke device m11 |
| V4 | B4 — Filter chips séparés du premier item de liste (≥8dp) | smoke device m3 |
| V5 | B4 — Document unique apparaît en haut (pas centré vertical) | smoke device m4 |
| V6 | B4 — Empty state aligné en haut, pas vertical-center | smoke device m6 |
| V7 | B5b — License card affiche échéance/total/payé en chips colorés | smoke device m14 |
| V8 | B5b — Bouton télécharger licence centré horizontalement | smoke device m14 |
| V9 | B5b — Carte historique paiements absente de la vue détail (dans kebab) | smoke device |
| V10 | tsc 0 erreur | CI |
| V11 | ESLint ≤ 91 | CI |
| V12 | i18n drift exit 0 | script |

---

## 5. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Suppression de `styles.emptyContent` casse les listes vides | FAIBLE | FAIBLE | Test smoke avec filtre vide (ex. "medical" sur uploads) |
| `style={{flex:1}}` sur FlatList casse le scroll horizontal | NULL | NULL | Tous les FlatList docs sont verticaux |
| `useSafeAreaInsets` retourne 0 sur certains émulateurs | FAIBLE | FAIBLE | Le `+ 16` minimum garantit la sécurité même si `insets.bottom = 0` |
| `t('companies.detail.total')` clé absente fait fallback sur la clé en clair | MOYENNE | FAIBLE | i18n drift script catch les clés manquantes ; on les ajoute |
| Refonte License Card casse les utilisateurs sans licence (`license === null`) | FAIBLE | MOYEN | Branche `license ? ... : <Text>noLicense</Text>` préservée |
| Route `/companies/[id]/payments` non créée → kebab cassé | MOYENNE | FAIBLE | Créer la route avant de toucher le kebab |

---

## 6. ORDRE D'EXÉCUTION

1. **A.2** B1 onboarding (1 fichier, ~5 min)
2. **A.3** B3 support (2 fichiers, ~10 min)
3. **A.4** B4 documents (2 fichiers, ~15 min)
4. **A.5** B5b license UX (le plus gros — ~30 min)
5. **A.6** Validation + commits + critique

---

## 7. CHANGELOG

- **2026-04-29 v1.0** : créé en parallèle de Phase A implementation start.
