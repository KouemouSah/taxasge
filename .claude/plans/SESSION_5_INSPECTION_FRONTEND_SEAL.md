# Session 5 — Inspection Frontend + Scellé Workflow

**Prérequis** : Session 4 (Backend inspections complet, 11 endpoints)
**Durée estimée** : 6-7h

---

## Phase 4 : Inspection Terrain Frontend (4h)

### 4.1 QR Scanner Component (1h)

**Fichier** : `packages/web/src/components/shared/QRScanner.tsx`

- Bibliothèque : `html5-qrcode` (npm install)
- Props : `onScan(data: string)`, `onError(err: string)`, `enabled: boolean`
- Fallback : bouton "Saisir manuellement" → input texte
- Permission caméra : demande explicite avec message explicatif
- Responsive : plein écran sur mobile, zone fixe sur desktop

### 4.2 Page Scan (`scan/page.tsx`) (1h)

```
/dashboard/agent/{entity}/field/scan/page.tsx
```

**Mobile layout** :
```
┌──────────────────────┐
│ ← Retour  Inspección │
├──────────────────────┤
│                      │
│   ┌──────────────┐   │
│   │              │   │
│   │  QR CAMERA   │   │
│   │              │   │
│   └──────────────┘   │
│                      │
│ ─── o saisir ─────── │
│                      │
│ [NIF / N° Registro ] │
│ [    Rechercher    ] │
├──────────────────────┤
│ ▼ RÉSULTAT           │
│ Tienda El Sol        │
│ PE-8253 │ Autónomo   │
│ Zone A1 — Malabo     │
│                      │
│ OBLIGATIONS (Tesoro) │
│ ✅ Tasa municipal  OK│
│ ❌ Impôt commerce 50K│
│ ❌ Timbre fiscal  20K│
│                      │
│ [Commencer Inspection]│
└──────────────────────┘
```

**Desktop layout** :
```
┌─────────────────┬────────────────────────┐
│ QR Scanner      │ Résultat               │
│                 │                        │
│ [Camera zone]   │ Tienda El Sol          │
│                 │ PE-8253 │ Autónomo     │
│ -- ou --        │                        │
│ [NIF/Reg input] │ Obligations (Tesoro)   │
│ [Rechercher]    │ ✅ Municipal    OK     │
│                 │ ❌ Commerce    50K     │
│                 │ ❌ Timbre      20K     │
│                 │                        │
│                 │ [Commencer Inspection] │
└─────────────────┴────────────────────────┘
```

### 4.3 Page Formulaire Inspection (`inspect/[id]/page.tsx`) (1.5h)

**Sections** :
1. **Entreprise** (readonly) — nom, NIF/Reg, activité déclarée, zone, adresse
2. **Conformité activité** — Radio: conforme / non-conforme + champ "activité constatée"
3. **État paiement** — Tableau obligations readonly (coloré vert/rouge/orange)
4. **Photos** — Upload zone (drag+drop desktop, tap mobile) min 1 photo façade
5. **GPS** — Auto-capture + affichage coordonnées + précision
6. **Notes** — Textarea libre
7. **Actions** (bottom bar sticky) :
   - ✅ Tout conforme → Valider inspection
   - ⚠️ Impayé première visite → Mise en demeure
   - 💰 Propriétaire veut payer → Encaisser
   - 🔒 Impayé après MED → Sceller

### 4.4 Dashboard terrain (`page.tsx`) (30min)

```
/dashboard/agent/{entity}/field/page.tsx
```

- Stats du jour : inspections réalisées, conformes, non-conformes, scellés
- Liste des dernières inspections (aujourd'hui)
- Bouton proéminent "Nouvelle inspection" → /scan
- Alerte : cash non-reversé, mises en demeure expirées

---

## Phase 5 : Scellé + Mise en demeure (3h)

### 5.1 Mise en demeure (1h)

**Flow** :
1. Agent clique "Mise en demeure" dans le formulaire inspection
2. Modal : confirme le délai (72h par défaut), sélectionne les obligations concernées
3. Backend : `POST /inspections/{id}/mise-en-demeure`
4. Crée l'inspection avec `mise_en_demeure_issued=true`, `mise_en_demeure_deadline=NOW()+72h`
5. Génère PDF mise en demeure avec QR
6. EventBus → email + SMS au propriétaire
7. L'agent reçoit le PDF pour impression/remise

**PDF Mise en demeure** :
- Header : République de GE, entité émettrice
- Destinataire : nom entreprise, NIF, adresse
- Corps : constat de non-paiement, liste obligations impayées, montant total
- Délai : "Vous disposez de 72h pour régulariser votre situation"
- Conséquence : "À défaut, votre établissement sera mis sous scellé"
- QR code vérification

### 5.2 Scellé (1.5h)

**Flow** :
1. Agent vérifie que la mise en demeure est expirée (72h passées)
2. Agent clique "Sceller" → Modal avec motif (enum) + notes + photo obligatoire
3. Backend : `POST /inspections/{id}/seal`
4. Crée inspection avec `seal_applied=true, status=pending_supervisor`
5. EventBus → notification superviseur (email + push)
6. Superviseur reçoit l'alerte dans son dashboard
7. Superviseur approuve → `POST /inspections/{id}/seal/approve`
8. Backend : MAJ `companies.is_active=false`, `commercial_licenses.status='suspended'`
9. Génère PV de scellé PDF
10. EventBus → email + SMS au propriétaire

**Auto-approve** : si le superviseur ne répond pas sous 24h, le scellé est automatiquement validé (cron).

### 5.3 Levée de scellé (30min)

**Flow** :
1. Le propriétaire paie toutes les obligations + pénalités (via le flux normal)
2. L'agent constate le paiement lors d'une nouvelle inspection
3. Résultat : `conforme` → lève le scellé
4. Backend : `companies.is_active=true`, `commercial_licenses.status='open'`
5. Notification : scellé levé

---

## Validation Session 5

- [ ] QR Scanner fonctionne (camera permission, scan, fallback texte)
- [ ] Scan → résultat entreprise avec obligations filtrées par entité
- [ ] Formulaire inspection complet (conformité, photos, GPS, notes)
- [ ] Process "conforme" → rapport PDF + notifications
- [ ] Process "mise en demeure" → PDF + notifications + deadline 72h
- [ ] Process "scellé" → pending_supervisor + notification superviseur
- [ ] Superviseur approuve scellé → MAJ company + license + PV PDF
- [ ] Mobile responsive : bottom sheet actions, camera plein écran
- [ ] ESLint 0 erreurs, TypeScript 0 erreurs
- [ ] Push + CI green
