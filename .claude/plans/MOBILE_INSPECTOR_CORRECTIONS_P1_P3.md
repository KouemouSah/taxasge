# PLAN DE CORRECTIONS - Facil Inspeccion (Phases 1-3)

**Date**: 2026-03-30
**Status**: PLAN B COMPLETE - PLAN A en attente (RAM systeme)
**Objectif**: Corriger tous les problemes identifies avant de passer a P4 (Supervisor Avance)

---

## RAPPORT CRITIQUE - Resume executif

### Constat principal
**Le build Android n'a JAMAIS reussi** (exit code 3221225794 = JVM OOM).
Tout le code P1-P3 (65 fichiers TS, 18 ecrans) est **non teste sur device**.

### Bugs critiques identifies
1. Gradle JVM heap insuffisant (2GB vs 4GB+ requis)
2. 4 architectures compilees au lieu de 1 pour dev
3. 2FA non implemente (TODO dans sign-in.tsx)
4. Strings hardcodees en espagnol (complete.tsx, inspections/index.tsx)
5. Pas de validation Zod sur aucun formulaire
6. i18n FR/EN = JSON one-liner illisible
7. GPS Accuracy.Balanced au lieu de High pour inspections legales
8. QR Code scanner absent (licences ont QR de verification)
9. Screen protection absente (pas de use-screen-protection)
10. Endpoints manquants dans client API (PDF, missions, analytics, export)
11. Fichiers placeholder orphelins (inspection/index.tsx, supervisor/index.tsx)

---

## PLAN A : Fix Gradle + Premier Build (BLOQUANT)

### A.1 - Augmenter memoire JVM
- [x] `gradle.properties`: JVM heap + HeapDumpOnOutOfMemoryError
- [x] Ajouter `-XX:+HeapDumpOnOutOfMemoryError` pour diagnostics
- [x] Diagnostic: machine 16GB RAM, 265MB libre → OOM systeme, pas JVM

### A.2 - Reduire architectures dev
- [x] `gradle.properties`: `reactNativeArchitectures=arm64-v8a` (device USB = ARM64)
- [x] `newArchEnabled=false` (temp: saves ~1.5GB during codegen)
- [x] `org.gradle.parallel=false` (reduce peak memory)
- [ ] Build debug APK (BLOQUE: fermer apps pour liberer 3-4GB RAM, ou EAS cloud)

### A.3 - Optimisations build supplementaires
- [ ] Activer `org.gradle.caching=true`
- [ ] Ajouter `org.gradle.configureondemand=true`
- [ ] Verifier espace disque suffisant (RN new arch = 2GB+ cache)

### A.4 - Build et test
- [ ] `npx expo run:android` - build debug APK
- [ ] Installer sur device USB
- [ ] Verifier que l'app demarre (splash → sign-in)

---

## PLAN B : Corrections Qualite P1-P3

### B.1 - Fix strings hardcodees → i18n (P1+P3)
**Fichiers concernes:**
- [ ] `complete.tsx:93-94`: "Resumen", "Empresa", "Fecha" → `t('complete.summary')`, etc.
- [ ] `complete.tsx:159`: "Notas finales" → `t('complete.finalNotes')`
- [ ] `complete.tsx:168`: "Observaciones finales (opcional)" → `t('complete.finalNotesPlaceholder')`
- [ ] `inspections/index.tsx:88`: "Buscar empresa..." → `t('search.placeholder')`
- [ ] `app-lock.tsx:69-72`: textes en espagnol → `t('appLock.*')`
- [ ] Verifier TOUS les fichiers pour strings ES restantes
- [ ] Ajouter les cles manquantes dans es.json, fr.json, en.json

### B.2 - Implementer 2FA (P1)
**Backend deja pret : POST /auth/login/2fa-verify**
- [ ] Creer ecran `(auth)/verify-2fa.tsx` (input 6 digits + timer)
- [ ] Dans sign-in.tsx: remplacer TODO par navigation vers verify-2fa
- [ ] Stocker temp_token dans state, envoyer avec code TOTP
- [ ] Gerer erreurs (code invalide, expire)
- [ ] Ajouter traductions 2FA dans 3 langues

### B.3 - Ajouter validation Zod sur formulaires
- [ ] Creer `modules/auth/validations/auth-schemas.ts` (login, 2fa)
- [ ] Creer `modules/inspections/validations/inspection-schemas.ts`
  - CreateInspection: license_id required, notes max 2000
  - MiseEnDemeure: obligation_ids min 1, deadline_hours 24-720
  - SealPropose: reason required, notes optional
  - SealApprove: approved boolean, notes required if rejected
  - FieldCollect: amount > 0 && <= 50M, phone regex if mobile_money
  - Complete: notes optional max 2000
- [ ] Integrer react-hook-form + zodResolver sur chaque formulaire

### B.4 - Formater i18n FR/EN
- [ ] Reformater `fr.json` en JSON structure (actuellement one-liner)
- [ ] Reformater `en.json` en JSON structure (actuellement one-liner)
- [ ] Verifier coherence des cles entre es/fr/en
- [ ] Ajouter cles manquantes identifiees en B.1

### B.5 - Ajouter endpoints manquants
- [ ] PDF download: `downloadReport`, `downloadMed`, `downloadSeal`
- [ ] Missions: 9 endpoints `/inspections/missions/*`
- [ ] Analytics: 6 endpoints `/inspections/analytics/*`
- [ ] Filter presets: CRUD `/inspections/filter-presets`
- [ ] Export: CSV + PDF `/inspections/export/*`
- [ ] Cron: `autoApproveSeals`

### B.6 - Fix GPS accuracy
- [ ] `use-location.ts`: `Accuracy.Balanced` → `Accuracy.High`
- [ ] Ajouter timeout GPS (15s max) avec fallback message
- [ ] Ajouter retry automatique si accuracy > 50m
- [ ] Afficher precision numerique (±Xm) dans UI

### B.7 - Implementer QR Code Scanner (P2)
**expo-camera v17 deja installe avec barcode scanning natif**
- [ ] Creer `modules/scanner/components/qr-scanner.tsx`
  - CameraView avec barcodeScannerSettings: ['qr']
  - Overlay visor (cadre de scan)
  - Torche toggle
  - Fallback saisie manuelle NIF/Registro
- [ ] Creer `modules/scanner/services/qr-parser.ts`
  - Parser URL verification: extraire LIC-XXXX-XXXXXXXX + lid
  - Valider format URL (taxasge.emacsah.com/verify/...)
  - Appeler endpoint verification avec les params extraits
- [ ] Integrer dans verify.tsx:
  - Bouton "Scanner QR" en haut (icone camera)
  - Modal fullscreen scanner
  - Auto-fill resultats apres scan reussi
- [ ] Ajouter dans dashboard quick-actions: "Scanner licence"
- [ ] Traductions 3 langues (scanner.*)
- [ ] Permission camera deja configuree dans app.json

### B.8 - Ajouter screen protection
- [ ] Copier `use-screen-protection.ts` depuis packages/mobile
- [ ] Integrer dans root _layout.tsx (blur on background)
- [ ] Tester avec app lock existant (pas de conflit)

### B.9 - Nettoyer placeholders
- [ ] Supprimer `app/inspection/index.tsx` (placeholder vide)
- [ ] Remplacer `app/supervisor/index.tsx` par message "Prochainement - P4"
  avec icone et description des fonctionnalites a venir

### B.10 - Auto-critique et verification
- [ ] TypeScript: zero erreurs (`npx tsc --noEmit`)
- [ ] Lint: zero erreurs critiques
- [ ] Verifier tous les imports (pas de circular deps)
- [ ] Verifier toutes les traductions (pas de cle manquante)
- [ ] Review securite OWASP (inputs sanitizes, pas d'injection)

---

## PLAN C : Test Integration Device (Validation P1-P3)

### C.1 - Tests Auth (P1)
- [ ] Login avec compte agent reel
- [ ] Login avec mauvais password → erreur claire
- [ ] 2FA flow complet (si agent a 2FA active)
- [ ] Biometric login (save + use)
- [ ] App lock apres 5min background
- [ ] Screen protection (blur)

### C.2 - Tests Dashboard (P1)
- [ ] Dashboard agent: stats affichees (meme a zero)
- [ ] Dashboard supervisor: live counters + alerts
- [ ] Pull to refresh fonctionne
- [ ] Quick actions navigent correctement

### C.3 - Tests Verification + QR (P2)
- [ ] Scanner QR d'une licence → auto-fill resultats
- [ ] Recherche par NIF → resultats corrects
- [ ] Recherche par N. Registro → resultats corrects
- [ ] Affichage obligations, MED active, historique
- [ ] Bouton "Demarrer Inspection" → creation

### C.4 - Tests Workflow Inspection (P3)
- [ ] Creer inspection depuis verification
- [ ] GPS capture automatique (precision affichee)
- [ ] Prendre photo camera
- [ ] Ajouter photo galerie
- [ ] Editer activite (conforme/non conforme)
- [ ] Auto-save (modifier notes, verifier sauvegarde)
- [ ] Completer avec signature canvas
- [ ] Emettre mise en demeure
- [ ] Proposer scelle (double confirmation)
- [ ] Collecter paiement (cash + mobile money)
- [ ] Liste inspections: scroll, filtre, recherche

---

## DECISION ARCHITECTURALE : Partage composants

### Statut: REPORTE POST-P4
**Raison**: On n'a jamais builde l'app. Creer packages/shared
avant d'avoir un build fonctionnel ajoute de la complexite inutile.

### Plan futur (P6 ou post-P6):
1. Creer `packages/shared/` avec core identique (api/client, errors, types, hooks)
2. Migrer progressivement mobile + inspector vers @shared/
3. Adopter approche securite MMKV d'inspector pour mobile
4. Tester builds EAS des 2 apps apres chaque migration

### Fichiers 100% identiques (candidats prioritaires):
- core/api/client.ts
- core/api/errors.ts
- core/hooks/use-network.ts
- components/ui/error-boundary.tsx

---

## DECISION : NFC Scanner

### Statut: NON IMPLEMENTE
**Raison**: Les licences commerciales sont des documents PDF/papier imprimes.
Pas de puce NFC. Le QR code est le seul identifiant scannable.
NFC sera reconsidere si/quand des cartes physiques NFC sont introduites.

---

## Ordre d'execution

1. **PLAN A** (bloquant) → Build fonctionnel
2. **PLAN B.1** (strings) → Qualite i18n
3. **PLAN B.4** (format FR/EN) → Maintenabilite
4. **PLAN B.2** (2FA) → Securite
5. **PLAN B.3** (Zod) → Robustesse formulaires
6. **PLAN B.5** (endpoints) → Completude API
7. **PLAN B.6** (GPS) → Precision legale
8. **PLAN B.7** (QR Scanner) → Feature critique
9. **PLAN B.8** (screen protection) → Securite
10. **PLAN B.9** (placeholders) → Nettoyage
11. **PLAN B.10** (auto-critique) → Verification
12. **PLAN C** (tests device) → Validation finale
