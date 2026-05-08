# PHASE 10/H — Endoff session 2026-05-08 : Refus Google Play "Government services" → repositionnement Facil

**Date session** : 2026-05-08
**Branche** : `develop`
**Dernier commit** : `bd4233a0` — `fix(legal): reposition Facil as independent service (Play Store compliance)`
**Statut global** : push effectué, déploiement GitHub Actions en attente de vérification, re-soumission Play Console non encore initiée

---

## 1. Contexte d'entrée de session

L'utilisateur reprenait après interruption de session précédente. État initial :

- App Facil v1.0.0 (versionCode 9) déployée sur **Tests internes Play Console**
- Fiche affiche `com.taxasge.app (unreviewed)` au lieu de "Facil"
- Goal initial : déclencher la 1ère review Google pour débloquer l'affichage de la fiche
- L'utilisateur naviguait dans **Tests fermés - Alpha** (capture 9) avec les tâches 2/4 effectuées

Premières erreurs observées (capture 10) :
1. « Vous ne pouvez pas déployer cette release, car elle ne permet à aucun utilisateur actuel d'effectuer une mise à jour vers les app bundles ajoutés »
2. « Cette release ne permet pas d'ajouter ni de supprimer des app bundles »
3. « Tous les développeurs doivent indiquer pourquoi leur appli accède aux photos » (READ_MEDIA_IMAGES)

---

## 2. Pivots stratégiques de la session (chronologique)

### Pivot 1 — Mauvaise lecture initiale : "abandon Alpha → Production"

**Recommandation initiale incorrecte** : aller direct Production via Promote depuis Internal.

**Erreur d'analyse** : non-prise en compte du type de compte (personnel post-Nov 2023).

**Correction** après l'utilisateur a partagé le message « Les tests ouverts sont disponibles lorsque vous avez un accès en production » + lien `support.google.com/.../answer/14151465`.

**Vraie règle** : compte personnel post-Nov 2023 = obligation Closed Testing avec **≥ 12 testeurs / 14 jours consécutifs** AVANT de pouvoir demander l'accès Production.

### Pivot 2 — Brouillon orpheline bloquante

L'utilisateur avait cliqué « Créer une release » sur Tests fermés Alpha (capture 9) → brouillon vide créée → bloque toute action ultérieure (errors 1+2 récurrents).

**Fix appliqué par l'utilisateur** : supprimer la brouillon + utiliser correctement « Promouvoir » depuis Tests internes.

**Résultat** : il a ensuite progressé jusqu'à soumettre à la review Google.

### Pivot 3 — Refus Google "Government services policy"

Email Google reçu :
> *Your app is not compliant with the Play Console Requirements policy. Some types of apps can only be distributed by organizations.*
> *Issue area: Developer Account*
> *Government apps, including apps developed by or on behalf of a government agency.*

**Cause structurelle identifiée** : compte personnel + app classée comme government services = blocage policy `Play Console Requirements` (https://support.google.com/googleplay/android-developer/answer/10788890).

**Mise au point importante** : l'utilisateur a clarifié qu'il est **seul développeur sans appui institutionnel** (DGI / ministère / BANGE), et que la mention "operada por la DGI" était aspirationnelle/marketing, pas factuelle. Décision : repositionner Facil comme service indépendant (voie A).

### Pivot 4 — Mauvaise hypothèse "11 testeurs au lieu de 12"

L'utilisateur a brièvement supposé que le refus venait d'un manque de testeurs (11 vs 12 requis). **Hypothèse rejetée** : le refus mentionne explicitement « Issue area: Developer Account », pas le nombre de testeurs. Les deux règles (12 testeurs + Government policy) sont distinctes ; la règle Government est appliquée en premier et bloque tout.

---

## 3. Actions accomplies — détail technique

### 3.1 Commit `bd4233a0` (pushé vers develop)

**Fichiers modifiés** : 3
- `packages/web/messages/es.json` (28+/28-)
- `packages/web/messages/fr.json` (28+/28-)
- `packages/web/messages/en.json` (28+/28-)

**Sections réécrites** :

#### `legalPages.privacy.*` — 8 champs / 3 langues

| Champ | Avant | Après |
|-------|-------|-------|
| `lastUpdated` | "marzo 2026" | "mayo 2026" |
| `intro` | « operada por la Dirección General de Impuestos » | « servicio digital independiente. Facil no es operada por ninguna administración pública » |
| `dataCollectedContent` | « según el trámite solicitado » | « al preparar una declaración o solicitud » |
| `purposeContent` | « Comunicaciones oficiales relativas a sus trámites » | « comunicaciones operativas relacionadas con su cuenta » |
| `legalBasisContent` | « cumplimiento de obligaciones legales tributarias establecidas por la legislación de Guinea Ecuatorial » | « consentimiento del usuario, ejecución del contrato, interés legítimo de Facil » |
| `retentionContent` | « obligaciones fiscales (mínimo 5 años) » | « cuenta activa, eliminación 30 días tras baja, logs op. hasta 5 años » |
| `sharingContent` | « Ministerios y organismos gubernamentales competentes » | « entidades destinatarias de un trámite, cuando usted decide enviar » |
| `contactContent` | « Dirección General de Impuestos, Malabo » | « facilege26@gmail.com » |

#### `legalPages.terms.*` — 7 champs / 3 langues

| Champ | Avant | Après |
|-------|-------|-------|
| `lastUpdated` | "marzo 2026" | "mayo 2026" |
| `intro` | « servicios digitales de la administración fiscal de Guinea Ecuatorial » | « servicios digitales ofrecidos por la plataforma » |
| `servicesContent` | « Facil proporciona servicios digitales de administración fiscal » | « Facil pone a su disposición herramientas digitales para ayudarle » + disclaimer « Facil actúa como herramienta de asistencia. Las decisiones administrativas... corresponden a las entidades competentes » |
| `obligationsContent` | « Cumplir con las obligaciones fiscales establecidas por la ley » | « Cumplir con sus propias obligaciones fiscales establecidas por la ley aplicable » |
| `intellectualPropertyContent` | « propiedad de la República de Guinea Ecuatorial » | « propiedad de Facil y de sus licenciantes » |
| `limitationsContent` | « La administración no será responsable » | « Facil no será responsable » + ajout « Facil no sustituye el asesoramiento fiscal profesional » |

### 3.2 Fichiers de plan créés

- `.claude/plans/MOBILE_PHASE_10_G_PRODUCTION_PROMOTION_GUIDE.md` (354 lignes)
  - Guide complet Closed Testing 14j → Demande Production access → 1ère review Google
  - Inclut 3 langues du texte READ_MEDIA_IMAGES (FR/ES/EN)
  - Diagnostic permissions AAB (RECORD_AUDIO, SYSTEM_ALERT_WINDOW à cleanup en v1.0.1)
  - 4 voies stratégiques détaillées (A: sanitize, B: org perso, C: sponsor inst, D: PWA web)
  - Pièges anticipés + checklist + critique honnête

- `.claude/plans/MOBILE_PHASE_10_H_GOV_REJECTION_ENDOFF.md` (ce document)

### 3.3 Tasks fermées

- #5 Investiguer raison refus Google ✅
- #6 Évaluer hypothèse "Government services" ✅
- #7 Préparer plan remédiation ✅
- #8 Décision stratégique positionnement Facil ✅
- #9 Réécrire privacy (3 langues) ✅
- #10 Réécrire terms (3 langues) ✅

---

## 4. État final — Statut par axe

| Axe | Statut | Notes |
|-----|--------|-------|
| Compréhension cause refus | ✅ Confirmé | Government services policy + Developer Account |
| Décision stratégique | ✅ Voie A choisie | Sanitize web pages avant essai re-soumission |
| Privacy policy 3 langues | ✅ Réécrite + pushée | Commit bd4233a0 |
| Terms of use 3 langues | ✅ Réécrites + pushées | Commit bd4233a0 |
| Government apps declaration Play Console | ✅ Décochée par user | Action utilisateur indépendante |
| GitHub Actions deploy frontend | ⏳ En cours | Push fait, à surveiller (~10-15 min) |
| Vérification URLs live (3 lang × 2 pages) | ⏳ À faire | Après deploy vert |
| Re-soumission Play Console + note reviewer | ⏳ À faire | Après vérification URLs |
| Verdict Google round 2 | ⏳ Attente | 1-7 jours après re-soumission |

---

## 5. Risques résiduels (non couverts par le commit)

### Risque #1 — Description Play Store saturée de marqueurs gov (CRITIQUE)

`.claude/plans/playstore-assets/PLAY_CONSOLE_DESCRIPTIONS.md` contient :
- « INSTANCIA OFICIAL »
- Liste explicite de 11 entités gouvernementales (DGI, CNEDOGE, DGT, Extranjería, Ayuntamiento, Cámara de Comercio, Tesoro Público, MINFP, ITV, ONRC, OFIVE)
- « 873 servicios distribuidos en 21 ministerios »
- Services régaliens explicites (passeports, DIP, permis de conduire, IRPF)
- Mention BANGE Mobile Money (banque d'État)

**Si reviewer Google ouvre la fiche Play et lit cette description → refus à nouveau quasi-certain**, même avec privacy + terms corrigés.

**Action si refus persistant** : réécrire `PLAY_CONSOLE_DESCRIPTIONS.md` en mode framework + assistance, retirer mentions ministères nominales, mettre à jour la fiche directement dans Play Console.

### Risque #2 — Page account-deletion non touchée

`packages/web/messages/{es,fr,en}.json` — section `legalPages.accountDeletion.*` contient encore :
- `retainedTitle` : « Datos conservados (obligaciones legales) »
- `retained.fiscalRecords` : « Declaraciones fiscales y obligaciones tributarias presentadas (mínimo 5 años, art. 73 LGT) »
- `legalContent` : « legislación fiscal de la República de Guinea Ecuatorial » + « responsable del tratamiento es la entidad operadora de Facil »

**Action si refus persistant** : appliquer même logique de neutralisation (positionner conservation comme obligation utilisateur, pas Facil).

### Risque #3 — App content (UI) elle-même inchangée

Modules backend + UI mobile contiennent toujours :
- Logos / branding officiels DGI / TaxasGE
- Modules de déclaration IRPF / IVA / Sociedades (services régaliens)
- Workflows pour passeports, DIP, permis de conduire
- Intégration BANGE Mobile Money

**Si reviewer Google lance l'app et explore l'UI**, il verra clairement un service gov. Aucune réécriture de copie web ne peut masquer ce fait. Voir voie B/C/D du guide G pour solutions structurelles.

### Risque #4 — Permissions AAB non cleanées

AndroidManifest généré contient (voir guide G §7) :
- `RECORD_AUDIO` (auto par expo-camera, jamais utilisé)
- `SYSTEM_ALERT_WINDOW` (lib tierce non identifiée, permission sensible)
- `WRITE_EXTERNAL_STORAGE` (legacy)
- `POST_NOTIFICATIONS` déclaré dans app.json mais ABSENT du manifeste compilé (impacts notifications Android 13+)

**Action si nouveau build** : audit + cleanup en v1.0.1 via plugin Expo `with-android-manifest-cleanup`.

---

## 6. Décisions stratégiques en suspens (si voie A échoue)

Détail complet dans `.claude/plans/MOBILE_PHASE_10_G_PRODUCTION_PROMOTION_GUIDE.md` §10 et tableau de la session 2026-05-08.

| Voie | Action | Délai | Coût | Réalisme |
|------|--------|-------|------|----------|
| **A (en cours)** | Sanitize description + privacy + terms + Government decl off | 7-14j | 0 € | 30-40% (en cours de test) |
| **B** | Créer compte Organisation au nom personnel + DUNS GE | 4-8 sem | $50-150 + frais | 50-60% (pas garanti car Google peut demander preuve mandat gov) |
| **C** | Sponsor institutionnel (DGI / ministère / BANGE) | 2-6 mois | Variable | 90% si entité accepte, 0% sinon |
| **D** | Abandon Play Store, PWA web only | Immédiat | 0 € | 100% mais perte distribution mobile native |

**Recommandation experte** :
- Court terme : voie A (en cours)
- Moyen terme : combinaison D (déployer maintenant pour utilisateurs) + C (négo institutionnelle parallèle)
- Voie B comme compromis si urgence et fonds disponibles

---

## 7. Boot prompt pour next session

À copier-coller en début de prochaine session :

```
Reprends la session post-rejection Google Play "Government services" sur
compte personnel Facil. Last commit develop: bd4233a0 (fix(legal): reposition
Facil as independent service).

Contexte complet: .claude/plans/MOBILE_PHASE_10_H_GOV_REJECTION_ENDOFF.md
Guide processus: .claude/plans/MOBILE_PHASE_10_G_PRODUCTION_PROMOTION_GUIDE.md

Vérifier en priorité (workflow user-driven):
1. GitHub Actions web deploy passé au vert?
2. URLs live affichent les nouveaux textes (privacy + terms FR/ES/EN)?
3. Re-soumission Play Console envoyée avec note reviewer?
4. Verdict Google round 2 reçu?

Si verdict positif: continuer Closed Testing 14j puis demande Production access.
Si verdict négatif: appliquer plan B selon raison citée:
- Si description Play Store: réécrire PLAY_CONSOLE_DESCRIPTIONS.md
- Si /legal/account-deletion: réécrire legalPages.accountDeletion.*
- Si UI app: choisir voie B/C/D du guide G §10
```

---

## 8. Checklist de reprise

À cocher dans l'ordre lors de la reprise :

- [ ] Vérifier `gh run list --branch develop --limit 5` — workflow web deploy à OK
- [ ] Ouvrir `https://taxasge.emacsah.com/es/legal/privacy` (hard refresh) — vérifier intro = "servicio digital independiente"
- [ ] Idem `/fr/legal/privacy` et `/en/legal/privacy`
- [ ] Ouvrir `/es/legal/terms` — vérifier intro = "servicios digitales ofrecidos por la plataforma" + intellectualProperty = "propiedad de Facil"
- [ ] Idem terms FR + EN
- [ ] Vérifier date affichée = "mayo 2026" / "mai 2026" / "May 2026" partout
- [ ] Aller Play Console → Notifications ou Politique → identifier bouton "Demander un nouvel examen" / Appeal / Re-submit
- [ ] Coller la note reviewer fournie par Claude (voir guide G §6)
- [ ] Re-soumettre
- [ ] Surveiller `kouemou.sah@gmail.com` pour verdict Google round 2 (1-7j)
- [ ] Si verdict positif → continuer Closed Testing 14j (12 testeurs déjà OK)
- [ ] Si verdict négatif → identifier raison citée → appliquer plan B correspondant

---

## 9. Limites & critique honnête de cette session

1. **Erreur initiale d'analyse** : recommandation "Promouvoir direct Production" sans demander le type de compte. Coût = 1 cycle de soumission gaspillé + confusion utilisateur. Leçon : **toujours demander type de compte avant tout conseil Play Store**.

2. **Voie A choisie est la plus risquée** : 30-40% de chances de succès. Probable refus 2 si description Play Store + UI app + account-deletion non touchés. L'utilisateur le savait, choix conscient pour éviter rebuild.

3. **Patches privacy + terms partiels** : on a corrigé les pages web mais la description Play Store (saturée de marqueurs gov) n'a pas été touchée. Si reviewer la lit → refus à nouveau. Choix utilisateur de tester d'abord avec privacy seule.

4. **Pas de validation pré-push** : pas de visite manuelle des URLs avant push (deploy en cours = pas encore live), pas de relecture humaine des textes par un ES native speaker. Risque de typo ou nuance manquée.

5. **AAB v1.0.0 inchangé** : aucun cleanup permissions (`SYSTEM_ALERT_WINDOW`, `RECORD_AUDIO`) — peut déclencher refus séparé si reviewer audit permissions.

6. **Long terme non planifié** : voie C (sponsor institutionnel) est probablement le seul chemin propre pour Facil, mais aucune action concrète vers DGI/ministère/BANGE n'a été initiée. Voie A est tactique, pas stratégique.

---

## 10. Suivi

- **2026-05-08 v1.0** : endoff créé suite demande utilisateur "redige le endoff de cette session et enregistre". Session complète : 2 pivots stratégiques majeurs, 1 commit (bd4233a0) pushé, 2 plans créés (G et H). 6 tasks complétées.

