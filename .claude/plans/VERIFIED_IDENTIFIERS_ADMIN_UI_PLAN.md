# Plan Implémentation UI Admin - Module verified_identifiers

**Version**: 2.0 (Ajustements architecture)
**Date**: 2026-01-29
**Statut**: EN ATTENTE VALIDATION

---

## 1. Intégration Menu Admin

### Emplacement dans la Sidebar

```
Configuration (id: 'config')
├── Communications
├── Workflows
├── System
├── Menu Configuration
└── Vérification Identités (NOUVEAU)    ← Nouvelle sous-catégorie
    ├── Configuration Documents
    ├── Import Identifiants
    ├── Statistiques
    └── Historique
```

### Modification AdminSidebar.tsx

**Fichier**: `packages/web/src/modules/admin/components/AdminSidebar.tsx`

Ajouter dans `subCategories` du groupe `config` (après "Menu Configuration"):

```typescript
// Verification sub-category (NEW)
{
  id: 'verification',
  title: t('nav.verification'),
  icon: ShieldCheck,   // ou Fingerprint de lucide-react
  items: [
    {
      title: t('nav.verificationDocuments'),
      href: `/${locale}/dashboard/admin/verification/documents`,
      icon: FileSearch,
    },
    {
      title: t('nav.verificationImport'),
      href: `/${locale}/dashboard/admin/verification/import`,
      icon: Upload,
    },
    {
      title: t('nav.verificationStats'),
      href: `/${locale}/dashboard/admin/verification/stats`,
      icon: BarChart3,
    },
    {
      title: t('nav.verificationHistory'),
      href: `/${locale}/dashboard/admin/verification/history`,
      icon: History,
    },
  ],
},
```

### Traductions à Ajouter

**Fichier**: `packages/web/src/i18n/messages/es.json`

```json
{
  "admin": {
    "nav": {
      "verification": "Verificación Identidades",
      "verificationDocuments": "Configuración Documentos",
      "verificationImport": "Importar Identificadores",
      "verificationStats": "Estadísticas",
      "verificationHistory": "Historial"
    }
  }
}
```

---

## 2. Phase 1: Configuration Documents

### Page: `/admin/verification/documents`

**But**: Configurer les types de documents et leurs champs d'extraction pour la vérification.

**Données traitées**:
- `document_verification_config` (CRUD complet)
- `workflow_document_requirements` (lecture seule - source de vérité)
- `v_verification_config_fields` (vue dynamique)

### Maquette UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Configuration Vérification Documents                                   │
│                                                                         │
│  [+ Ajouter Configuration]                                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Filtres: [Source ▼] [Type ID ▼] [Statut ▼]  🔍 Rechercher      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Document        │ Type ID    │ Source   │ Champs      │ Actif   │   │
│  ├─────────────────┼────────────┼──────────┼─────────────┼─────────│   │
│  │ DIP             │ dni        │ cnedoge  │ numero_dip  │ ✓       │   │
│  │ Pasaporte Ant.  │ pasaporte  │ cnedoge  │ numero_pas. │ ✓       │   │
│  │ Permiso Resid.  │ permiso_r. │ cnedoge  │ numero_nie  │ ✓       │   │
│  │ Cert. Conducir  │ cert_cond. │ trafico  │ reg_numero  │ ✓       │   │
│  └─────────────────┴────────────┴──────────┴─────────────┴─────────┘   │
│                                                                         │
│  Page 1 de 2  [< Prev] [Next >]                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Modal Création/Édition

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Configurer Document de Vérification                            [X]    │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Document*:  [dip ▼]  ← Liste depuis workflow_document_requirements    │
│                                                                         │
│  Champs disponibles (auto-détectés):     Champs sélectionnés:          │
│  ┌─────────────────────────┐             ┌─────────────────────────┐   │
│  │ ☐ id_lateral           │             │ ☑ numero_dip (ID)      │   │
│  │ ☐ numero_registro      │    [>>]     │ ☑ fecha_expiracion     │   │
│  │ ☐ fecha_emision        │    [<<]     │   (Expiration)         │   │
│  │ ☐ lugar_emision        │             │                         │   │
│  └─────────────────────────┘             └─────────────────────────┘   │
│                                                                         │
│  Type d'identifiant*: [dni ▼]           Entité source*: [cnedoge ▼]    │
│                                                                         │
│  ☑ Champ obligatoire pour vérification                                 │
│  ☐ Actif                                                               │
│                                                                         │
│  [Annuler]                                           [Enregistrer]     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Contraintes

1. **Unicité**: Un seul config par (document_code, source)
2. **Dépendance**: document_code doit exister dans `workflow_document_requirements`
3. **Validation**: Au moins 1 extraction_path sélectionné
4. **Dynamique**: Champs disponibles chargés depuis form_data existants ou extraction_schema

### API Endpoints (Existants + Nouveaux)

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `/verified-identifiers/config` | GET | Liste configurations | ✅ Existe |
| `/verified-identifiers/config` | POST | Créer config | 🆕 À créer |
| `/verified-identifiers/config/{id}` | PUT | Modifier config | 🆕 À créer |
| `/verified-identifiers/config/{id}` | DELETE | Supprimer config | 🆕 À créer |
| `/verified-identifiers/document-fields/{code}` | GET | Champs disponibles | 🆕 À créer |

### Fichiers à Créer

```
packages/web/src/app/[locale]/(dashboard)/dashboard/admin/verification/
├── documents/
│   ├── page.tsx              # Liste configurations
│   └── [id]/
│       └── page.tsx          # Édition configuration
├── layout.tsx                # Layout partagé
└── page.tsx                  # Redirect vers documents
```

---

## 3. Phase 2: Import Identifiants

### Page: `/admin/verification/import`

**But**: Importer des identifiants vérifiés en batch depuis fichiers CSV/JSON.

**Données traitées**:
- Fichiers CSV/JSON uploadés
- `verified_identifiers` (insertion)
- `import_batches` (tracking)

### Maquette UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Importation Identifiants Vérifiés                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │     📤 Glisser-déposer un fichier CSV ou JSON                  │   │
│  │        ou [Parcourir...]                                       │   │
│  │                                                                 │   │
│  │     Formats acceptés: .csv, .json (max 10MB)                   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Type d'identifiant*: [dni ▼]           Source*: [cnedoge ▼]           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Prévisualisation (5 premiers enregistrements)                  │   │
│  │                                                                 │   │
│  │ Identifiant      │ Expiration   │ Métadonnées    │ Statut      │   │
│  │ ─────────────────┼──────────────┼────────────────┼─────────────│   │
│  │ 000074636        │ 2030-08-05   │ {"nom":"NZO"}  │ ✓ Valide    │   │
│  │ P10004052        │ 2024-11-03   │ -              │ ⚠ Expiré    │   │
│  │ ABC123XYZ        │ -            │ -              │ ✗ Format    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Résumé: 150 valides, 3 expirés, 2 erreurs                            │
│                                                                         │
│  [Annuler]                            [Valider et Importer (150)]      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Format Fichiers

**CSV**:
```csv
identifier,expires_at,metadata
000074636,2030-08-05,"{""nom"":""NZO""}"
P10004052,2024-11-03,
```

**JSON**:
```json
{
  "identifiers": [
    {"identifier": "000074636", "expires_at": "2030-08-05", "metadata": {"nom": "NZO"}},
    {"identifier": "P10004052", "expires_at": "2024-11-03"}
  ]
}
```

### Contraintes

1. **Validation format**: Identifiants non-vides, dates ISO
2. **Déduplication**: Ignore les doublons (upsert)
3. **Chiffrement**: Toutes les données chiffrées avant stockage
4. **Audit**: Traçabilité de l'import (imported_by, batch_id)
5. **Limite**: Max 10,000 enregistrements par import

### API Endpoints (Existants)

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `/verified-identifiers/import` | POST | Importer batch | ✅ Existe |
| `/verified-identifiers/import/validate` | POST | Valider fichier | ✅ Existe |

### Fichiers à Créer

```
packages/web/src/app/[locale]/(dashboard)/dashboard/admin/verification/
└── import/
    └── page.tsx              # Page import avec drag-drop
```

---

## 4. Phase 3: Statistiques

### Page: `/admin/verification/stats`

**But**: Dashboard des métriques de vérification.

**Données traitées**:
- `verified_identifiers` (agrégations)
- `verification_queue` (métriques)
- `service_requests.verification_status` (KPIs)

### Maquette UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Statistiques Vérification                         [Période: 30j ▼]    │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │   12,456   │ │   11,892   │ │     312    │ │     252    │          │
│  │   Total    │ │   Actifs   │ │   Expirés  │ │  Exp. 30j  │          │
│  │ identif.   │ │            │ │            │ │            │          │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │
│                                                                         │
│  ┌───────────────────────────────┐ ┌───────────────────────────────┐   │
│  │ Par Type d'Identifiant       │ │ Par Source                    │   │
│  │ ┌──────────────────────────┐ │ │ ┌──────────────────────────┐ │   │
│  │ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░ dni 65%  │ │ │ │ ▓▓▓▓▓▓▓▓░░░░ cnedoge 45%│ │   │
│  │ │ ▓▓▓▓▓░░░░░░░░ pasap 25% │ │ │ │ ▓▓▓▓▓░░░░░░░ trafico 30%│ │   │
│  │ │ ▓▓░░░░░░░░░░░ otros 10% │ │ │ │ ▓▓▓░░░░░░░░░ otros 25% │ │   │
│  │ └──────────────────────────┘ │ │ └──────────────────────────┘ │   │
│  └───────────────────────────────┘ └───────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Vérifications Demandes (7 derniers jours)                      │   │
│  │                                                                 │   │
│  │  100│         ╭─╮                                              │   │
│  │     │    ╭───╯  ╰──╮                                          │   │
│  │   50│╭──╯          ╰───╮   Auto-vérifiés                      │   │
│  │     │                   ╰───────  Manuels                      │   │
│  │    0└─────────────────────────                                │   │
│  │      Lun  Mar  Mer  Jeu  Ven  Sam  Dim                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Queue de Vérification: 4 en attente │ 0 en cours │ 12 complétés (1h)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Métriques Affichées

| Métrique | Source | Calcul |
|----------|--------|--------|
| Total identifiants | `verified_identifiers` | COUNT(*) |
| Actifs | `verified_identifiers` | WHERE is_active = true |
| Expirés | `verified_identifiers` | WHERE expires_at < NOW() |
| Expirant bientôt | `verified_identifiers` | WHERE expires_at < NOW() + 30d |
| Par type | `verified_identifiers` | GROUP BY identifier_type |
| Par source | `verified_identifiers` | GROUP BY source |
| Demandes vérifiées | `service_requests` | GROUP BY verification_status, date |
| Queue stats | `verification_queue` | GROUP BY status |

### API Endpoints (Existants)

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `/verified-identifiers/stats` | GET | Stats identifiants | ✅ Existe |
| `/verified-identifiers/queue/stats` | GET | Stats queue | ✅ Existe |

### Fichiers à Créer

```
packages/web/src/app/[locale]/(dashboard)/dashboard/admin/verification/
└── stats/
    └── page.tsx              # Dashboard statistiques
```

---

## 5. Phase 4: Historique

### Page: `/admin/verification/history`

**But**: Audit trail des vérifications manuelles et imports.

**Données traitées**:
- `verified_identifiers` (avec verified_by, verification_request_id)
- `import_batches` (historique imports)
- `audit_logs` (actions)

### Maquette UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Historique Vérifications                                              │
│                                                                         │
│  [Vérifications Manuelles] [Imports Batch] [Fraudes Signalées]         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Filtres: [Date: 7 derniers jours ▼] [Agent ▼] [Type ID ▼]            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Date/Heure      │ Agent         │ Type    │ Demande     │ Act. │   │
│  ├─────────────────┼───────────────┼─────────┼─────────────┼──────│   │
│  │ 29/01 14:32     │ J. Martinez   │ dni     │ SRV-2026-01 │ ✓    │   │
│  │ 29/01 14:28     │ J. Martinez   │ pasap.  │ SRV-2026-01 │ ✓    │   │
│  │ 29/01 11:15     │ A. Nguema     │ dni     │ SRV-2026-02 │ ✗    │   │
│  │ 28/01 16:45     │ Import Batch  │ dni     │ -           │ 150  │   │
│  └─────────────────┴───────────────┴─────────┴─────────────┴──────┘   │
│                                                                         │
│  Total: 1,234 entrées  |  Page 1 de 62  [< Prev] [Next >]             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Onglets

1. **Vérifications Manuelles**: Identifiants validés par agents
2. **Imports Batch**: Historique des fichiers importés
3. **Fraudes Signalées**: Identifiants marqués `is_active = false`

### Contraintes

1. **Pas de valeurs en clair**: Jamais afficher les identifiants complets
2. **Masquage**: Afficher seulement `***74636` (derniers 5 chiffres)
3. **Lien traçabilité**: Lien vers la demande d'origine si applicable

### API Endpoints (Nouveaux)

| Endpoint | Méthode | Description | Statut |
|----------|---------|-------------|--------|
| `/verified-identifiers/history` | GET | Historique paginé | 🆕 À créer |
| `/verified-identifiers/history/exports` | GET | Liste imports | 🆕 À créer |
| `/verified-identifiers/history/frauds` | GET | Fraudes signalées | 🆕 À créer |

### Fichiers à Créer

```
packages/web/src/app/[locale]/(dashboard)/dashboard/admin/verification/
└── history/
    └── page.tsx              # Historique avec tabs
```

---

## 6. Résumé Implémentation

### Structure Fichiers Complète

```
packages/web/src/
├── app/[locale]/(dashboard)/dashboard/admin/verification/
│   ├── layout.tsx                    # Layout partagé
│   ├── page.tsx                      # Redirect → documents
│   ├── documents/
│   │   ├── page.tsx                  # Liste configs
│   │   └── [id]/page.tsx             # Édition config
│   ├── import/
│   │   └── page.tsx                  # Import batch
│   ├── stats/
│   │   └── page.tsx                  # Dashboard stats
│   └── history/
│       └── page.tsx                  # Audit trail
│
├── modules/admin/
│   ├── components/
│   │   ├── AdminSidebar.tsx          # MODIFIER - ajouter menu
│   │   ├── VerificationDocumentForm.tsx   # NOUVEAU
│   │   ├── VerificationImportUploader.tsx # NOUVEAU
│   │   └── VerificationStatsCards.tsx     # NOUVEAU
│   ├── hooks/
│   │   └── useVerificationQueries.ts      # NOUVEAU
│   └── services/
│       └── verificationService.ts         # NOUVEAU
│
└── i18n/messages/
    ├── es.json                       # MODIFIER - traductions
    ├── fr.json                       # MODIFIER - traductions
    └── en.json                       # MODIFIER - traductions
```

### Endpoints Backend à Créer

| Endpoint | Priorité | Phase |
|----------|----------|-------|
| `POST /verified-identifiers/config` | P1 | Phase 1 |
| `PUT /verified-identifiers/config/{id}` | P1 | Phase 1 |
| `DELETE /verified-identifiers/config/{id}` | P1 | Phase 1 |
| `GET /verified-identifiers/document-fields/{code}` | P1 | Phase 1 |
| `GET /verified-identifiers/history` | P3 | Phase 4 |
| `GET /verified-identifiers/history/exports` | P3 | Phase 4 |
| `GET /verified-identifiers/history/frauds` | P3 | Phase 4 |

### Permissions Requises

| Permission | Description |
|------------|-------------|
| `identifiers.config` | Gérer configurations documents |
| `identifiers.import` | Importer batch identifiants |
| `identifiers.stats` | Voir statistiques |
| `identifiers.history` | Voir historique (à créer) |

---

## 7. Priorisation

| Phase | Priorité | Dépendances | Estimation |
|-------|----------|-------------|------------|
| Phase 1 | HAUTE | Backend CRUD endpoints | - |
| Phase 2 | MOYENNE | Phase 1 (config) | - |
| Phase 3 | MOYENNE | Backend stats (existe) | - |
| Phase 4 | BASSE | Backend history endpoints | - |

### Ordre Recommandé

1. **Phase 1** - Configuration Documents (fondation pour tout le reste)
2. **Phase 3** - Statistiques (endpoints existent déjà)
3. **Phase 2** - Import (endpoint existe, UI simple)
4. **Phase 4** - Historique (requires new endpoints)

---

## 8. Validation Checklist

### Phase 1
- [ ] Menu ajouté dans AdminSidebar
- [ ] Traductions ajoutées (es/fr/en)
- [ ] Page liste configurations fonctionnelle
- [ ] Modal création/édition fonctionnel
- [ ] Champs dynamiques chargés depuis DB
- [ ] Tests E2E

### Phase 2
- [ ] Upload drag-drop fonctionnel
- [ ] Validation fichier avant import
- [ ] Prévisualisation données
- [ ] Import avec progression
- [ ] Gestion erreurs

### Phase 3
- [ ] Cartes métriques affichées
- [ ] Graphiques par type/source
- [ ] Graphique temporel
- [ ] Filtres période

### Phase 4
- [ ] Liste paginée historique
- [ ] Onglets par type
- [ ] Masquage identifiants
- [ ] Export CSV
