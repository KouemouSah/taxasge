# Mobile bugfix — post-fix layout (gap entre filter chips et liste)

**Date** : 2026-04-30
**Phase parent** : `MOBILE_BUGFIX_PHASE_A_LAYOUT_DETAILED.md` (correctif suite)
**Source de vérité** : `Documentations/workflow/debug/tesoro/post-fix/{1..5}.jpg` + `m8.jpg` (référence OK)
**Statut** : Code livré, tsc 0 erreur, ESLint 0 erreur (1 warning préexistant). Validation device en attente.

---

## 1. Bug décrit par l'utilisateur

> "les images montrent un problème de safe-area et de positionnement des éléments qui dégrade le design de l'application. prendre l'exemple sur l'image m8.jpg où il n'y a pas d'espace existant entre le bloc et les élements comme le cas des onglets du menu documents où entre les tags et les élements il existe un écart"

Résumé :
- **m8.jpg = référence OK** : dashboard avec tabs (Demandes/Paiements/Alertes), liste collée juste sous les onglets, aucun gap.
- **2-5.jpg = bug** : page documents montre un GROS gap vertical entre les filter chips (Tous/Reçus/Certificats/...) et la liste de documents — les documents sont poussés tout en bas de l'écran.

---

## 2. Cause racine

Commit `748cb252` (Phase A, 2026-04-29) a ajouté `flexGrow: 1` au `contentContainerStyle` des 3 FlatList vault sous l'idée que cela top-alignerait le contenu. Sur les devices Android testés (captures du 2026-04-30), cela produit l'effet INVERSE :

```ts
// AVANT (buggy)
const listContentStyle = {
  flexGrow: 1,                       // ← le coupable
  paddingTop: 8,
  paddingBottom: 96 + insets.bottom,
};
```

Avec `style={{flex:1}}` sur la FlatList **ET** `flexGrow:1` sur `contentContainerStyle` **ET** `RefreshControl` actif, le contentContainer est étiré bien au-delà de la hauteur naturelle des items. Sur Android, cette combinaison fait apparaître les rows au **fond** du conteneur étiré au lieu du haut.

Pourquoi le pattern dashboard `m8.jpg` ne souffre PAS du bug : il utilise un simple `<View>` + `.map()` (composant `RecentPaymentsList`), donc pas de FlatList, pas de flexbox étirée. Items rendus naturellement inline.

---

## 3. Fix appliqué

```ts
// APRÈS (fix)
const listContentStyle = {
  paddingTop: 8,                    // breathing room sous les chips (8dp)
  paddingBottom: 96 + insets.bottom, // FAB clearance + safe area
};
```

`flex:1` reste sur la FlatList (la FlatList remplit l'espace vertical disponible). On retire seulement `flexGrow:1` du `contentContainerStyle` :
- Avec items : items s'empilent en haut, espace vide naturel en dessous (comportement attendu).
- Liste vide : `DocumentEmptyState` rend avec son `paddingTop:48` propre — visible juste sous les chips.
- 1 item : item en haut, espace vide en dessous.

---

## 4. Fichiers modifiés

| Fichier | Type | Justification |
|---------|------|---------------|
| `packages/mobile/src/app/documents/index.tsx` | Edit | Fix racine — retire `flexGrow:1` des 3 FlatList (uploads/generated/alerts) via `listContentStyle` mémoizé. Commentaire pédagogique mis à jour. |
| `packages/mobile/src/app/companies/[id].tsx` | Edit | Safe-area bottom — image 1.jpg montre dernier item "Certificado de Comercio" partiellement coupé par la nav bar Android. Import `useSafeAreaInsets`, ScrollView `paddingBottom: 32 + insets.bottom`. |
| `packages/mobile/src/app/companies/[id]/payments.tsx` | Edit | Préventif — même pattern `flexGrow:1` que documents. Retiré pour cohérence avant que le bug n'apparaisse côté kebab. |

**Stats** : 3 fichiers, 12 insertions, 12 suppressions (équilibre net car nouveau commentaire vs ancien).

---

## 5. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | documents — items immédiatement sous chips, plus de gap | smoke device | ⏳ pending push EAS |
| V2 | documents — empty state aligné en haut sous chips | smoke device | ⏳ pending push EAS |
| V3 | companies/[id] — dernier item visible au-dessus de la nav bar Android | smoke device 1.jpg | ⏳ pending push EAS |
| V4 | companies/[id]/payments — items en haut, pas de gap | smoke device | ⏳ pending push EAS |
| V5 | tsc 0 erreur | CI | ✅ EXIT_CODE=0 |
| V6 | ESLint sur fichiers modifiés | CI | ✅ 0 erreur, 1 warning préexistant (`obligations` useMemo deps L74 — hors scope) |
| V7 | Pas de régression dashboard m8.jpg | smoke device | ⏳ (dashboard non touché, risque nul) |

---

## 6. Risques de régression — analyse honnête

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Empty state visuellement disconnecté des chips sans `flexGrow:1` | NULL | NULL | `DocumentEmptyState` a son propre `paddingTop:48` qui assure la séparation. Vérifié dans `document-empty-state.tsx:55-58`. |
| 1-item liste paraît "vide" en bas | FAIBLE | FAIBLE | C'est le comportement attendu et celui du dashboard m8.jpg : 1 item en haut, espace en dessous. La FAB est positionnée absolument donc reste visible. |
| FlatList `style:{flex:1}` casse la FAB sur des Android exotiques | NULL | NULL | Le FAB est `position:'absolute'` avec `bottom: 16 + insets.bottom`. Indépendant du flex de la FlatList. |
| Pull-to-refresh casse | NULL | NULL | RefreshControl reste attaché ; on retire seulement le stretching qui faisait le bug. |
| Régression sur écrans non touchés (support, requests, payments, calculator) | NULL | NULL | Aucun de ces fichiers n'est modifié. Leur pattern (`flexGrow:1` conditionnel avec `flex:1` quand vide) **pourrait** souffrir du même bug, mais : (a) aucune capture user ne le confirme, (b) volontairement laissé en place pour ne pas sur-corriger sans preuve. À fixer sur ticket séparé si user signale. |

**Mémoire #16** (zéro régression non-bundle) appliquée : on touche uniquement les 3 fichiers où le bug est démontré ou structurellement identique au cas démontré (documents, companies kebab payments, et safe-area companies).

---

## 7. Gap honnête

1. **Pattern `flexGrow:1` hérité dans support/index, (tabs)/payments, (tabs)/requests** : non corrigé. Risque que le même bug apparaisse là-bas si l'user les teste sur le même device. Décision conservatrice = attendre signal user. Documenter dans cette note pour ticket de suivi.
2. **Validation device pas faite** : tsc + ESLint passent, mais l'effet visuel n'est confirmé que par raisonnement flexbox + analogie m8.jpg. Le smoke device est nécessaire après le push EAS preview (token `facil/GpS6tyEUc-g8b3IOXDfnAoK5Hq9jvzq71-23pr7A` disponible dans `Documentations/workflow/debug/.env`).
3. **Pas de tests unitaires ajoutés** : cohérent avec la règle utilisateur "tests E2E phase 10".
4. **i18n drift script** : non lancé (rien touché côté traductions).
5. **Critique de propagation** : si le device confirme le fix, il faudra une PR de suivi pour appliquer le même pattern à support / requests / payments / calculator.

---

## 8. Recommandation push

Push **isolé** maintenant ou groupé avec d'autres fixes Phase 10 selon décision utilisateur. Mémoire #13 = demander confirmation avant push.

Commits sémantiques recommandés (1 commit total, scope cohérent) :

```
fix(mobile): documents — items top-aligned without flexGrow stretch (post-fix bug)

The Phase A fix (748cb252) added flexGrow:1 on contentContainerStyle to
top-align FlatList rows, but on Android with RefreshControl active, the
combination of flex:1 on the FlatList and flexGrow:1 on the inner content
container actually pushed rows to the BOTTOM of the stretched container —
visible as a large empty gap between the filter chips and the document
list (post-fix captures 2-5.jpg from 2026-04-30).

Removing flexGrow:1 lets items stack naturally from the top under the
chips. The empty state still sits at the top thanks to its own
paddingTop:48. The FlatList itself keeps `flex:1` so it always fills the
available vertical space.

Same pattern preventively removed from companies/[id]/payments.tsx (new
in Phase A, same potential bug, low traffic, no captures yet).

Bonus safe-area fix on companies/[id]: ScrollView paddingBottom now
respects insets.bottom (image 1.jpg showed last obligation row partially
clipped by the Android gesture nav bar).

Refs: Documentations/workflow/debug/tesoro/post-fix/{1..5}.jpg
```

---

## 9. Next

- Push EAS preview avec le token `facil` pour validation device.
- Si validation OK → propager le pattern à support / requests / payments / calculator (PR séparée).
- Reprise Phase 10 (mobile bugfix master plan) après validation.

---

## 10. Changelog

- **2026-04-30 v1.0** : créé après implémentation post-fix layout. Pattern `flexGrow:1` retiré sur 2 écrans, safe-area bottom ajouté sur 1 écran. tsc 0, ESLint 0 nouveau warning.
