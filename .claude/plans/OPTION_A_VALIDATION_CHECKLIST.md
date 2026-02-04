# Checklist de Validation - Option A (Correction Wizard Pasaporte)

> **Date** : 2026-02-05
> **Commit** : A faire

---

## Modifications effectuees

### 1. Frontend - wizard/page.tsx

| Modification | Fichier | Ligne ~approx | Status |
|--------------|---------|---------------|--------|
| Ajout prop `solicitudType` a l'appel | page.tsx | ~1171 | OK |
| Ajout `solicitudType` a l'interface | page.tsx | ~1895 | OK |
| Ajout `solicitudType` aux params fonction | page.tsx | ~1910 | OK |
| Modification `step2Fields` conditionnel | page.tsx | ~1950 | OK |

### 2. Backend - Schema DIP

| Modification | Fichier | Status |
|--------------|---------|--------|
| Ajout `nombre_padre` dans filiacion.fields | dip_gq.json | OK |
| Correction `visual_zones.verso` | dip_gq.json | OK |

---

## Checklist de validation fonctionnelle

### Scenario 1: EXPEDICION Adulte

- [ ] Champs filiation affiches : nombre_padre, profesion_padre, nombre_madre, profesion_madre
- [ ] Champs pasaporte anterior : NON affiches
- [ ] Documents requis : DIP, Certificado Nacimiento, Photo

### Scenario 2: EXPEDICION Mineur

- [ ] Champs filiation affiches : nombre_padre, profesion_padre, nombre_madre, profesion_madre
- [ ] Champs pasaporte anterior : NON affiches
- [ ] Documents requis : Certificado Nacimiento, Photo, Autorizacion Parental, DIP Rep 1, DIP Rep 2*

### Scenario 3: RENOVACION VENCIMIENTO Adulte

- [ ] Champs filiation : NON affiches (extraits du DIP si besoin)
- [ ] Champs pasaporte anterior affiches : numero, fecha_expedicion, fecha_expiracion (REQUIRED)
- [ ] Documents requis : DIP, Photo, Pasaporte Antiguo

### Scenario 4: RENOVACION VENCIMIENTO Mineur

- [ ] Champs filiation affiches (mineur = certificado)
- [ ] Champs pasaporte anterior affiches (REQUIRED)
- [ ] Documents requis : Certificado, Photo, Pasaporte Antiguo, Autorizacion, DIP Rep*

### Scenario 5: RENOVACION DETERIORO Adulte

- [ ] Champs filiation : NON affiches
- [ ] Champs pasaporte anterior affiches (REQUIRED)
- [ ] Documents requis : DIP, Photo, Pasaporte Antiguo (danado)

### Scenario 6: RENOVACION DETERIORO Mineur

- [ ] Champs filiation affiches
- [ ] Champs pasaporte anterior affiches (REQUIRED)
- [ ] Documents requis : Certificado, Photo, Pasaporte Antiguo, Autorizacion, DIP Rep*

### Scenario 7: RENOVACION PERDIDA Adulte

- [ ] Champs filiation : NON affiches
- [ ] Champs pasaporte anterior affiches (REQUIRED)
- [ ] Documents requis : DIP, Photo, Pasaporte Antiguo, Denuncia Policial

### Scenario 8: RENOVACION ROBO Adulte

- [ ] Champs filiation : NON affiches
- [ ] Champs pasaporte anterior affiches (REQUIRED)
- [ ] Documents requis : DIP, Photo, Pasaporte Antiguo, Denuncia Policial

---

## Verification technique

### TypeScript

```bash
cd packages/web && npm run type-check
# Result: OK (pas d'erreurs)
```

### ESLint

```bash
cd packages/web && npx eslint "src/app/[locale]/(dashboard)/dashboard/service-requests/[id]/wizard/page.tsx"
# Result: OK (pas d'erreurs)
```

### JSON Schema

```bash
# Verification syntaxe JSON
python -c "import json; json.load(open('packages/backend/app/modules/service_requests/schemas/dip_gq.json'))"
# Result: A verifier
```

---

## Logique implementee

### Affichage des champs (step2Fields)

```typescript
// Filiation: EXPEDICION ou mineur
const showFiliationFields = solicitudType === 'EXPEDICION' || isMinor

// Pasaporte anterior: RENOVACION uniquement
const showPasaporteAnteriorFields = solicitudType === 'RENOVACION'
```

### Matrice resultante

| Type | isMinor | Filiation | Pasaporte Anterior |
|------|---------|-----------|-------------------|
| EXPEDICION | false | OUI | NON |
| EXPEDICION | true | OUI | NON |
| RENOVACION | false | NON | OUI (required) |
| RENOVACION | true | OUI | OUI (required) |

---

## Risques residuels

1. **Extraction OCR** : Le champ `nombre_padre` ajoute au schema DIP doit etre extrait par Gemini
   - Mitigation : Le champ est `required: false`, pas bloquant

2. **Donnees existantes** : Les demandes en cours n'ont pas `nombre_padre` extrait
   - Mitigation : Le champ est optionnel, l'utilisateur peut le saisir manuellement

3. **Backend form_review_2** : La config backend peut encore lister les champs sans condition
   - Impact : Aucun - le frontend filtre maintenant independamment

---

## Fichiers modifies (pour commit)

```
packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/[id]/wizard/page.tsx
packages/backend/app/modules/service_requests/schemas/dip_gq.json
.claude/plans/PASAPORTE_DOCUMENT_MATRIX.md (nouveau)
.claude/plans/OPTION_A_VALIDATION_CHECKLIST.md (nouveau)
```
