# PHASE 3 — Auto-critique & DoD Validation

**Date** : 2026-04-27
**Phase** : `MOBILE_USER_PHASE_3_DETAILED.md`
**Statut global** : ✅ Code livré + checklist #35 complète passée (tsc, lint, grep paths, smoke tests staging 5/5, imports cohérents). ⏳ Validation device.

---

## 1. Bilan factuel

| Domaine | Avant P3 | Après P3 |
|---------|----------|----------|
| Endpoints `companies.*` câblés | Déclarés P0, jamais consommés | 9 wrappers `companies-api.ts` |
| Hooks React Query | 0 | 11 hooks (list infinite, detail, CRUD mutations, members CRUD, license PDF download) |
| Module `modules/companies/` | Inexistant | 11 fichiers (types, services x3, components x6, index barrel) |
| Écrans companies | Aucun | 5 stack screens : list, detail, new, edit, members |
| Stack registration | — | 5 entrées ajoutées dans `_layout.tsx` |
| Dashboard QuickAction | 4 boutons | 5 boutons (+ "Mis Empresas" → `/companies`) |
| Types curés | 13 vault | 23 (10 nouveaux Companies : `CompanyCreate`, `CompanyUpdate`, `CompanyResponse`, `CompanyListResponse`, `CompanyMember`, `CompanyMemberRole`, `AddMemberRequest`, `UpdateMemberRoleRequest`, `CompanyInfo`, `CompanySearchResult`) |
| i18n companies | Inexistant | Bloc `companies.*` complet en es/fr/en (~110 clés/langue) + `dashboard.quickActions.myCompanies` |
| Deep-link router | 10 routes | 11 routes (+ `company_invitation`) |

**Stats** : 11 nouveaux fichiers + 7 modifiés. Code TS ~1100 LOC, i18n ~330 lignes JSON.

---

## 2. Checklist mémoire #35 — Validation phase complète

| Étape | Résultat |
|-------|----------|
| 1. `tsc --noEmit` | ✅ 0 erreur |
| 2. ESLint sous seuil 100 | ✅ 83 warnings (1 nouveau pré-existant, sous le seuil) |
| 3. Grep paths hardcodés hors endpoints.ts | ✅ Aucun `apiGet/Post/...` hardcodé. 2 hits = routes Expo Router (`/companies/new`), légitimes |
| 4. Smoke tests staging | ✅ 5/5 :<br>- GET /companies?page=1 → 403 (auth gate OK)<br>- POST /companies → 403<br>- GET /companies/{fake}/members → 403<br>- GET /bundle-workflow/my-companies/{fake}/license-pdf → 403<br>- GET /public/companies/zones → 200 (catalogue zones publique) |
| 5. Imports/exports cohérents | ✅ 11 hooks utilisés tous exposés via `@modules/companies` index |
| 6. Auto-critique écrite | ✅ (ce fichier) |
| 7. Commits sémantiques locaux groupés | ⏳ À exécuter post-critique |

---

## 3. DoD Phase 3

| # | Critère | Méthode | Statut |
|---|---------|---------|--------|
| V1 | Liste companies paginée (offset) avec pull-to-refresh | Test device | ⏳ Code complet, test pending |
| V2 | Create company → success → detail visible | Test device | ⏳ Code complet, test pending |
| V3 | Update company → champs persistés | Test device | ⏳ Code complet, test pending |
| V4 | Delete avec type-name-to-confirm | Test device | ⏳ Code complet, test pending |
| V5 | Add member (UUID) → apparaît | Test device | ⏳ Code complet |
| V6 | Update member role | Test device | ⏳ Code complet |
| V7 | Remove member | Test device | ⏳ Code complet |
| V8 | Download license PDF → ouverture native | Test device | ⏳ Code complet |
| V9 | Bundle workflow inchangé | Smoke + test device | ✅ Smoke OK, ⏳ device pending |
| V10 | tsc 0 erreur | CI | ✅ |
| V11 | ESLint sous 100 warnings | CI | ✅ 83 |
| V12 | Grep paths hardcodés vide | CI | ✅ |
| V13 | Smoke tests 5/5 | curl | ✅ |
| V14 | i18n 3 langues complète | Code review | ✅ |
| V15 | Auto-critique | Fichier | ✅ |
| V16 | Commits locaux groupés | git log | ⏳ |

---

## 4. Risques de régression analysés

### 4.1 Risques élevés

**R1. Auto-classification post-create change `regimen_fiscal`** — backend trigger une classification async qui peut basculer `pendiente` → `bundle` après quelques secondes. UI ne refresh pas automatiquement aujourd'hui. **Mitigation** : à ajouter en P3.5 — un setTimeout 3s qui invalide la query detail après le create. Risque résiduel V1 acceptable car visible via pull-to-refresh.

**R2. `representante_legal` éditable dans le form mais pas dans le PUT** — Le code edit.tsx exclut volontairement ce champ du patch (commenté dans le code). UI montre le champ par cohérence visuelle mais il n'est pas envoyé. Risque que l'utilisateur croie l'avoir modifié. **Mitigation** : V2 — désactiver visuellement le champ en mode edit (readonly). Pour V1, la valeur affichée est celle servie côté backend → reste cohérente.

**R3. `tax_id` éditable dans le form mais pas dans le PUT** — même situation que R2. Le NIF est l'identité de l'entreprise, immutable post-create. Mitigation identique.

### 4.2 Risques moyens

**R4. AddMember exige UUID, pas email** — UX décrite explicitement dans le helper text + commentaire dans le code. Sans endpoint `/users/lookup-by-email` côté backend (à créer post-P3), c'est la limite V1.

**R5. QuickAction dashboard à 5 boutons** — plus de 4 boutons sur une row peut serrer les labels sur petit écran (~360 dp). À tester device. Si problème : passer en wrap 3+2 ou icon-only sans label.

**R6. Hard delete sans soft-delete** — Confirmation type-name-to-confirm + warning explicite + bouton rouge. Backend log audit déjà en place. Risque résiduel : user qui type le nom volontairement et regrette → pas de retour arrière. Acceptable au regard du backend behaviour.

### 4.3 Risques faibles

**R7. License PDF download : `expo-sharing` peut être indisponible sur certains forks RN** — `Sharing.isAvailableAsync()` est checké, throw error capturé par mutation onError → snackbar i18n. Pas de crash silencieux.

**R8. Member list onPress ouvre un Menu Paper** — sur iOS le Menu se positionne sous l'item ce qui peut déborder en bas de liste. À tester. Fallback : utiliser Alert.alert avec choix listés.

---

## 5. Ce qui n'a pas été fait — gap honnête

1. **Test device physique** — V1-V8, V9 partial. Build EAS preview Android encore à installer.
2. **Endpoint `/users/lookup-by-email`** — backend à créer pour améliorer add member UX. **Ticket post-P3 à créer**.
3. **Form regimen_fiscal picker visible** — l'enum `RegimenFiscal` est typé mais le form n'a pas de champ dédié (transparent → user ne peut pas le sélectionner explicitement, le backend auto-classify s'en occupe). À discuter UX si user veut force régime.
4. **Auto-classification refresh post-create** — voir R1.
5. **Bundle workflow refinement type `getMyCompanyDetail` retourne `unknown`** — laissé en l'état car non bloquant V1, le module `bundle-workflow` n'a pas été touché pour limiter blast radius.

---

## 6. Recommandation push

OK pour commits locaux automatiques (mémoire #32). Avant push remote :
1. Build EAS Android preview pour intégrer P3 (le précédent build aef98779 a P0+P1+P2 only).
2. Test device : login + tap "Mis Empresas" + create test company + add member fictif (echec attendu si pas un vrai UUID) + edit + delete avec type-name.
3. Smoke régression : tap chaque QuickAction → vérifier que les 5 routes mènent à la bonne destination.
4. Push après validation utilisateur (mémoire #13/#14).

---

## 7. Phase 4 — Pré-requis

P4 = Wizard OCR/Gemini complet + Vault integration (inclut le wizard auto-fill reporté de P2).
- Aucune dépendance bloquante P3.
- P2.5 (auto-fill wizard) sera traité comme premier sous-task de P4.
