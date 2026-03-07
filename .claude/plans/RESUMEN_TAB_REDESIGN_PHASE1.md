# Plan: Resumen Tab Redesign - Phase 1 (Frontend-only)

## Objectif
Refonte de l'onglet Resumen de la page detail agent pour afficher uniquement les informations decisionnelles, sans scroll, en 4 cards maximum.

## Status: IMPLEMENTED - EN ATTENTE DEPLOY

## Changements

### Card 1: Datos del Solicitante (FUSIONNER)
- Photo a gauche (si applicable)
- Identity fields + Contact (email, phone) fusionnes
- Supprimer ContactCard separee

### Card 2: Informacion Complementaria
- Champs form_data non-identity (inchange)

### Card 3: Datos Clave de Documentos (NOUVEAU)
- Remplace les N cards DocumentExtractionSections
- Grid responsive 2/3/4 colonnes de mini-blocs
- Chaque mini-bloc: nom document + champs decisionnels uniquement
- Badges colores pour resultado (OK/warning/blocage)
- Documents sans champs decisionnels: non affiches (visibles dans tab Documentos)

### Card 4: Pago + Cita (FUSIONNER tarif dans pago)
- Supprimer card Tarifa separee
- Ajouter breakdown (Base + Supp + Penalties = Total) dans card Pago
- Appointment a cote

## Mapping Champs Decisionnels par Document

### PASAPORTE
- nombre_completo / apellidos + nombres: Levenshtein 85% vs autres docs
- nacionalidad: CEMAC check, non-GNQ check
- fecha_nacimiento: Age eligibilite, coherence exacte
- fecha_expiracion: Passeport expire = blocage
- codigo_pais: CEMAC zone (Residencia)

### DIP
- nombre_completo: Coherence identite
- fecha_nacimiento: Coherence exacte

### SELLO_ENTRADA (Residencia)
- fecha / fecha_entrada: Calcul CEMAC 90 jours
- puesto_fronterizo: Info contextuelle

### VISADO_ENTRADA (Residencia, Tramites Visado)
- tipo_visado: LIMITADO requis pour PRORROGA, TRANSIT exclu
- fecha_expedicion: Doit etre AVANT fecha_entrada
- fecha_expiracion: Expire = blocage (sauf SALIDA_VENCIDO = inverse)

### ANTECEDENTES_PENALES (Residencia)
- resultado: NEGATIVO=OK, POSITIVO/HAS_CONVICTIONS=blocage

### SOLVENCIA_TRIBUTARIA (Residencia, Contrato)
- resultado: SOLVENTE=OK, NO_SOLVENTE=warning
- empresa_nif: Cross-check avec certificado_nif

### CERTIFICADO_BUENA_CONDUCTA (Residencia)
- resultado: FAVORABLE=OK, DESFAVORABLE=blocage

### ATESTACION_BANCARIA (Residencia)
- nombre_completo: Levenshtein 85% vs pasaporte
- nombre_banco: Info contextuelle

### EXTRAIT_CASIER_JUDICIAIRE (Residencia internationaux)
- resultado: CLEAN=OK, HAS_CONVICTIONS=blocage
- nacionalidad: Coherence vs pasaporte
- pays_emission: Info contextuelle

### RESIDENCIA_ANTERIOR (Residencia RENOVACION)
- fecha_expiracion: <90j = renouvelable
- apellidos: Levenshtein 85% vs pasaporte

### CERTIFICADO_NIF (Contrato)
- empresa_nif: Cross-check exact avec contrato
- denominacion_social: Coherence vs escritura

### CONTRATO_ONRC (Contrato)
- fecha_firma: >30j = penalite registre tardif
- nif_contratista: Cross-check avec certificado_nif

### ESCRITURA_CONSTITUCION (Contrato)
- denominacion_social: Coherence vs certificado_nif

### PERMISO_CIRCULACION (Matriculacion)
- matricula: Exact match vs CUVE
- numero_bastidor: Exact match vs CUVE
- propietario: Cross-check vs vendeur (TRANSFERENCIA)

### CUVE (Matriculacion)
- matricula: Exact match vs permiso
- numero_bastidor: Exact match vs permiso

### CERTIFICADO_RECONOCIMIENTO (Matriculacion PRIMERA)
- cumple_condiciones_minimas: true=OK, false=blocage
- tiene_firma: Requis
- tiene_sello: Requis

### CONTRATO_COMPRAVENTA (Matriculacion TRANSFERENCIA)
- vendedor: Cross-check vs propietario permiso

### CERTIFICADO_ACTUAL (Conducir EXTENSION)
- clases_permiso: Previent classes dupliquees

### NOMBRAMIENTO (Carnet Funcionario)
- fecha_nombramiento: Doit etre <= toma_posesion

### CERTIFICADO_PERDIDA (Carnet DUPLICADO)
- fecha_emision: <30j requis

### CARNET_FUNCIONARIO (Promocion)
- categoria: Rang doit etre < nouveau titre

## Design: Grid Mini-Blocs
- Full-width card
- grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Chaque bloc: document name header (bold, text-xs, bg-muted) + champs decisionnels
- Resultado badges: green (OK), red (blocage), orange (warning)
- OCR confidence badge si < 80%

## Fichiers a modifier
1. `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/[entityCode]/request/[requestId]/page.tsx`
   - DynamicFormDisplay: fusionner contact, supprimer tarif card, nouveau DocumentKeyData
   - ResumenTab (formDisplaySchema path): meme fusionnement photo+contact
   - DocumentExtractionSections: remplacer par DocumentKeyDataCard
   - ContactCard: supprimer
   - Ajouter DECISION_FIELDS mapping

## Phases
- [x] Phase 0: Plan + mapping champs (validation utilisateur)
- [x] Phase 1: DECISION_FIELDS mapping (22 doc types, ~75 champs) + DocumentKeyDataCard
- [x] Phase 2: Contact (email/phone) fusionne dans Identity card + photo
- [x] Phase 3: Tarifa condensee en breakdown dans Payment card
- [x] Phase 4: ContactCard supprime, DocumentExtractionSections remplace
- [ ] Phase 5: Deploy + test visuel
