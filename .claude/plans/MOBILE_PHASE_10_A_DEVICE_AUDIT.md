# PHASE A — Audit static FlatList + safe-area + observations device

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_A_VISUAL_FINISH_DETAILED.md`
**Source de vérité** : code HEAD `develop` + captures device user `Documentations/workflow/debug/tesoro/post-fix/{m1,m2,m3,m5,1,2,3,4,5}.jpg` + retour user 2026-05-02 ("payments et requests sont corrects").

---

## 1. Inventaire FlatList — état HEAD

| Fichier | windowSize | removeClippedSubviews | flexGrow:1 contentContainer | Header complexe au-dessus | Bug device confirmé ? |
|---------|-----------|------------------------|------------------------------|----------------------------|------------------------|
| `app/documents/index.tsx` | 21 | ❌ omis | ✅ oui | ✅ OUI (Quota + Tabs + Search + Chips) | 🔴 OUI (m1, m2, 4, 5) |
| `app/(tabs)/payments/index.tsx` | 10 | ✅ activé | ✅ oui | ❌ non | ✅ NON — confirmé user 2026-05-02 |
| `app/(tabs)/requests/index.tsx` | 10 | ✅ activé | ✅ oui | ❌ non | ✅ NON — confirmé user 2026-05-02 |
| `app/(tabs)/services/index.tsx` | 10 | ✅ activé | ❌ paddingBottom seul | ✅ partial (search + filters) | ❓ à vérifier |
| `app/notifications.tsx` | 10 | ✅ activé | (conditionnel) | ❌ non | ❓ à vérifier |
| `app/support/index.tsx` | 10 | ✅ activé | ✅ oui | ❌ non | ❓ à vérifier |
| `app/companies/index.tsx` | 10 | ✅ activé | (conditionnel) | ❌ non | ❓ à vérifier |
| `app/(tabs)/services/[id].tsx` | n/a | n/a | n/a | n/a | n/a |
| `app/companies/[id]/payments.tsx` | n/a | n/a | n/a | n/a | n/a |
| `app/licencias/index.tsx` | n/a | n/a | n/a | n/a | n/a |

**Pattern qui FONCTIONNE** (payments / requests confirmés OK device) :
```ts
<FlatList
  contentContainerStyle={[
    styles.listContent,                    // { flexGrow: 1 }
    data.length === 0 && styles.listEmpty, // { flex: 1 }
    { paddingTop, paddingBottom },
  ]}
  windowSize={10}
  removeClippedSubviews
  // Pas de header complexe au-dessus (juste search bar + chip row)
/>
```

**Pattern qui NE FONCTIONNE PAS** (documents confirmé bug device) :
```ts
// Stack au-dessus de FlatList :
<DocumentQuotaBar />              // ~50dp
<View tabsRow><SegmentedButtons /></View>  // ~56dp
<Searchbar />                      // ~52dp (uploads tab seulement)
<DocumentFilterChips />            // ~56dp
// Total ~160-220dp empilé verticalement
<FlatList
  style={{ flex: 1 }}
  contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingBottom: ... }}
  windowSize={21}
  // pas removeClippedSubviews
/>
```

→ Avec ce stack important au-dessus, Android RN calcule mal la hauteur disponible pour la FlatList. `flex:1 + flexGrow:1` étire le contentContainer bien au-delà de la hauteur réelle, et les items s'affichent en bas du conteneur étiré.

---

## 2. Hypothèse révisée

Le bug N'EST PAS dû à `windowSize` ni à `removeClippedSubviews` (sinon payments/requests bug aussi).

Le bug EST dû à :
- **Beaucoup de composants empilés verticalement au-dessus** (Quota + Tabs + Search + Chips ≈ 220dp)
- **`flex:1` sur la FlatList ET `flexGrow:1` sur contentContainer** crée un double-stretch que Android RN gère mal quand le parent a déjà absorbé beaucoup d'espace
- Quand la liste a peu d'items (3-5), le contentContainer s'étire bien au-delà de la hauteur réelle disponible, les items appearent en bas

---

## 3. Solution proposée (Phase A.6)

### Option 1 — Conservative (touche que documents)
Retirer `flex:1` du style FlatList ET `flexGrow:1` du contentContainer. La FlatList prend sa hauteur naturelle.

```tsx
// AVANT (HEAD 8138db79 — buggy)
<FlatList
  style={styles.flex1}                      // flex:1
  contentContainerStyle={listContentStyle}  // flexGrow:1, paddingTop, paddingBottom
  windowSize={21}
  // Pas de removeClippedSubviews
/>

// APRÈS (proposed)
<FlatList
  // Pas de style flex:1 — la FlatList prend l'espace résiduel naturellement
  contentContainerStyle={{ paddingTop: 8, paddingBottom: 96 + insets.bottom }}
  windowSize={21}
  // Pas de removeClippedSubviews
/>
```

**Effet** : sur Android, la FlatList rend les items à partir du haut sans stretching. Sur empty state, le `DocumentEmptyState` a son propre `paddingTop:48` qui assure la séparation visuelle des chips.

**Risque** : sur empty state, le composant pourrait pas remplir l'écran et apparaître "haut isolé". Visuellement OK car `DocumentEmptyState` a son propre styling avec `paddingTop:48 + minHeight`.

### Option 2 — ScrollView + map() (référence dashboard)
Plus drastique : remplacer FlatList par ScrollView + map() pour < 100 items. C'est ce qui marche déjà sur le dashboard `m8.jpg`.

**Effet** : élimine totalement le risque virtualisation Android. Pattern simple et stable.

**Coût** : perte des optimisations FlatList (perf negligible <100 items, pull-to-refresh à reimplem).

→ **Recommandation : Option 1 d'abord**. Si ne suffit pas → Option 2.

---

## 4. Inventaire safe-area bottom

| Fichier | useSafeAreaInsets | bottom + insets.bottom appliqué ? | Pattern correct ? | Bug device confirmé ? |
|---------|--------------------|-----------------------------------|-------------------|------------------------|
| `app/companies/[id].tsx` | ✅ HEAD `f24ee282` | ✅ ScrollView paddingBottom: 32 + insets.bottom | ✅ | 🔴 PRÉ-FIX (1.jpg) — devrait être OK avec HEAD, à valider device |
| `app/companies/[id]/payments.tsx` | ✅ | ✅ | ✅ | ✅ NON |
| `app/(tabs)/requests/[id].tsx` | ✅ | ✅ | ✅ | ✅ NON |
| `app/(tabs)/payments/[id].tsx` | ✅ | ✅ | ✅ | ✅ NON |
| `app/support/[id].tsx` | ✅ HEAD `309cc848` | ✅ FAB + reply bar | ✅ | ✅ NON |
| `app/documents/[id].tsx` | ✅ | ✅ | ✅ | ✅ NON |
| `app/wizard/**` | ✅ | ✅ | ✅ | ✅ NON |
| `app/calculator/index.tsx` | ✅ | ✅ | ✅ | ✅ NON |
| `app/onboarding.tsx` | (SafeAreaView edges full) | ✅ | ✅ | ✅ NON HEAD `adc92e4f` |

→ **Aucun bug safe-area connu sur HEAD develop**. Capture 1.jpg = pré-fix `f24ee282`. À re-valider sur APK preview.

---

## 5. Captures device — analyse

| Capture | Date approximative | État code Phase A | Verdict |
|---------|--------------------|---------------------|---------|
| `m8.jpg` | 12:13, batterie 97% | RÉFÉRENCE OK dashboard m8 | ✅ OK |
| `m1.jpg` | 13:39, batterie 75% | documents tab Mes fichiers, chip Identité | 🔴 BUG gap énorme |
| `m2.jpg` | 13:40, batterie 75% | documents tab Mes fichiers, chip Tous | 🔴 BUG gap énorme |
| `4.jpg` | landscape rotated | documents tab Mes fichiers, chip Identité | 🔴 BUG gap (même bug en landscape) |
| `5.jpg` | landscape rotated | documents tab Générés, chip Tous | 🔴 BUG gap (même bug en landscape) |
| `2.jpg` | 09:46/09:47 | documents tab Générés, chip Tous | 🔴 BUG gap énorme |
| `3.jpg` | 09:44, batterie 84% | documents tab Mes fichiers, chip Tous | 🔴 BUG gap énorme |
| `m3.jpg` | (à inspecter) | (à inspecter) | (à inspecter) |
| `m5.jpg` | (à inspecter) | (à inspecter) | (à inspecter) |
| `1.jpg` | 09:46, batterie 84% | companies/[id] dernier item coupé | 🔴 BUG safe-area pré-fix |

**Toutes les captures buggées concernent `app/documents/index.tsx`**. Aucune capture confirmée sur les 6 autres écrans avec FlatList.

---

## 6. Plan d'action Phase A.6 (post test device)

### Si APK preview montre que documents bug persiste sur device
1. Appliquer **Option 1** (retirer flex:1 + flexGrow:1) sur les 3 FlatList de `documents/index.tsx`
2. Tester sur device → si OK commit. Si pas OK → Option 2 (ScrollView + map)
3. Re-build EAS preview pour final validation

### Si APK preview montre que documents est déjà fixé sur HEAD `8138db79`
1. Captures user étaient antérieures au fix
2. Pas de fix nécessaire sur documents
3. Vérifier les autres écrans avec FlatList complexe :
   - `(tabs)/services/index.tsx` — a aussi un header avec search + filters → potentiel risque
4. Phase A close, on passe à Phase B

### Dans tous les cas
- Vérifier safe-area `companies/[id]` dernier item visible sur device
- Vérifier 5-6 écrans clés × light + dark theme

---

## 7. État build EAS preview

- Build ID : `e1efa264-ffa8-414d-8bfc-90ea5d539f1d`
- Plateforme : Android
- Profile : preview
- Status : IN_PROGRESS au 2026-05-02 22:44 UTC
- Suivre : https://expo.dev/accounts/emacsah/projects/facil/builds/e1efa264-ffa8-414d-8bfc-90ea5d539f1d
- ETA : ~15-25 min total

---

## 8. SUIVI

- **2026-05-02 v1.0** : Audit static initial. 6 écrans avec pattern à risque identifié — théorie invalidée par retour user (payments + requests OK). Hypothèse révisée : bug spécifique aux écrans à header complexe + double-stretch flex/flexGrow. Build EAS preview lancé pour validation device.
