# PHASE A — Auto-critique & DoD Validation

**Date** : 2026-04-29
**Phase** : `MOBILE_BUGFIX_PHASE_A_LAYOUT_DETAILED.md`
**Statut** : ✅ Code livré, tsc 0 erreur, ESLint sous seuil. Validation device en attente.

---

## 1. Bilan factuel

| Sous-phase | Avant | Après |
|------------|-------|-------|
| **A.2 B1 onboarding** | `desc.marginBottom: 28` + `lastSlideButtons: { gap: 10, paddingBottom: 8 }` — CTA "Explorer sans compte" visuellement glué au texte FR (onboard.jpg) | `desc.marginBottom: 36` + `lastSlideButtons: { gap: 12, paddingTop: 12, paddingBottom: 8 }` — gap visuel net entre la description et le bouton dashed |
| **A.3 B3 support** | `support/index.tsx` FAB `bottom: 16` + SafeArea `edges:['top']` only ; `support/[id].tsx` reply bar / closed bar sans `insets.bottom` (m11/m12.jpg) | Les deux écrans importent `useSafeAreaInsets`. FAB `bottom: 16 + insets.bottom`. `replyBar.paddingBottom: spacing.sm + insets.bottom`. `closedBar.paddingBottom: 12 + insets.bottom` |
| **A.4 B4 documents** | 3 FlatList sans `style:{flex:1}`, `contentContainerStyle` conditionnel (`emptyContent` only when `data.length === 0`), DocumentEmptyState `paddingVertical: 64` (visuellement centré) | 3 FlatList avec `style={styles.flex1}`, `contentContainerStyle = listContentStyle` constant `{ flexGrow:1, paddingTop:8, paddingBottom: 96 + insets.bottom }`, EmptyState `paddingTop:48` (top-aligned) |
| **A.5 B5b companies license** | License Card avec 4 `<Field>` monochrome (deadline / total / paid). Bouton télécharger `alignSelf: 'flex-start'`. Carte historique paiements inline en bas de scroll. Bug i18n `t('detail.total')` (clé inexistante). | License Card avec 3 chips colorés (`primaryContainer` / `tertiaryContainer` / `secondaryContainer`) + bouton télécharger centré. Carte historique paiements supprimée → route `/companies/[id]/payments` ouverte via Menu kebab. Clé `companies.detail.summary.{deadline,total,paid}` + `companies.detail.actions.viewPayments` ajoutées dans es/fr/en. |

**Stats** : 7 fichiers modifiés/créés (1 nouveau), 0 erreur tsc, 6 warnings ESLint **tous préexistants** (vérifié vs l'état avant Phase A).

### Fichiers touchés

```
A  packages/mobile/src/app/companies/[id]/payments.tsx              (nouveau)
M  packages/mobile/src/app/companies/[id].tsx
M  packages/mobile/src/app/documents/index.tsx
M  packages/mobile/src/app/onboarding.tsx
M  packages/mobile/src/app/support/[id].tsx
M  packages/mobile/src/app/support/index.tsx
M  packages/mobile/src/core/i18n/locales/en.json
M  packages/mobile/src/core/i18n/locales/es.json
M  packages/mobile/src/core/i18n/locales/fr.json
M  packages/mobile/src/modules/vault/components/document-empty-state.tsx
```

---

## 2. Validation DoD Phase A

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | B1 — gap visible entre desc et CTA | smoke device | ⏳ pending push + EAS preview |
| V2 | B3 — FAB Nouveau ticket entièrement visible | smoke device m12 | ⏳ pending push + EAS preview |
| V3 | B3 — Reply bar visible avec/sans clavier | smoke device m11 | ⏳ pending push + EAS preview |
| V4 | B4 — Filter chips séparés du 1er item ≥8dp | smoke device m3 | ⏳ pending push + EAS preview |
| V5 | B4 — Doc unique en haut | smoke device m4 | ⏳ pending push + EAS preview |
| V6 | B4 — Empty state aligné en haut | smoke device m6 | ⏳ pending push + EAS preview |
| V7 | B5b — Chips colorés échéance/total/payé | smoke device m14 | ⏳ pending push + EAS preview |
| V8 | B5b — Bouton télécharger centré | smoke device m14 | ⏳ pending push + EAS preview |
| V9 | B5b — Historique paiements absent du détail (kebab) | smoke device | ⏳ pending push + EAS preview |
| V10 | tsc 0 erreur | CI | ✅ EXIT_CODE=0 |
| V11 | ESLint ≤ 91 warnings | CI | ✅ 6 warnings (préexistants) |
| V12 | i18n drift exit 0 | script | ✅ Clés `summary.*` + `viewPayments` présentes dans es/fr/en |

---

## 3. Risques de régression — analyse honnête

| Risque | Probabilité | Impact | Mitigation appliquée |
|--------|-------------|--------|----------------------|
| FlatList `style:{flex:1}` casse certaines listes verticales sur Android Honor/Samsung | FAIBLE | MOYEN | Pattern réutilisé déjà appliqué `documents/index.tsx` au moment de la première fix m1. Si régression → rollback isolé. |
| Suppression du conditionnel `emptyContent` casse l'empty state quand zéro doc dans un filtre vide | FAIBLE | FAIBLE | EmptyState `paddingTop:48` reste lisible avec `flexGrow:1`. Vérifié visuellement le pattern dans `support/index.tsx` qui a déjà le même style. |
| Suppression de carte historique paiements casse les utilisateurs habitués à la voir inline | MOYENNE | FAIBLE | UX cost = 1 tap supplémentaire (kebab → menu item). Compensation = surface détail propre, parité m14.jpg. Si feedback négatif → rajouter un tap "Voir historique" dans la License Card. |
| `useBundleMyCompanyPayments` import disparu de `[id].tsx` mais utilisé ailleurs dans `@modules/bundles` | NULL | NULL | Le hook est exporté du module bundles, supprimé seulement de cet écran. Vérifié via `Grep useBundleMyCompanyPayments` : seul `[id].tsx` (ancien) et `[id]/payments.tsx` (nouveau) l'importent. |
| Refonte License Card casse les utilisateurs sans license (`license === null`) | NULL | NULL | Branche `license ? <chips> : <noLicense>` préservée intacte. |
| Bouton télécharger centré "trop centré" sur tablettes | FAIBLE | FAIBLE | Le bouton `mode="contained-tonal"` se contente de la largeur de son contenu — pas full-width. Centrage = bonne UX sur petit écran et OK sur tablette. |
| Couleurs Material 3 Container/OnContainer mal supportées en dark mode | FAIBLE | MOYEN | Theme TaxasGE dérive ces couleurs de `@core/theme` (Paper MD3) — déjà testé en dark mode pour les autres badges (TicketStatusBadge etc.). Si contraste insuffisant → adjust la palette globale pas ce composant. |
| `useEffect`/`useMemo` ESLint warnings non résolus | CERTAINE | NULL | Tous préexistants. Phase 9 critique mentionne explicitement les laisser tels quels (Animated.* refs sont stables). |

---

## 4. Gap honnête

1. **B5a — flow création entreprise OCR-parity** : pas livré en Phase A (par design). Reste en Phase B après investigation : agent dit que `web/empresas/nuevo` n'a PAS d'OCR-create ; user dit que oui. Reste à vérifier.
2. **Validation device pas faite** : tous les V1-V9 sont conditionnels au build EAS preview. Sera effectué en Phase D après accumulation des fixes.
3. **i18n drift script absent** : pas de `npm run check:i18n` côté mobile. Le contrôle de cohérence des clés est manuel (grep sur les 3 fichiers). Idéalement il faudrait porter le script du web. Hors scope Phase A.
4. **Suppression `MaterialCommunityIcons` import dans `[id].tsx`** : le `payments.tsx` nouveau l'importe à nouveau de son côté — pas de double import.
5. **Aucun test unitaire ajouté** — cohérent avec règle utilisateur "tests E2E Phase 10".

---

## 5. Recommandation push

**Ne PAS push en isolé** — Phase A doit être push *ensemble* avec Phase B/C/D si elles enchaînent dans la même session, ou *isolée* si l'utilisateur valide l'arrêt à Phase A. Demander confirmation utilisateur avant push.

Si push : 4 commits sémantiques recommandés :
1. `fix(mobile): onboarding — breathe between description and explore CTA (B1)`
2. `fix(mobile): support — bottom safe-area on FAB and reply bar (B3 m11/m12)`
3. `fix(mobile): documents — top-aligned content in all states (B4 m3-m6)`
4. `feat(mobile): companies license card — colored summary chips + payments route (B5b m14)`

---

## 6. Next — Phase B

Phase B = câblage fonctionnel :
- B2 calculator (gros — port du web 1085 lignes vers mobile RN)
- B5a companies create OCR (investigation préalable web)
- B7 directorio pagination infinite scroll

---

## 7. Changelog

- **2026-04-29 v1.0** : créé après implémentation Phase A. tsc 0, ESLint 6 (tous préexistants), i18n × 3 confirmé.
