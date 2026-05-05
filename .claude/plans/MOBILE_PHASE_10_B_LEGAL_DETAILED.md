# PHASE B — Privacy Policy + ToS mobile + acceptation utilisateur (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : sign-up impossible sans accepter privacy + terms ; versions persistées en BD ; 3 pages mobile + section profil.
**Cible time** : 1 jour
**Branche** : `develop`

---

## 1. CONTEXTE

Google Play exige obligatoirement :
- Une **Privacy Policy URL publique** (web `/legal/privacy`) accessible sans login (déjà case côté web)
- Pour V1 1M+ users + données fiscales : **acceptation explicite** au signup avec persistance de la version acceptée (RGPD-friendly + audit trail)

Le web a déjà :
- `packages/web/src/app/[locale]/(public)/legal/{privacy,terms,cookies}/page.tsx`
- Textes complets en `legalPages.{privacy,terms,cookies}.*` × 3 langues (es/fr/en) dans `packages/web/messages/{es,fr,en}.json` ligne 10735+

Le mobile a actuellement :
- ❌ Aucune page legal
- ❌ Aucune acceptation au signup
- ❌ Aucune persistance en BD

---

## 2. AUDIT BD DIRECT (2026-05-02 via asyncpg)

### 2.1 Table `users` (47 colonnes)
- ✅ Schéma riche, mais **AUCUNE** colonne legal/consent/terms/privacy/accept
- ✅ `id UUID PK` `gen_random_uuid()`
- ✅ `email`, `password_hash`, `first_name`, `last_name`, `phone_number` requis pour register
- ✅ `created_at` / `updated_at` `now()`
- ✅ `role user_role_enum` valeurs réelles BD : `citizen, business, accountant, admin, agent, funcionario`

### 2.2 Aucune table dédiée `legal_*`, `consent_*`, `terms_*`, `privacy_*`

### 2.3 Pas de `schema_migrations` BD — les fichiers `.sql` dans `packages/backend/migrations/` sont la source unique
- Dernière migration : `330_register_security_dashboard.sql`
- **Prochaine** : `331_add_legal_acceptance_columns.sql`

---

## 3. ARCHITECTURE

### 3.0 SCOPE — décision user 2026-05-02 (post-challenge)

**Acceptation legal exigée UNIQUEMENT pour** :
- ✅ Rôles `citizen`, `business`, `accountant` (les seuls qui s'inscrivent via mobile signup)
- ✅ Plateforme mobile UNIQUEMENT (web V1 inchangé pour ne pas casser le flow existant)

**Rôles EXCLUS** : `admin`, `agent`, `funcionario`
- Pourquoi : créés en interne par l'admin (pas via signup form mobile), liés par contrat de travail interne, pas besoin de CGU app distinctes.

**Mitigation gap RGPD pour users existants connectés via mobile** :
- Modal post-login blocant "Acceptez les nouvelles CGU" si `terms_accepted_at IS NULL` ET `role IN (citizen, business, accountant)`
- Persiste via nouveau endpoint `POST /legal/accept` (auth required)
- Couvre les users existants migrés `1.0.0-legacy` qui n'ont jamais explicitement accepté
- Pour les users 100% web jamais venus sur mobile : V1.1 alignera web sign-up + post-login modal web

### 3.1 Stockage acceptation — DÉCISION : colonnes `users` inline (pas table séparée)

**Pourquoi inline et non `legal_acceptances` séparée** :
- V1 simple, 1 acceptation par user au signup, pas de re-acceptation history
- Lookup rapide à chaque login (1 row vs JOIN)
- Si version change → on persiste la NOUVELLE version + timestamp, écrase l'ancienne
- Audit trail history déléguée à `audit_logs` table existante (event = `terms.accepted` `privacy.accepted`)

**Trade-off honnête** : si versions changent souvent et qu'on veut prouver "l'user a accepté la v1.0 puis la v1.1", il faut migration vers table séparée V1.1. Pour V1 launch, inline suffit.

### 3.2 Migration `331_add_legal_acceptance_columns.sql`

```sql
-- Phase 10/B — Legal acceptance columns for Privacy Policy + Terms of Service
-- Required by Play Store / RGPD : track which version each user accepted + when.
-- See .claude/plans/MOBILE_PHASE_10_B_LEGAL_DETAILED.md
--
-- SCOPE : columns apply to ALL users for schema cleanliness, but the
-- ACCEPTANCE FLOW is enforced only for roles citizen/business/accountant
-- via mobile (see decision §3.0). admin/agent/funcionario rows stay NULL
-- — they're internal employees with separate contractual agreements.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version       VARCHAR(16),
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version     VARCHAR(16);

-- Backfill ONLY for roles where acceptance is enforced (citizen, business,
-- accountant). For these existing users, treat the original signup as
-- implicit acceptance of the terms in force at the time (deemed-accepted
-- basis, version tagged "1.0.0-legacy"). admin/agent/funcionario remain
-- NULL — they have no app-CGU obligation.
--
-- IMPORTANT : the post-login mobile modal (§3.x) re-prompts users with
-- terms_accepted_at IS NULL OR terms_version != current. Setting
-- "1.0.0-legacy" here ensures legacy users won't be re-prompted unless we
-- bump the current version above 1.0.0.
UPDATE users
SET terms_accepted_at   = COALESCE(terms_accepted_at,   created_at),
    terms_version       = COALESCE(terms_version,       '1.0.0-legacy'),
    privacy_accepted_at = COALESCE(privacy_accepted_at, created_at),
    privacy_version     = COALESCE(privacy_version,     '1.0.0-legacy')
WHERE role IN ('citizen', 'business', 'accountant')
  AND (terms_accepted_at IS NULL OR privacy_accepted_at IS NULL);

-- Indices : on filtre rarement par version (pas d'index nécessaire).
-- Si on doit lister "tous les users qui n'ont pas accepté la v2.0",
-- ce sera un scan léger sur < 1M lignes.

COMMIT;
```

### 3.3 Endpoint backend `GET /api/v1/legal/versions`

**Nouveau router** : `packages/backend/app/modules/legal/api/legal_routes.py`

```python
"""Legal versions endpoint — exposes current Privacy & ToS versions for clients.

Mobile reads this at sign-up screen to know which versions to send back in
POST /auth/register. Web reads it to decide whether to nag the user for
re-acceptance after a version bump.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/legal", tags=["legal"])


class LegalVersionsResponse(BaseModel):
    privacy_version: str
    privacy_last_updated: str  # ISO date
    terms_version: str
    terms_last_updated: str    # ISO date
    cookies_version: str
    cookies_last_updated: str


@router.get("/versions", response_model=LegalVersionsResponse)
async def get_legal_versions() -> LegalVersionsResponse:
    """Public endpoint — no auth required."""
    return LegalVersionsResponse(
        privacy_version=settings.LEGAL_PRIVACY_VERSION,
        privacy_last_updated=settings.LEGAL_PRIVACY_LAST_UPDATED,
        terms_version=settings.LEGAL_TERMS_VERSION,
        terms_last_updated=settings.LEGAL_TERMS_LAST_UPDATED,
        cookies_version=settings.LEGAL_COOKIES_VERSION,
        cookies_last_updated=settings.LEGAL_COOKIES_LAST_UPDATED,
    )
```

**Settings** (`packages/backend/app/config.py`) — ajouter :
```python
LEGAL_PRIVACY_VERSION: str = "1.0.0"
LEGAL_PRIVACY_LAST_UPDATED: str = "2026-05-02"
LEGAL_TERMS_VERSION: str = "1.0.0"
LEGAL_TERMS_LAST_UPDATED: str = "2026-05-02"
LEGAL_COOKIES_VERSION: str = "1.0.0"
LEGAL_COOKIES_LAST_UPDATED: str = "2026-05-02"
```

**Register router** dans `packages/backend/app/main.py` — append au bloc des routers.

### 3.4 Modification `POST /auth/register`

**Modèle Pydantic** `RegisterRequest` (`packages/backend/app/modules/auth/api/auth_routes.py:101-152`) — ajouter 2 champs **Optional** (mobile remplit, web ignore en V1) :

```python
terms_version_accepted: Optional[str] = Field(None, min_length=1, max_length=16,
    description="Version of Terms of Service the user is accepting (mobile only)")
privacy_version_accepted: Optional[str] = Field(None, min_length=1, max_length=16,
    description="Version of Privacy Policy the user is accepting (mobile only)")
```

**Service `AuthService.register()`** (`packages/backend/app/modules/auth/services/auth_service.py:80-179`) :
- Si `role IN (citizen, business, accountant)` ET les versions sont fournies (mobile case) :
  - Valider `terms_version_accepted == settings.LEGAL_TERMS_VERSION` (exact match)
  - Si pas match → `HTTPException 400 "outdated_legal_versions"` détails `{expected: ..., received: ...}` + force update mobile
  - Persister `terms_accepted_at = now(tz.utc)`, `terms_version`, idem privacy
- Si versions absentes (web V1) ou role admin/agent/funcionario : aucune validation, colonnes restent NULL (acceptable car backfill SQL n'aura pas touché ces rôles)

**Repository `UserRepository.create_user()`** : ajouter les 4 colonnes au INSERT en passant des paramètres optionnels (`None` par défaut → SQL DEFAULT NULL).

### 3.4-bis Nouveau endpoint `POST /api/v1/legal/accept` (auth required)

Pour le **modal post-login mobile** quand un user existant migré `1.0.0-legacy` doit ré-accepter une version bumped, ou quand on veut re-prompt rétroactivement.

```python
@router.post("/accept")
async def accept_legal_versions(
    payload: LegalAcceptPayload,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ('citizen', 'business', 'accountant'):
        raise HTTPException(403, "legal_acceptance_not_required_for_role")

    # Strict version match — protect against client sending stale version
    if payload.terms_version != settings.LEGAL_TERMS_VERSION:
        raise HTTPException(400, detail={"error": "outdated_terms_version", ...})
    if payload.privacy_version != settings.LEGAL_PRIVACY_VERSION:
        raise HTTPException(400, detail={"error": "outdated_privacy_version", ...})

    await user_repo.update_legal_acceptance(
        user_id=current_user.id,
        terms_version=payload.terms_version,
        terms_accepted_at=datetime.now(timezone.utc),
        privacy_version=payload.privacy_version,
        privacy_accepted_at=datetime.now(timezone.utc),
    )
    return {"status": "accepted"}
```

Endpoint exposé sur `/api/v1/legal/accept`, retourne 200 + `{status: "accepted"}` en cas de succès.

### 3.5 Mobile — pages legal

3 pages route `/legal/*` (Stack screen, pas tab bar) :
- `packages/mobile/src/app/legal/_layout.tsx` (Stack header titre)
- `packages/mobile/src/app/legal/privacy.tsx`
- `packages/mobile/src/app/legal/terms.tsx`
- `packages/mobile/src/app/legal/cookies.tsx`

Pattern simple :
```tsx
// privacy.tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@core/theme';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  // Sections nommées selon clés i18n legalPages.privacy.*
  const sections = [
    'dataCollected', 'purpose', 'legalBasis', 'retention',
    'sharing', 'rights', 'security', 'contact',
  ];

  return (
    <>
      <Stack.Screen options={{ title: t('legal.privacy.title') }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
                  contentContainerStyle={{ padding: 16 }}>
        <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
          {t('legal.privacy.lastUpdated')}
        </Text>
        <Text variant="bodyLarge" style={{ marginBottom: 24 }}>
          {t('legal.privacy.intro')}
        </Text>
        {sections.map((key, i) => (
          <View key={key} style={{ marginBottom: 16 }}>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {i + 1}. {t(`legal.privacy.${key}Title`)}
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {t(`legal.privacy.${key}Content`)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
```

### 3.6 Mobile — composant `LegalAcceptanceCard`

`packages/mobile/src/modules/legal/components/legal-acceptance-card.tsx`

```tsx
interface Props {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsToggle: (v: boolean) => void;
  onPrivacyToggle: (v: boolean) => void;
}

// 2 checkboxes + liens cliquables (router.push('/legal/terms'))
// Trans component pour rendre les liens inline dans le texte
```

### 3.7 Mobile — intégration sign-up

`packages/mobile/src/app/(auth)/sign-up.tsx` — après les champs habituels :
- Insérer `<LegalAcceptanceCard ... />` AVANT le bouton submit
- Désactiver submit `disabled = !termsAccepted || !privacyAccepted`
- Au POST, ajouter `terms_version_accepted` + `privacy_version_accepted` depuis hook `useLegalVersions()`

### 3.8 Mobile — hook `useLegalVersions`

`packages/mobile/src/modules/legal/hooks/use-legal-versions.ts`

```ts
export function useLegalVersions() {
  return useQuery({
    queryKey: ['legal', 'versions'],
    queryFn: () => apiClient.get(API_ENDPOINTS.legal.versions),
    staleTime: 1000 * 60 * 60, // 1h — change rare
    gcTime:    1000 * 60 * 60 * 24,
  });
}
```

`packages/mobile/src/core/api/endpoints.ts` — ajouter section :
```ts
legal: {
  versions: '/legal/versions',
},
```

### 3.9 Mobile — section "Légal" dans Profile

`packages/mobile/src/app/settings/profile.tsx` (ou équivalent) — ajouter une carte "Légal" avec 3 ListItem cliquables → push `/legal/{privacy,terms,cookies}`.

---

## 4. STRUCTURE DES FICHIERS

### Backend
| Fichier | Action |
|---------|--------|
| `packages/backend/migrations/331_add_legal_acceptance_columns.sql` | NEW |
| `packages/backend/app/modules/legal/__init__.py` | NEW |
| `packages/backend/app/modules/legal/api/__init__.py` | NEW |
| `packages/backend/app/modules/legal/api/legal_routes.py` | NEW |
| `packages/backend/app/config.py` | EDIT (ajouter 6 settings) |
| `packages/backend/app/main.py` | EDIT (register router) |
| `packages/backend/app/modules/auth/models/auth_models.py` | EDIT (RegisterRequest +2 fields) |
| `packages/backend/app/modules/auth/services/auth_service.py` | EDIT (validate + persist) |
| `packages/backend/app/modules/auth/repositories/user_repository.py` (ou `users/`) | EDIT (INSERT +4 cols) |

### Mobile
| Fichier | Action |
|---------|--------|
| `packages/mobile/src/app/legal/_layout.tsx` | NEW |
| `packages/mobile/src/app/legal/privacy.tsx` | NEW |
| `packages/mobile/src/app/legal/terms.tsx` | NEW |
| `packages/mobile/src/app/legal/cookies.tsx` | NEW |
| `packages/mobile/src/modules/legal/components/legal-acceptance-card.tsx` | NEW |
| `packages/mobile/src/modules/legal/hooks/use-legal-versions.ts` | NEW |
| `packages/mobile/src/modules/legal/index.ts` | NEW (barrel) |
| `packages/mobile/src/app/(auth)/sign-up.tsx` | EDIT (intégration) |
| `packages/mobile/src/app/settings/profile.tsx` (ou équivalent) | EDIT (lien) |
| `packages/mobile/src/core/api/endpoints.ts` | EDIT (legal.versions) |
| `packages/mobile/src/core/i18n/locales/es.json` | EDIT (+legal.* clés) |
| `packages/mobile/src/core/i18n/locales/fr.json` | EDIT (+legal.* clés) |
| `packages/mobile/src/core/i18n/locales/en.json` | EDIT (+legal.* clés) |

---

## 5. CHECKLIST OPÉRATIONNELLE

### B.1 — Plan détaillé ✅
- [x] Ce fichier

### B.2 — Backend migration BD
- [ ] Créer `migrations/331_add_legal_acceptance_columns.sql`
- [ ] Tester localement (smoke `psql` ou via init backend)
- [ ] Vérifier rollback possible (DROP COLUMN...)

### B.3 — Backend router legal
- [ ] Créer `app/modules/legal/api/legal_routes.py`
- [ ] Ajouter 6 settings à `config.py`
- [ ] Register router dans `main.py`
- [ ] Test curl `GET /api/v1/legal/versions` (200 + JSON)

### B.4 — Backend modification auth/register
- [ ] `RegisterRequest` +2 champs `terms_version_accepted`, `privacy_version_accepted`
- [ ] `AuthService.register()` valide + persiste
- [ ] `UserRepository.create_user()` INSERT +4 colonnes
- [ ] Test pytest `test_register_with_legal_acceptance` (smoke)

### B.5 — Mobile pages legal
- [ ] `app/legal/_layout.tsx` (Stack header)
- [ ] `app/legal/privacy.tsx` (sections from i18n keys)
- [ ] `app/legal/terms.tsx`
- [ ] `app/legal/cookies.tsx`

### B.6 — Mobile composant + hook
- [ ] `modules/legal/components/legal-acceptance-card.tsx`
- [ ] `modules/legal/hooks/use-legal-versions.ts`
- [ ] `modules/legal/index.ts` (barrel)
- [ ] `core/api/endpoints.ts` += `legal.versions`

### B.7 — Mobile i18n
- [ ] Copier textes web `legalPages.privacy.*` → mobile `legal.privacy.*` × 3 langues (avec ajustements mobile : pas de `<br>` HTML, juste `\n`)
- [ ] Idem `legalPages.terms.*` → `legal.terms.*`
- [ ] Idem `legalPages.cookies.*` → `legal.cookies.*`
- [ ] Clés `legal.acceptance.terms`, `legal.acceptance.privacy`, `legal.acceptance.required` × 3 langues
- [ ] Run drift script `scripts/i18n-drift.js` ou équivalent

### B.8 — Mobile intégration sign-up
- [ ] Insérer `<LegalAcceptanceCard>` dans sign-up form
- [ ] Submit disabled tant que checkboxes != cochées
- [ ] Inclure `terms_version_accepted` + `privacy_version_accepted` dans le POST register

### B.9 — Mobile section Profile → Légal
- [ ] Ajouter section "Légal" dans `/settings/profile` ou `/profile`
- [ ] 3 ListItem cliquables → push `/legal/*`

### B.10 — Tests
- [ ] tsc 0 erreur
- [ ] ESLint < 100 warnings
- [ ] i18n drift script exit 0
- [ ] Smoke staging : `curl GET /api/v1/legal/versions` — 200 OK
- [ ] Smoke local : sign-up form avec/sans checkboxes — comportement attendu

### B.11 — Critique
- [ ] Écrire `MOBILE_PHASE_10_B_CRITIQUE.md`
- [ ] Risques d'edge cases (user sans connexion qui sign-up : versions cached ?)

### B.12 — Commits sémantiques
1. `feat(backend): mig 331 — legal acceptance columns + /legal/versions endpoint`
2. `feat(backend/auth): persist terms+privacy version on register`
3. `feat(mobile): legal pages (privacy/terms/cookies) + acceptance card`
4. `feat(mobile/auth): require terms+privacy acceptance on sign-up`
5. `feat(mobile/profile): legal links section`
6. `chore(mobile/i18n): legal.* keys × 3 langues`

---

## 6. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Mobile sign-up offline → endpoint /legal/versions inaccessible → user bloqué | MOYENNE | MOYEN | Fallback : si versions API échoue, hardcode versions mobile via env (`EXPO_PUBLIC_LEGAL_TERMS_VERSION`) — backend valide quand même au POST |
| User existant migré 1.0.0-legacy → version mismatch quand on bump à 2.0.0 | MOYENNE | FAIBLE | Pas de blocage, juste flag à afficher "ré-accepter" en V1.1 |
| Textes web trop longs pour mobile (UX) | FAIBLE | FAIBLE | ScrollView + paragraphes courts, déjà testé i18n web sur petits écrans |
| Migration 331 échoue sur BD prod | FAIBLE | HAUT | `IF NOT EXISTS` + UPDATE backfill conditionnel, idempotent |
| Régression sur sign-up existant (user sans nouvelles colonnes) | FAIBLE | HAUT | Backfill UPDATE assure tous les anciens users ont valeurs |
| Drift i18n entre 3 langues | MOYENNE | FAIBLE | Drift script bloque le commit |

---

## 7. DÉCISIONS

- **Storage** : 4 colonnes inline `users.{terms,privacy}_{accepted_at,version}` (pas table séparée). V1.1 si besoin audit trail history.
- **Versions** : `1.0.0` initial pour Privacy + Terms + Cookies. Backfill `1.0.0-legacy` pour users existants.
- **Validation backend stricte** : `terms_version_accepted == settings.LEGAL_TERMS_VERSION` exact match. Si version client outdated → 400 force update mobile.
- **Acceptance card** : 2 checkboxes (Terms, Privacy). Cookies n'a PAS de checkbox (politique informationnelle uniquement, pas opt-in mobile).
- **Mobile pages** : route `/legal/*` (pas tab bar — pas user-facing en hors-signup, accessible via Profile).
- **Liens hors-app** : pas vers `webview` du web. On rendre inline dans mobile pour parité offline + cohérence dark mode.

---

## 8. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé après audit BD direct (asyncpg). Schéma users confirmé sans colonnes legal. Migration 331 prochain numéro. 6 commits sémantiques planifiés.

---

## 9. SORTIE ATTENDUE PHASE B

| Livrable | Localisation |
|----------|--------------|
| Plan détaillé | ✅ ce fichier |
| Migration SQL | `packages/backend/migrations/331_add_legal_acceptance_columns.sql` |
| Backend router legal | `packages/backend/app/modules/legal/api/legal_routes.py` |
| Backend register update | `auth_routes.py:460` payload + `auth_service.py` validation |
| Mobile pages legal | `packages/mobile/src/app/legal/{privacy,terms,cookies}.tsx` |
| Mobile acceptance card | `packages/mobile/src/modules/legal/components/legal-acceptance-card.tsx` |
| Mobile hook | `packages/mobile/src/modules/legal/hooks/use-legal-versions.ts` |
| Mobile sign-up integration | edit `(auth)/sign-up.tsx` |
| i18n × 3 langues | edit `core/i18n/locales/{es,fr,en}.json` |
| Critique | `MOBILE_PHASE_10_B_CRITIQUE.md` |
| Commits | sur `develop`, 6 sémantiques |
