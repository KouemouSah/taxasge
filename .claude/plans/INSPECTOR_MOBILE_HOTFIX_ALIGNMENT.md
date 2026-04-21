# INSPECTOR MOBILE HOTFIX — Alignement Bundle Workflow

**Date** : 2026-04-18
**Auteur** : Sah
**Scope** : `packages/inspector/` uniquement (0 modification backend)
**Effort estimé** : ~2h total (3 hotfixes)
**Pré-requis** : Aucune migration, aucun endpoint nouveau

---

## Contexte

Le bundle workflow backend a évolué (P1-P4 + migrations 291-301) avec :
- Dossier unifié 1:1 `commercial_license ↔ service_request`
- Scope agent validé (`OmsAgentService.compute_collection_scope()`)
- Entity location (`entity_location_id` → city_id → Malabo/Bata)
- Flag `agent_restricted` par obligation renvoyé par `/inspections/verify`

Le mobile inspector a intégré les flags P4 (`agent_restricted`, `existing_dossier`, `pending_payment`) mais **n'exploite pas** :
- Le contexte agent complet (entity_location, region)
- L'AgentScope pour UX proactive
- Le filtrage location dans le dashboard

## Analyse des endpoints existants

| Endpoint | Retourne location? | Retourne scope? | Mobile l'appelle? |
|----------|-------------------|-----------------|-------------------|
| `GET /users/profile` | NON (city basique) | NON | OUI (auth) |
| `GET /profiles/me` | OUI (entity_location_id, location_city, location_region, is_main_office) | NON (mais entity_code, ministry_id) | NON |
| `GET /inspections/verify` | NON | OUI (agent_scope complet) | OUI (verify) |
| `GET /inspections/supervisor/dashboard` | Filtrage interne par location | NON | OUI (supervisor) |

**Conclusion** : Le backend expose TOUT ce qu'il faut. Le mobile doit juste consommer `/profiles/me` à la connexion.

---

## HF-1 : Propager le contexte agent dans l'auth (~45 min)

### Objectif
Après login, appeler `/profiles/me` pour récupérer `entity_location_id`, `entity_code`, `location_city`, `location_region`, `is_main_office` et le stocker dans le contexte auth.

### Fichiers à modifier

#### 1.1 `src/core/config/types.ts` — Enrichir UserProfile
```typescript
// AJOUTER à UserProfile (lignes ~20-44)
entity_location_id?: string;
entity_code?: string;
location_city?: string;
location_region?: string;  // 'Insular' | 'Continental'
is_main_office?: boolean;
ministry_id?: number | null;
is_supervisor_agent?: boolean;  // distinct de permission check
```

#### 1.2 `src/core/api/endpoints.ts` — Ajouter endpoint profiles
```typescript
// AJOUTER dans l'objet endpoints
agents: {
  profile: '/profiles/me',
},
```

#### 1.3 `src/core/auth/auth-provider.tsx` — Fetch agent profile post-login

**Après** le `signIn()` réussi et le stockage des tokens :
1. Appeler `GET /profiles/me`
2. Merger les champs agent dans `UserProfile`
3. Stocker via `setUserProfile(enrichedProfile)`
4. Aussi dans `refreshProfile()` (rafraîchissement)

**Logique** (pseudo-code) :
```typescript
async function enrichWithAgentProfile(baseProfile: UserProfile): Promise<UserProfile> {
  try {
    const agentProfile = await apiGet('/profiles/me');
    return {
      ...baseProfile,
      entity_location_id: agentProfile.entity_location_id,
      entity_code: agentProfile.entity_code,
      location_city: agentProfile.location_city,
      location_region: agentProfile.location_region,
      is_main_office: agentProfile.is_main_office,
      ministry_id: agentProfile.ministry_id,
      is_supervisor_agent: agentProfile.is_supervisor,
    };
  } catch {
    // /profiles/me peut échouer si l'user n'a pas de profil agent
    // (citoyen connecté par erreur sur inspector app → pas bloquant)
    return baseProfile;
  }
}
```

**Points d'appel** :
- `signIn()` : après `setUser(userProfile)` (ligne ~130)
- `verify2fa()` : après `setUser(userProfile)` (ligne ~155)
- `signInWithBiometric()` : après `setUser(userProfile)` (ligne ~170)
- `refreshProfile()` : dans le refresh existant (ligne ~195)
- `bootstrap (useEffect)` : lors du chargement depuis MMKV (ligne ~80)

#### 1.4 `src/core/auth/auth-provider.tsx` — Exposer dans AuthContext
```typescript
// AJOUTER au AuthContextValue
agentContext: {
  entityCode: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  isMainOffice: boolean;
  ministryId: number | null;
} | null;
```

### Validation HF-1
- [ ] Login agent → UserProfile contient entity_location_id
- [ ] Login agent → location_city visible dans console/debug
- [ ] Login citoyen sur inspector → pas de crash (/profiles/me 403 catchée)
- [ ] Refresh profile → agent context mis à jour
- [ ] Biometric login → agent context disponible

---

## HF-2 : Afficher scope agent + location dans l'UI (~45 min)

### Objectif
Montrer à l'agent son contexte (entity, location, scope) et améliorer l'UX de collecte.

### Fichiers à modifier

#### 2.1 `src/app/(tabs)/index.tsx` — Header dashboard avec location

Ajouter sous le titre du dashboard :
```
Agent AYUNTAMIENTO — Malabo (Insular)
```

**Source** : `user.entity_code` → label lisible + `user.location_city` + `user.location_region`

**Mapping entity_code → label** :
```typescript
const ENTITY_LABELS: Record<string, string> = {
  AYUNTAMIENTO: 'Ayuntamiento',
  CAMARA_COMERCIO: 'Cámara de Comercio',
  MIN_HACIENDA: 'Min. Hacienda',
  MIN_COMERCIO: 'Min. Comercio',
  MIN_INFORMACION: 'Min. Información',
  MIN_TURISMO: 'Min. Turismo',
  MIN_AGRICULTURA: 'Min. Agricultura',
  MIN_ELECTRICIDAD: 'Min. Electricidad',
  TESORO: 'Tesoro Público',
};
```

#### 2.2 `src/app/(tabs)/verify.tsx` — Badge scope agent

Après la section "company header" (ligne ~218), ajouter un chip informatif :
```
[shield-icon] Scope: tesoro (Min. Hacienda) — Malabo
```

**Source** : `verificationResult.agent_scope` (déjà renvoyé par `/inspections/verify`)

#### 2.3 `src/modules/inspections/components/obligation-list.tsx` — Tooltip scope amélioré

Actuellement affiche `'Out of your agent scope'` (générique).
Améliorer avec la raison spécifique de `agent_restricted_reason` :
```
[lock] Hors scope : fee_type=chamber (votre scope: tesoro)
```

**Source** : `ob.agent_restricted_reason` (déjà dans le type, déjà renvoyé par backend)

#### 2.4 `src/app/inspection/[id]/payment.tsx` — Résumé scope avant soumission

Avant le bouton "Confirmer", afficher un encart récapitulatif :
```
Collecte: 3 obligations tesoro — 450 000 XAF
Agent: [entity_code] — [location_city]
```

### Validation HF-2
- [ ] Dashboard affiche entity + location de l'agent
- [ ] Verify affiche le scope agent après recherche
- [ ] Obligations restreintes affichent la raison spécifique
- [ ] Payment affiche le résumé avant soumission
- [ ] i18n : les 3 langues (es/fr/en) ont les clés

---

## HF-3 : Stats dashboard par location (~30 min)

### Objectif
Le superviseur voit ses stats filtrées par sa location (le backend le fait déjà en interne via `entity_location_id`). Afficher la location dans le header stats pour clarté.

### Fichiers à modifier

#### 3.1 `src/modules/dashboard/components/stats-grid.tsx` — Header location

Ajouter un sous-titre au grid :
```
Aujourd'hui — Malabo (Insular)
```
ou pour superviseur main_office :
```
Aujourd'hui — Toutes locations
```

**Source** : `user.location_city` + `user.is_main_office` depuis auth context

#### 3.2 `src/app/(tabs)/index.tsx` — Supervisor hub location labels

Dans la section supervisor alerts, préciser :
```
Cash non-réconcilié: 1 250 000 XAF (Malabo)
```
ou si main_office :
```
Cash non-réconcilié: 1 250 000 XAF (global)
```

#### 3.3 `src/app/supervisor/reconciliation.tsx` — Filtrage visuel

Si le superviseur est à Bata (pas main_office), les items de réconciliation sont déjà filtrés par le backend. Ajouter un badge informatif :
```
Affichage: Bata (Continental) uniquement
```

### Validation HF-3
- [ ] Dashboard agent affiche sa location
- [ ] Dashboard supervisor main_office affiche "Toutes locations"
- [ ] Dashboard supervisor secondaire affiche sa location
- [ ] Reconciliation affiche le scope géographique

---

## Résumé des fichiers impactés

| Fichier | HF | Modification |
|---------|-----|-------------|
| `src/core/config/types.ts` | HF-1 | +7 champs UserProfile |
| `src/core/api/endpoints.ts` | HF-1 | +1 endpoint `/profiles/me` |
| `src/core/auth/auth-provider.tsx` | HF-1 | +enrichWithAgentProfile() + 5 points d'appel |
| `src/app/(tabs)/index.tsx` | HF-2, HF-3 | Header location + supervisor labels |
| `src/app/(tabs)/verify.tsx` | HF-2 | Badge scope agent |
| `src/modules/inspections/components/obligation-list.tsx` | HF-2 | Raison restriction spécifique |
| `src/app/inspection/[id]/payment.tsx` | HF-2 | Résumé scope avant submit |
| `src/modules/dashboard/components/stats-grid.tsx` | HF-3 | Header location |
| `src/app/supervisor/reconciliation.tsx` | HF-3 | Badge scope géographique |

**Total : 9 fichiers modifiés, 0 fichier créé, 0 modification backend**

---

## Risques et précautions

| Risque | Mitigation |
|--------|-----------|
| `/profiles/me` 403 si user pas agent | try/catch dans enrichWithAgentProfile() — fail silently |
| `/profiles/me` lent (latence) | Appel parallèle au chargement dashboard, pas bloquant pour auth |
| entity_code null (agent sans profil) | Fallback: ne pas afficher le badge, pas de crash |
| i18n manquant | 3 fichiers de traduction à enrichir (es/fr/en) |
| Pas de test E2E mobile | Validation manuelle sur device/emulateur |

---

## Ordre d'exécution

1. **HF-1** d'abord (fondation : contexte agent disponible)
2. **HF-2** ensuite (consomme le contexte)
3. **HF-3** enfin (affichage dashboard)

Chaque HF est committé indépendamment et testable isolément.
