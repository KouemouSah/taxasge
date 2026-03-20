# Analyse critique — Interface Mobile Agents de Contrôle & Recouvrement

**Date** : 2026-03-20
**Auteur** : Claude (expert métier fiscal GE)
**Statut** : ANALYSE — en attente de validation avant implémentation

---

## 1. ANALYSE DE TA PROPOSITION

### Ce que tu proposes (résumé)

```
Entrée → Saisie N° Registro/Nom OU Scan QR licence
       → Filtré par entité/site/zone de l'agent
       → Affiche état paiement (obligations de l'entité concernée)

Si tout payé → Agent valide inspection → Rapport + notifications
Si impayé/partiel → 2 options :
  a) Encaisser (cash direct ou voie électronique)
  b) Sceller (motif enum) → Rapport scellé + notifications + MAJ système
```

### Ce que je valide ✅

| Point | Verdict | Commentaire |
|---|---|---|
| Double entrée (texte + QR) | ✅ Excellent | Le QR est rapide, le texte est le fallback indispensable |
| Filtrage par entité/zone agent | ✅ Correct | L'agent ne doit voir QUE les obligations de son entité |
| Rapport d'inspection auto | ✅ Correct | Trace audit + preuve juridique |
| Notifications SMS + email | ✅ Correct | Le propriétaire doit être informé immédiatement |
| Scellé avec motif enum | ✅ Excellent | Standardise les motifs, facilite les statistiques |
| Encaissement terrain | ✅ Correct | Cash est le mode dominant en GE |

### Ce que je challenge ⚠️

| Point | Problème | Ma correction |
|---|---|---|
| **"Si tout est payé → valider"** | Trop binaire. L'agent doit aussi vérifier que l'activité correspond à la licence. Un bar qui a une licence d'abaceria n'est pas en conformité. | Ajouter une étape de **vérification de conformité** : activité constatée = activité déclarée ? |
| **Encaissement cash direct** | Dangereux sans trace. Comment prouver que l'agent a bien reversé l'argent ? | **Reçu numéroté obligatoire** avec QR de vérification + montant + signature numérique. L'agent ne peut pas encaisser sans générer un reçu traçable. |
| **Voie électronique "se valide automatiquement"** | Non — le paiement mobile money (BANGE) nécessite une confirmation webhook. "Sous réserve de confirmation" = l'agent ne sait pas si c'est OK. | Le flow doit être : agent initie → redirect mobile money → webhook confirme → statut mis à jour automatiquement. L'agent voit le statut en temps réel. |
| **Scellé = décision finale de l'agent seul** | Risque d'abus de pouvoir. Un agent pourrait sceller un commerce pour des raisons personnelles. | **Validation superviseur** requise pour les scellés. L'agent propose le scellé, le superviseur confirme (délai max 24h sinon auto-validé pour ne pas bloquer). |
| **Pas de photos** | En cas de contestation, comment prouver l'état du commerce ? | **Photos obligatoires** : min 1 photo de la façade. Stockage Firebase Storage. |
| **Pas de géolocalisation** | Comment prouver que l'agent était sur place ? | **GPS obligatoire** à la validation/scellé. Comparaison avec l'adresse déclarée de l'entreprise. |
| **Pas de mode offline** | En zone rurale GE (Annobón, Kie-Ntem), pas de réseau. | **Mode offline** avec sync queue. Les inspections sont stockées localement et synchronisées quand le réseau revient. |

---

## 2. POINTS CRUCIAUX MANQUANTS

### 2.1 Sécurité et anti-fraude

| Point | Risque si absent | Solution |
|---|---|---|
| **Double inspection** | Un agent inspecte 2 fois le même commerce le même jour pour gonfler ses stats | Contrainte : 1 inspection par licence par jour par agent. BD enforce. |
| **Agent fantôme** | Un agent prétend avoir inspecté sans se déplacer | GPS + timestamp + photo obligatoires. Superviseur peut vérifier la cohérence. |
| **Encaissement sans reversement** | L'agent collecte du cash et ne le reverse pas au trésor | Reçu numéroté auto-incrémenté (SEQUENCE). Réconciliation quotidienne obligatoire. Alertes SLA si non-reversé sous 48h. |
| **Scellé abusif** | Agent scelle un commerce pour raisons personnelles | Validation superviseur + motif enum (pas de texte libre seul). Historique des scellés par agent auditable. |
| **QR code falsifié** | Quelqu'un génère un faux QR pour un commerce non enregistré | HMAC vérification serveur. Le scan DOIT passer par le backend. |

### 2.2 Workflow complet (ce que tu n'as pas mentionné)

| Étape | Description | Statut dans ta proposition |
|---|---|---|
| **1. Planification** | Le superviseur assigne une tournée (liste d'entreprises/zone) | ❌ Manquant |
| **2. Check-in terrain** | L'agent arrive sur place, GPS + photo façade | ❌ Manquant |
| **3. Identification** | Scan QR ou saisie manuelle | ✅ Proposé |
| **4. Vérification conformité** | Activité constatée = activité déclarée ? | ❌ Manquant |
| **5. Contrôle paiement** | Affichage obligations + statuts | ✅ Proposé |
| **6a. Validation** (si conforme) | Rapport d'inspection OK + notifications | ✅ Proposé |
| **6b. Encaissement** (si impayé) | Cash terrain ou mobile money | ✅ Proposé |
| **6c. Mise en demeure** | Avertissement formel avant scellé (délai 48h) | ❌ Manquant — CRITIQUE |
| **6d. Scellé** | Fermeture physique + rapport + notifications | ✅ Proposé |
| **7. Rapport journalier** | Récapitulatif de la tournée (inspections, encaissements, scellés) | ❌ Manquant |
| **8. Réconciliation** | L'agent reverse le cash collecté au trésor | ❌ Manquant |

### 2.3 Mise en demeure — Étape juridique obligatoire

En droit fiscal GE, le scellé n'est pas instantané. Le processus légal est :

1. **Constat d'infraction** → L'agent constate le non-paiement
2. **Mise en demeure** → Notification formelle avec délai (généralement 48-72h)
3. **Deuxième visite** → Si toujours impayé après le délai
4. **Scellé** → Fermeture physique avec PV

**Sans mise en demeure préalable, le scellé peut être contesté en justice.**

Tu dois ajouter une étape intermédiaire "Mise en demeure" entre le constat et le scellé.

---

## 3. MODÈLE DE DONNÉES PROPOSÉ

### 3.1 Table `field_inspections`

```sql
CREATE TABLE field_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Contexte agent
    agent_id UUID NOT NULL REFERENCES users(id),
    entity_code VARCHAR(50) NOT NULL,
    entity_location_id UUID REFERENCES entity_locations(id),

    -- Cible
    company_id UUID NOT NULL REFERENCES companies(id),
    license_id UUID REFERENCES commercial_licenses(id),

    -- Localisation
    gps_latitude NUMERIC(10, 7),
    gps_longitude NUMERIC(10, 7),
    gps_accuracy_meters NUMERIC(6, 1),
    address_verified BOOLEAN DEFAULT false,

    -- Résultat
    inspection_type VARCHAR(30) NOT NULL DEFAULT 'routine',
        -- routine, follow_up, enforcement, seal_verification
    result VARCHAR(30) NOT NULL,
        -- conforme, non_conforme_paiement, non_conforme_activite,
        -- mise_en_demeure, scelle, paiement_collecte

    -- Conformité activité
    activite_constatee VARCHAR(200),
    activite_conforme BOOLEAN,

    -- Paiement
    obligations_total NUMERIC(15, 2) DEFAULT 0,
    obligations_paid NUMERIC(15, 2) DEFAULT 0,
    obligations_overdue INTEGER DEFAULT 0,
    payment_collected BOOLEAN DEFAULT false,
    payment_collected_amount NUMERIC(15, 2),
    payment_collection_method VARCHAR(20), -- cash, mobile_money
    payment_receipt_number VARCHAR(50),

    -- Scellé
    seal_applied BOOLEAN DEFAULT false,
    seal_number VARCHAR(50),
    seal_reason VARCHAR(50), -- ENUM: non_paiement, activite_non_conforme,
                             --       licence_expiree, sans_licence,
                             --       infraction_sanitaire, decision_justice
    seal_requires_supervisor BOOLEAN DEFAULT true,
    seal_supervisor_approved BOOLEAN,
    seal_supervisor_id UUID REFERENCES users(id),
    seal_approved_at TIMESTAMPTZ,

    -- Mise en demeure
    mise_en_demeure_issued BOOLEAN DEFAULT false,
    mise_en_demeure_deadline TIMESTAMPTZ,
    mise_en_demeure_reference VARCHAR(50),

    -- Preuves
    photos JSONB DEFAULT '[]', -- [{url, type: facade|interieur|document|seal, timestamp}]
    notes TEXT,

    -- Métadonnées
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    is_offline_sync BOOLEAN DEFAULT false,
    offline_created_at TIMESTAMPTZ,

    -- Audit
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
        -- in_progress, completed, pending_supervisor, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_field_inspections_agent ON field_inspections (agent_id, created_at DESC);
CREATE INDEX idx_field_inspections_company ON field_inspections (company_id, created_at DESC);
CREATE INDEX idx_field_inspections_license ON field_inspections (license_id);
CREATE INDEX idx_field_inspections_entity ON field_inspections (entity_code, created_at DESC);
-- Anti-doublon : 1 inspection par licence par jour par agent
CREATE UNIQUE INDEX idx_field_inspections_unique_daily
    ON field_inspections (agent_id, license_id, (created_at::date))
    WHERE status != 'cancelled';
```

### 3.2 Enums de motifs de scellé

```sql
CREATE TYPE seal_reason_enum AS ENUM (
    'non_paiement',              -- Obligaciones no pagadas tras mise en demeure
    'activite_non_conforme',     -- Actividad diferente a la declarada
    'licence_expiree',           -- Licencia vencida sin renovación
    'sans_licence',              -- Operando sin licencia comercial
    'infraction_sanitaire',      -- Infracción de normas sanitarias
    'infraction_securite',       -- Infracción de normas de seguridad
    'decision_justice',          -- Orden judicial
    'fraude_fiscale',            -- Fraude fiscal constatado
    'autre'                      -- Otro (requiere notes obligatorias)
);
```

### 3.3 Permissions nécessaires

```sql
INSERT INTO permissions (name, description, module) VALUES
('inspection.create', 'Créer une inspection terrain', 'inspection'),
('inspection.view_own', 'Voir ses propres inspections', 'inspection'),
('inspection.view_entity', 'Voir les inspections de son entité', 'inspection'),
('inspection.seal_propose', 'Proposer un scellé (nécessite validation supervisor)', 'inspection'),
('inspection.seal_approve', 'Approuver un scellé (superviseur)', 'inspection'),
('inspection.collect_payment', 'Encaisser un paiement terrain', 'inspection'),
('inspection.mise_en_demeure', 'Émettre une mise en demeure', 'inspection'),
('inspection.view_reports', 'Voir les rapports d''inspection', 'inspection'),
('inspection.export', 'Exporter les données d''inspection', 'inspection');
```

---

## 4. ARCHITECTURE TECHNIQUE PROPOSÉE

### 4.1 Frontend — PWA responsive (pas React Native)

**Justification** : L'app mobile React Native est citizen-facing. Ajouter des screens agents dans la même app crée un risque de sécurité (un citoyen pourrait accéder aux fonctions agent). De plus, la PWA permet le déploiement instantané sans passage par les stores.

```
/dashboard/agent/field/
├── page.tsx              — Dashboard terrain (inspections du jour, stats)
├── scan/page.tsx         — Scanner QR + saisie manuelle
├── inspect/[id]/page.tsx — Formulaire d'inspection (résultat, photos, notes)
├── collect/[id]/page.tsx — Encaissement terrain (cash/mobile money)
├── reports/page.tsx      — Historique des inspections
└── reconcile/page.tsx    — Réconciliation cash journalière
```

### 4.2 Backend — Nouveau module `inspections`

```
packages/backend/app/modules/inspections/
├── api/
│   ├── inspection_routes.py      — CRUD inspections
│   └── field_collection_routes.py — Encaissement terrain
├── models/
│   └── inspection.py             — Pydantic models
├── repositories/
│   └── inspection_repository.py  — Data access
├── services/
│   ├── inspection_service.py     — Logique métier
│   ├── seal_service.py           — Gestion scellés
│   └── field_pdf_service.py      — Rapports PDF
└── templates/
    ├── inspection_report.html    — Template rapport inspection
    └── seal_report.html          — Template PV scellé
```

### 4.3 Flow technique détaillé

```
SCAN QR → GET /verify/license/{ref}?t={hmac}&lid={uuid}&agent_mode=true
        → Backend : vérifie HMAC + vérifie agent authentifié
        → Retourne données enrichies (obligations détaillées par entité)
        → Frontend affiche

VALIDATION → POST /inspections/
          → Body: { license_id, result: "conforme", photos: [...], gps: {...} }
          → Backend: crée field_inspection + log compliance_event
          → EventBus.publish(INSPECTION_COMPLETED) → notifications

ENCAISSEMENT → POST /inspections/{id}/collect
             → Body: { amount, method: "cash", obligations: [...] }
             → Backend: crée service_payment (manual) + lie à l'inspection
             → Génère reçu PDF avec QR
             → EventBus.publish(PAYMENT_MANUAL_PENDING) → flow trésorerie

SCELLÉ → POST /inspections/{id}/seal
       → Body: { reason: "non_paiement", notes, photos: [...] }
       → Backend: crée inspection avec seal_applied=true, status=pending_supervisor
       → EventBus.publish(SEAL_PROPOSED) → notification superviseur
       → Superviseur approuve → EventBus.publish(SEAL_APPROVED) → notifications proprio
```

---

## 5. PLAN D'IMPLÉMENTATION

### Phase 1 : Backend fondations (3-4h)
- [ ] Migration : table `field_inspections` + permissions + index
- [ ] Module `inspections` : models, repository, service basique
- [ ] Endpoint enrichi : `GET /verify/license/{ref}?agent_mode=true` (obligations par entité)
- [ ] Endpoints CRUD : `POST /inspections/`, `GET /inspections/`, `GET /inspections/{id}`
- [ ] Templates notifications : `INSPECTION_COMPLETED`, `SEAL_PROPOSED`, `SEAL_APPROVED`, `MISE_EN_DEMEURE`

### Phase 2 : Scan + Inspection (3-4h)
- [ ] Frontend : composant QRScanner (html5-qrcode)
- [ ] Page scan : double entrée (QR + texte)
- [ ] Page résultat : affichage obligations enrichi (filtré par entité agent)
- [ ] Page inspection : formulaire (résultat, conformité activité, photos, GPS, notes)
- [ ] Génération rapport PDF inspection

### Phase 3 : Encaissement terrain (2-3h)
- [ ] Endpoint : `POST /inspections/{id}/collect`
- [ ] Frontend : formulaire encaissement (montant, méthode, sélection obligations)
- [ ] Génération reçu PDF numéroté + QR
- [ ] Liaison avec flow trésorerie existant (ManualValidationProcessor)

### Phase 4 : Scellé + Mise en demeure (2-3h)
- [ ] Endpoint : `POST /inspections/{id}/seal` (propose)
- [ ] Endpoint : `POST /inspections/{id}/seal/approve` (superviseur)
- [ ] Endpoint : `POST /inspections/{id}/mise-en-demeure`
- [ ] Frontend : formulaire scellé (motif enum + notes + photos)
- [ ] Workflow superviseur : notification + approbation
- [ ] Génération PV scellé PDF

### Phase 5 : Dashboard + Réconciliation (2h)
- [ ] Dashboard terrain : inspections du jour, stats (conforme/non-conforme/scellé)
- [ ] Réconciliation cash : liste encaissements non-reversés + alerte SLA
- [ ] Rapport journalier : résumé tournée exportable

### Phase 6 : Offline + Mobile (3h)
- [ ] Service Worker pour PWA offline
- [ ] IndexedDB/localStorage pour queue d'inspections
- [ ] Sync automatique au retour réseau
- [ ] UI mobile-first (bottom sheet, touch targets 44px+)

---

## 6. ESTIMATION GLOBALE

| Phase | Effort | Priorité | Dépendances |
|---|---|---|---|
| Phase 1 | 3-4h | **CRITIQUE** | Rien |
| Phase 2 | 3-4h | **CRITIQUE** | Phase 1 |
| Phase 3 | 2-3h | **HAUTE** | Phase 2 |
| Phase 4 | 2-3h | **HAUTE** | Phase 2 |
| Phase 5 | 2h | **MOYENNE** | Phase 3-4 |
| Phase 6 | 3h | **BASSE** (MVP sans offline d'abord) | Phase 2-4 |

**Total estimé : 15-19h de développement**

**Recommandation** : Livrer Phase 1-4 en MVP (inspections + encaissement + scellé sans offline), puis Phase 5-6 en itération 2.

---

## 7. INFRASTRUCTURE EXISTANTE RÉUTILISABLE

| Composant existant | Réutilisation dans le module inspection |
|---|---|
| `ManualValidationProcessor` | Flow encaissement terrain → même pipeline cash |
| `license_pdf_service.py` | Pattern pour les rapports PDF inspection/scellé |
| `LicensePDFService.verify_license_token()` | Vérification QR code |
| `agent_profiles` + entity context | Filtrage par entité/zone de l'agent |
| `license_compliance_events` table | Logging des événements d'inspection (table existante mais vide) |
| `EventBus` + `NotificationEventHandler` | Notifications automatiques |
| `get_agent_zone_id()` / `get_agent_entity_id()` | Contexte géographique agent |
| `CommunicationService` + email/SMS | Envoi notifications avec PDF attaché |
| Treasury validation dashboard | Layout UI réutilisable (split view agent) |
