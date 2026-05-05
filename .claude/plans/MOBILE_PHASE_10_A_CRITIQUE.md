# PHASE A — Critique honnête

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Statut** : Code livré (1 fichier modifié), tsc 0, ESLint 0. Validation device en attente du build EAS final groupé.

---

## 1. Bug initial reporté par user

> "les images montrent un problème de safe-area et de positionnement des éléments qui dégrade le design de l'application. prendre l'exemple sur l'image m8.jpg où il n'y a pas d'espace existant entre le bloc et les éléments comme le cas des onglets du menu documents où entre les tags et les éléments il existe un écart"

**Confirmation user 2026-05-02** :
- ✅ Bug isolé aux 3 onglets de `Mes documents` (uploads / generated / alerts)
- ✅ payments + requests confirmés OK (pattern différent)
- ✅ companies/[id] safe-area bottom — séparément à valider sur HEAD

---

## 2. Diagnostic révisé (vs le commentaire HEAD `8138db79`)

L'ancien commentaire `8138db79` attribuait le bug à "removeClippedSubviews + small windowSize". Cette théorie est **invalidée** par le fait que :
- payments + requests ont `removeClippedSubviews + windowSize=10` et NE bug PAS
- documents a `windowSize=21 + sans removeClippedSubviews` et bug ENCORE (m1/m2/2/3/4/5)

**Cause racine réelle** : le **stack vertical fixe au-dessus de la FlatList** (~270dp : Appbar + DocumentQuotaBar + tabsRow + Searchbar + DocumentFilterChips) combiné au **double-stretch `flex:1` (FlatList) + `flexGrow:1` (contentContainer)** trompe le calculateur de layout Android. Le contentContainer s'étire au-delà de l'espace réellement disponible, et les items s'affichent en bas du conteneur étiré.

Pour les écrans avec stack pre-FlatList plus court (~120dp pour payments/requests), l'over-stretch est masqué par la marge disponible.

---

## 3. Fix appliqué

**Option 1A** : retirer `flexGrow:1` de `listContentStyle`, garder `flex:1` sur la FlatList.

```ts
// AVANT (HEAD 8138db79)
const listContentStyle = useMemo(
  () => ({
    flexGrow: 1,                       // ← retiré
    paddingTop: 8,
    paddingBottom: 96 + insets.bottom,
  }),
  [insets.bottom],
);

// APRÈS
const listContentStyle = useMemo(
  () => ({
    paddingTop: 8,
    paddingBottom: 96 + insets.bottom,
  }),
  [insets.bottom],
);
```

`style={styles.flex1}` reste sur la FlatList (la FlatList prend toute la hauteur disponible). On retire seulement le double-stretch interne. Le commentaire pédagogique dans le code a été entièrement réécrit pour refléter le nouveau diagnostic + expliquer pourquoi payments/requests/dashboard ne bug pas.

---

## 4. Fichiers modifiés

| Fichier | Type | Lignes diff |
|---------|------|-------------|
| `packages/mobile/src/app/documents/index.tsx` | Edit | -19 +33 (commentaire pédagogique étendu, 1 ligne de code retirée) |

**Stats** : 1 fichier, 1 ligne de code retirée (`flexGrow: 1`), +14 lignes net (commentaire détaillé sur le diagnostic).

---

## 5. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | documents — items immédiatement sous chips, plus de gap | smoke device | ⏳ pending build EAS final groupé |
| V2 | documents — empty state aligné en haut sous chips | smoke device | ⏳ pending |
| V3 | companies/[id] — dernier item visible (1.jpg fix) | smoke device | ⏳ pending (HEAD `f24ee282` devrait fix, à valider) |
| V4 | tsc 0 erreur | `npx tsc --noEmit` | ✅ EXIT 0 |
| V5 | ESLint sur fichier modifié | `npx eslint` | ✅ EXIT 0 |
| V6 | Pas de régression dashboard m8.jpg / payments / requests | smoke device | ⏳ pending (ces fichiers non touchés, risque nul) |

---

## 6. Risques & honnêteté

### 6.1 Le fix peut ne pas marcher sur device

**Probabilité** : MOYENNE (~30%)
**Pourquoi** : le commentaire du code `8138db79` disait que retirer `flexGrow:1` causait des items "bottom-aligned with empty block above" (commit `c661ea50` revert). Si ce diagnostic est correct, mon Option 1A pourrait reproduire ce même bug.

**Mitigations préparées** :
- **Option 1B** (fallback léger) : retirer aussi `flex:1` du style FlatList. La FlatList prend juste sa hauteur naturelle dans le layout column par défaut.
- **Option 2** (fallback robuste) : remplacer FlatList par `ScrollView + items.map()`. C'est ce qui marche sur le dashboard `m8.jpg`. Coût : perte virtualisation FlatList (perf négligeable < 100 items).

Je documente ces 2 fallbacks pour activation directe si le build EAS final montre persistance du bug.

### 6.2 Pas de validation device avant la fin de Phase D

**Décision user 2026-05-02** : ne pas builder à chaque fix pour économiser les 30 builds/mois EAS.
**Conséquence** : on accumule les fixes Phase A + B + C + D sans validation device intermédiaire. **Si le fix documents ne marche pas, on découvrira lors du build final** (potentiellement un retour 2-3 jours après).

**Mitigation** : commits sémantiques isolés par fichier → revert facile en `git revert <sha>` si un fix s'avère cassé.

### 6.3 Pas de smoke test des autres écrans

User a confirmé payments + requests OK, mais 4 autres écrans à FlatList (`services`, `notifications`, `support`, `companies`) n'ont pas de capture device. Les patterns sont différents donc bug peu probable, mais non testé.

**Mitigation** : audit static documenté dans `MOBILE_PHASE_10_A_DEVICE_AUDIT.md` montre que ces 4 écrans ont des patterns différents de documents (pas de stack pre-FlatList lourd, ou pas de double-stretch flex/flexGrow). **Risque résiduel = faible**.

### 6.4 Captures m1/m2/4/5 — toujours pas datées précisément

Dates approximatives 13:39 du 2026-04-30. Commit `8138db79` est du 2026-04-30 14:30. Si le APK installé sur device venait d'un build pré-`8138db79`, le bug observé est déjà fix-attempté par `8138db79`, et mon Option 1A est juste un sur-fix éventuel.

**Conséquence** : on ne saura qu'après le build EAS final si :
- (A) Le bug existait avant ET après `8138db79` → mon fix Option 1A aide
- (B) Le bug existait avant `8138db79` mais déjà fix par `8138db79` → mon fix retire `flexGrow:1` qui n'avait plus d'utilité, neutre
- (C) Le bug existait avant `8138db79` et `8138db79` réintroduisait le bug en réintroduisant `flexGrow:1` → mon fix résout

Dans les 3 cas, mon fix ne dégrade pas. Au pire, neutre.

---

## 7. Gap honnête

1. **Validation device manquante** : raisonnement flexbox + inférence sur les patterns OK (payments/requests). Pas de preuve empirique tant que l'APK final n'est pas testé.
2. **`/companies/[id]` safe-area** : capture 1.jpg date 09:46 vs commit fix `f24ee282` à confirmer. Probablement pré-fix mais à valider sur APK final.
3. **Pas testé en landscape** : captures 4.jpg/5.jpg montrent le bug en landscape. Mon fix devrait s'appliquer pareil mais non spécifiquement validé pour rotation.
4. **Pas testé dark mode** : à valider device aussi.
5. **`m3.jpg` et `m5.jpg`** : pas encore inspectées dans cette session — à inclure dans le smoke test final.

---

## 8. Recommandation

### 8.1 Maintenant
- **Commit local sémantique** :
  ```
  fix(mobile/vault): documents — drop flexGrow:1 to fix gap on Android with heavy header stack
  ```
- **PAS DE PUSH** tant que toutes les phases A-D ne sont pas livrées (décision user 2026-05-02 — économie quota EAS).
- **Continuer Phase B** (Privacy Policy + ToS mobile + acceptation signup).

### 8.2 Lors du build EAS final groupé (fin Phase D)
- User installe APK preview sur device
- Smoke 5 écrans × 2 thèmes
- Si bug documents persiste → activer Option 1B ou Option 2 (commit séparé)
- Si autres bugs trouvés → fix + nouveau build (compté dans budget)

---

## 9. Changelog

- **2026-05-02 v1.0** : Critique initiale Phase A. Fix Option 1A appliqué sur documents/index.tsx. tsc + ESLint passent. Validation device repoussée à la fin de Phase D pour économiser les builds EAS (décision user).
