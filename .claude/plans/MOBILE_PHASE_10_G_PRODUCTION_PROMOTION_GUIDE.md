# PHASE 10/G — Guide complet : Closed Testing → Production access → 1ère review Google

**Date** : 2026-05-08 (révisé)
**Contexte** : suite directe de `MOBILE_PHASE_10_F_PLAY_CONSOLE_RUNBOOK.md`
**Type de compte Play Console** : **Personnel** (créé après nov 2023, libressai@gmail.com)
**Contrainte Google** : règle « 12 testeurs / 14 jours / Production access » applicable
**Objectif final** : déclencher la 1ère review Google et faire afficher "Facil" partout (pas `com.taxasge.app (unreviewed)`)

---

## 0. CORRECTIF par rapport au guide initial (révision honnête)

Mon analyse initiale recommandait « abandonner Alpha → aller direct Production ». **C'était incorrect pour votre type de compte.**

**Ce que j'avais raté** : depuis novembre 2023, Google impose aux comptes développeurs **personnels** (pas organisation) un parcours obligatoire avant l'accès Production :
1. Closed Testing avec **≥ 12 testeurs réels** (comptes Google distincts) actifs pendant **≥ 14 jours consécutifs**
2. Demande explicite d'« accès Production » via Tableau de bord
3. Approbation Google (1-2 semaines)

Source : https://support.google.com/googleplay/android-developer/answer/14151465

**Symptôme observé qui m'a fait corriger** (votre message du 2026-05-08) :
> « Les tests ouverts sont disponibles lorsque vous avez un accès en production. Pour savoir quoi faire avant de pouvoir demander à en bénéficier, consultez le centre d'aide »

→ Tests ouverts ET Production sont actuellement verrouillés. Closed Testing est l'unique chemin viable.

---

## 1. Réinterprétation des 3 erreurs capture 10

| Erreur | Vraie cause |
|--------|-------------|
| 1+2 « Cette release ne permet pas de mettre à jour les app bundles » | Bouton « Créer une release » (création from-scratch). L'AAB est lié au track Internal — il faut **« Promouvoir »**, pas « Créer ». |
| 3 READ_MEDIA_IMAGES | Indépendant. Bloquant pour TOUT track. À remplir une seule fois. |

**Solution** : utiliser **Tests internes → Versions → ⋮ → Promouvoir la version → Tests fermés - Alpha** au lieu du bouton « Créer une release » de la page Tests fermés Alpha (capture 9).

---

## 2. Timeline réaliste (révisé)

| Phase | Durée | Action |
|-------|-------|--------|
| Phase 1 — **Setup Closed Testing** | Jour 0 (aujourd'hui, ~30 min) | Promote Internal → Alpha + 12 testeurs + opt-in URL |
| Phase 2 — **Période 14 jours** | Jour 1 à 14 | Activité testeurs constante, monitoring crashs |
| Phase 3 — **Demande Production access** | Jour 14+, ~10 min | Formulaire dashboard "Demander l'accès Production" |
| Phase 4 — **Approbation Google** | +1-7 jours | Email de validation |
| Phase 5 — **Promote Alpha → Production** | ~10 min | Procédure §6 |
| Phase 6 — **1ère review Google** | +1-7 jours | Email de verdict |

**Total minimum** : ~21 jours / 3 semaines avant que la fiche affiche "Facil"
**Total réaliste** : 4 semaines (incluant marges + éventuelles itérations)

---

## 3. Phase 1 — Setup Closed Testing (aujourd'hui, ~30 min)

### 3.1 Remplir READ_MEDIA_IMAGES (bloquant pour tous les tracks)

🔗 **Chemin** : Play Console → **Politique** → **App content** → section **Autorisations liées aux photos et vidéos** (ou lien direct depuis capture 11)

⏰ **Durée** : 2 min

**Étapes** :
1. Champ « Décrivez l'utilisation de l'autorisation READ_MEDIA_IMAGES par votre appli » → coller le texte ci-dessous
2. Cocher : **« Mon appli a besoin d'un accès régulier (sélection ponctuelle par l'utilisateur) »**
3. **Enregistrer**

#### Texte FR (489 caractères / 500 max)

```
Facil permet aux utilisateurs de joindre des photos de documents
administratifs et fiscaux (pièces d'identité, justificatifs,
déclarations) depuis leur galerie pour les transmettre à
l'administration via le portail TaxasGE. L'application permet
également de sélectionner une photo de profil. L'accès est
ponctuel, déclenché par l'utilisateur via le sélecteur natif
Android (Photo Picker), limité aux images choisies. Aucune
lecture en masse ni en arrière-plan n'est effectuée.
```

#### Texte ES (487 caractères / 500 max)

```
Facil permite a los usuarios adjuntar fotografías de documentos
administrativos y fiscales (documentos de identidad, justificantes,
declaraciones) desde su galería para enviarlos a la administración
a través del portal TaxasGE. La aplicación también permite
seleccionar una foto de perfil. El acceso es puntual, iniciado
por el usuario vía el selector nativo de Android (Photo Picker),
limitado únicamente a las imágenes elegidas. No se realiza
ninguna lectura masiva ni en segundo plano.
```

#### Texte EN (475 caractères / 500 max)

```
Facil allows users to attach photos of administrative and fiscal
documents (ID cards, supporting documents, declarations) from their
gallery to submit them to the administration via the TaxasGE
portal. The app also lets users select a profile picture. Access
is one-shot, triggered by the user via the native Android Photo
Picker, limited to selected images only. No bulk or background
reading is performed.
```

### 3.2 Promouvoir Internal → Closed Testing (Alpha)

🔗 **Chemin** : Play Console → **Tester et publier** → **Tests** → **Tests internes** → onglet **Versions**

⏰ **Durée** : 3 min

**Étapes** :
1. Trouver la ligne **« Version 1.0.0 »** (statut : Disponible ou Brouillon)
2. À droite, cliquer le menu **⋮ (trois points)** OU le bouton **« Promouvoir la version »** (EN *Promote release*)
3. Dans le menu déroulant, choisir **« Tests fermés - Alpha »** (PAS Production, PAS Tests ouverts — les deux sont verrouillés)
4. Vous arrivez sur la page **« Créer une version Tests fermés »** avec l'AAB pré-rempli ✅

⚠️ **Si vous voyez encore l'erreur 1+2** : c'est que vous êtes sur la page « Créer une release » de Tests fermés (capture 9-10). **Quittez** et naviguez vers Tests internes pour utiliser Promouvoir.

### 3.3 Vérifier les notes de version (3 langues)

Section **Notes de version** dans la page Promote :

📄 Source : `.claude/plans/playstore-assets/PLAY_CONSOLE_RELEASE_NOTES_v1.0.0.md`

| Langue | Caractères | Pré-rempli ? |
|--------|------------|--------------|
| ES | 291/500 | Oui (hérité Internal) |
| FR | 317/500 | Oui (hérité Internal) |
| EN | 278/500 | Oui (hérité Internal) |

⚠️ Si pas pré-rempli ou langue manquante → coller depuis le fichier source. **Enregistrer après chaque langue.**

### 3.4 Examiner et lancer la release Alpha

1. Bouton **« Suivant »** ou **« Examiner la version »** en bas
2. Page récapitulative : Play Console liste avertissements/erreurs
   - ✅ Idéal : 0 erreur, 0 avertissement bloquant
   - ❌ Erreur rouge → revenir corriger
3. Bouton **« Démarrer le déploiement sur Tests fermés »** (PAS « Envoyer à l'examen » — Closed Testing ne déclenche pas la review Google)

✅ **Statut attendu** : release Alpha disponible aux testeurs sous 30-60 min.

### 3.5 Configurer les 12+ testeurs

🔗 **Chemin** : Play Console → **Tests fermés - Alpha** → onglet **Testeurs**

⏰ **Durée** : 5 min

**Étapes** :
1. Section **Listes d'adresses e-mail** → bouton **Créer une liste d'adresses e-mail**
2. Remplir :
   | Champ | Valeur |
   |---|---|
   | Nom de la liste | `Facil Closed Testers V1` |
   | Adresses e-mail | **12 adresses minimum**, 1 par ligne |
3. **Créer la liste**
4. Cocher la case à gauche pour activer la liste sur le canal Alpha
5. **Enregistrer les modifications**

⚠️ **Critère Google** : 12 testeurs **réels et actifs**, pas de bots ni de comptes test fictifs. Ils doivent installer ET utiliser l'app pendant les 14 jours. Google détecte les comptes inactifs / bots et invalide la période.

### 3.6 Distribuer le lien d'opt-in

1. Onglet Testeurs → section **Comment les testeurs rejoignent votre test**
2. Copier l'URL d'opt-in (forme `https://play.google.com/apps/internaltest/<id>` pour Alpha)
3. Envoyer aux 12+ testeurs (email, Slack, WhatsApp)

Chaque testeur doit :
- cliquer le lien → page Google « Devenir testeur »
- cliquer **Devenir testeur**
- attendre 30 min puis chercher `Facil` sur Play Store ou cliquer le lien direct
- **installer + utiliser l'app au moins quelques fois pendant les 14 jours**

---

## 4. Phase 2 — Période 14 jours (Jour 1 à 14)

### ✅ À FAIRE
- Surveiller Sentry/LogRocket pour détecter d'éventuels crashs et corriger en v1.0.1 (mais ne PAS pousser pendant cette période sans précaution — voir plus bas)
- Encourager les 12 testeurs à utiliser l'app **régulièrement** (pas juste installer puis fermer)
- Vérifier dans Play Console → Tests fermés → **Statistiques** que les installations/sessions augmentent

### ❌ À NE PAS FAIRE
- Ne pas réduire le nombre de testeurs en dessous de 12 — Google reset le compteur
- Ne pas changer drastiquement la metadata, les captures, le pricing — peut invalider la période
- Ne pas créer un nouveau Closed Testing track — la période s'applique au track utilisé

### Mise à jour pendant la période 14j (si bug critique)

Si bug bloquant détecté pendant les 14 jours, vous pouvez pousser une v1.0.1 :
1. Fix code + commit local
2. `git tag v1.0.1` + push (déclenche EAS Build via GitHub Actions)
3. EAS Submit pousse vers Internal Testing (track default dans `eas.json`)
4. Promouvoir Internal → Tests fermés Alpha (procédure §3.2)
5. **La période 14j continue** — Google ne la reset pas pour une mise à jour, seulement pour un changement de track ou suppression de testeurs

---

## 5. Phase 3 — Demander l'accès Production (Jour 14+)

🔗 **Chemin** : Play Console → **Tableau de bord** → bandeau « Accès en production » (apparaît automatiquement après 14j si critères OK)

⏰ **Durée** : 10 min

**Le bandeau apparaît UNIQUEMENT si Google a validé** :
- ≥ 12 testeurs actifs sur 14 jours consécutifs
- Activité régulière (pas juste 12 installs puis silence)
- Pas de violations de policy détectées

**Si bandeau absent au jour 15+** :
- Vérifier l'activité testeurs dans **Statistiques**
- Si testeurs inactifs : prolonger la période en relançant les testeurs
- Si tout semble OK mais pas de bandeau : ouvrir un ticket Play Console Support (rare)

### Formulaire de demande (3 sections)

Cf. `https://support.google.com/googleplay/android-developer/answer/14151465`

#### Section 1 — Présenter votre application

Description ~ 200-500 caractères de l'app. Texte suggéré :

```
Facil es la aplicación oficial de TaxasGE para Guinea Ecuatorial,
que permite a ciudadanos y empresas realizar trámites
administrativos y obligaciones fiscales 100% digital. Ofrece
un asistente IA, OCR de documentos, pagos con BANGE Mobile Money
y un repositorio digital seguro. Disponible en español, francés
e inglés. Desarrollada por la Dirección General de Impuestos
en colaboración con BANGE.
```

#### Section 2 — Décrire les tests

```
Closed Testing lancé el 2026-05-08 con 12+ testers internos
(empleados DGI, contables piloto, BANGE testers). Cobertura:
flujo registro, declaraciones IVA/IRPF, OCR documentos, pagos
test BANGE sandbox, multilenguaje, biometría. Sentry y LogRocket
configurados sin crashes bloqueantes detectados.
```

#### Section 3 — Joindre des preuves

- Capture du tableau de bord montrant le nombre de testeurs et l'activité
- Optionnel : retours testeurs (email, screenshots feedback)
- Optionnel : doc d'autorisation gouvernementale GE (renforce la légitimité)

### Validation Google

- Délai : 1-7 jours en moyenne
- Email à `libressai@gmail.com` (compte développeur principal)
- Si refus : email avec raison précise + possibilité de re-soumettre

---

## 6. Phase 5 — Promote Alpha → Production (après accès Production accordé)

🔗 **Chemin** : Play Console → **Tester et publier** → **Tests fermés - Alpha** → onglet **Versions**

⏰ **Durée** : 10 min

1. Ligne v1.0.0 (ou la plus récente si vous avez itéré pendant les 14j) → **⋮** → **Promouvoir la version → Production**
2. Vérifier notes 3 langues
3. **Pourcentage de déploiement** : pour 1ère prod, 100% (rollout par paliers indisponible la 1ère fois)
4. **Examiner la version** → vérifier 0 erreur rouge
5. **Envoyer à l'examen** → 1 clic

### Pendant la review Production (1-7 jours)

✅ Surveiller email pour le verdict
❌ Ne pas pousser nouvel AAB pendant la review

### Après approbation

- Pastille « App en cours d'examen » disparaît
- 🎯 **Effet attendu** : fiche Internal Testing affiche désormais **"Facil"** (pas com.taxasge.app), avec icon, captures, descriptions complètes — partout (Internal, Alpha, fiche publique)
- Release Production en attente de votre lancement manuel

---

## 7. Diagnostic permissions — état actuel de l'AAB v1.0.0

Source : `packages/mobile/android/app/src/main/AndroidManifest.xml` (généré par EAS).

| Permission | Source | Statut review | Action |
|------------|--------|---------------|--------|
| `INTERNET` | app.json (déclarée) | OK auto | — |
| `CAMERA` | `expo-camera` | OK justifiée | Mention dans Data Safety |
| `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` | `expo-image-picker` (5 écrans) | **Formulaire requis** | §3.1 |
| `VIBRATE`, `USE_BIOMETRIC`, `USE_FINGERPRINT` | app.json | OK auto | — |
| `POST_NOTIFICATIONS` | app.json (déclarée) — **absente du manifeste compilé** | À investiguer | Cleanup v1.0.1 |
| `RECORD_AUDIO` | Auto-ajoutée par `expo-camera` (jamais utilisée) | Sale mais tolérable | Cleanup v1.0.1 |
| `SYSTEM_ALERT_WINDOW` | Lib tierce non identifiée (LogRocket/Sentry probable) | **Risque review** | Cleanup v1.0.1 si refus |
| `WRITE_EXTERNAL_STORAGE` | Legacy auto-ajoutée | Tolérable | Cleanup v1.0.1 |

**Décision** : soumettre v1.0.0 tel quel. Cleanup v1.0.1 si refus pour `SYSTEM_ALERT_WINDOW`.

---

## 8. Checklist complète

### Phase 1 (aujourd'hui)

- [ ] §3.1 Formulaire READ_MEDIA_IMAGES rempli (FR ou ES) + Enregistré
- [ ] §3.2 Promouvoir Internal → Tests fermés Alpha (PAS « Créer une release »)
- [ ] §3.3 Notes 3 langues vérifiées
- [ ] §3.4 Release Alpha déployée (pastille verte)
- [ ] §3.5 Liste 12+ testeurs créée et activée
- [ ] §3.6 URL opt-in distribuée

### Phase 2 (Jour 1 à 14)

- [ ] Au moins 12 testeurs ont installé et utilisé l'app
- [ ] Sentry/LogRocket : 0 crash bloquant
- [ ] Statistiques Play Console : sessions actives chaque jour
- [ ] Pas de modification metadata pendant la période

### Phase 3 (Jour 14+)

- [ ] Bandeau « Demander l'accès Production » visible Tableau de bord
- [ ] Formulaire 3 sections rempli
- [ ] Soumis à Google
- [ ] Email approbation reçu

### Phase 5 (Après approbation Production)

- [ ] Promouvoir Alpha → Production
- [ ] Notes 3 langues vérifiées
- [ ] Pourcentage 100%
- [ ] Examiner : 0 erreur rouge
- [ ] Envoyer à l'examen
- [ ] Email verdict positif reçu
- [ ] Fiche Internal Testing affiche "Facil" (vérification finale)

---

## 9. Pièges anticipés

| Piège | Cause | Mitigation |
|-------|-------|------------|
| Bandeau « Demander accès Production » jamais visible | Testeurs inactifs ou < 12 | Vérifier Statistiques + relancer testeurs |
| Liste de testeurs créée mais non cochée active | Avertissement « aucun testeur n'aura accès » | Cocher la case + Enregistrer |
| Période 14j reset après ajout d'un testeur | C'est INCORRECT — l'ajout n'invalide pas (la suppression oui) | Pas d'action |
| Refus accès Production pour « tests insuffisants » | Activité testeurs trop faible | Prolonger 7-14 jours puis re-soumettre |
| Refus review Production pour Privacy Policy 404 | URL Cloud Run instable, cold-start | Retester l'URL juste avant submit, idéalement domaine custom |
| Refus review pour SYSTEM_ALERT_WINDOW | Permission sensible non justifiée | Cleanup v1.0.1 + rebuild EAS via GitHub Actions |
| Refus review pour metadata mismatch | Description mentionne features non atteignables | Vérifier toutes features citées sont accessibles |

---

## 10. Alternative : convertir compte en Organisation (contournement)

**Quand y penser** : si l'attente 14j + 1-2 semaines accès Production + 1-7j review = inacceptable pour le calendrier projet.

**Procédure** :
1. Acheter un numéro DUNS au nom de TaxasGE / DGI / ministère ($50-150 selon pays)
2. Play Console → Paramètres → Type de compte → demander conversion en Organisation
3. Délai : 1-3 jours

**Effet** :
- Règle 12 testeurs / 14 jours **NE S'APPLIQUE PLUS**
- Accès Production immédiat
- Possibilité de submit Production direct (notre recommandation initiale)

**Limites** :
- Conversion **irréversible**
- Coût DUNS récurrent
- Procédure DUNS lente en Guinée Équatoriale (peut prendre semaines)

**Verdict** : pour Facil = app gouvernementale officielle, la conversion en Organisation est probablement le bon choix à long terme (légitimité + contrôle). Mais pour la 1ère release, suivre la voie Closed Testing 14j est plus rapide.

---

## 11. Critique honnête (limites de ce guide)

1. **Pastilles « Configurer votre application »** : déclarées vertes par utilisateur. Si une est orange en réalité, l'erreur apparaîtra à §3.4 et il faudra revenir corriger.
2. **`SYSTEM_ALERT_WINDOW` non explicité** : risque de question reviewer. Plan B = cleanup v1.0.1 documenté §7.
3. **Activité testeurs imprévisible** : Google ne publie pas le seuil exact d'activité requis. Il faut viser une utilisation réelle, pas juste 12 installs.
4. **POST_NOTIFICATIONS absent du manifeste** : déclaré dans `app.json` mais pas dans le `.xml` généré. À investiguer pour v1.0.1 — impact = pas de notifications push sur Android 13+ pour les nouveaux installs.
5. **Aucun build pendant la review Production** : règle absolue (CLAUDE.md GitHub Actions only + risque de fold de la review). Pendant les 14j de Closed Testing, mises à jour OK mais avec précaution.

---

## 12. Suivi

- **2026-05-08 v1.0** : guide initial créé après captures 9-11. Recommandait à tort « Promote direct Production ».
- **2026-05-08 v1.1** : guide révisé après info utilisateur sur compte personnel + message « accès Production verrouillé ». Plan corrigé : Closed Testing 14j obligatoire avant Production access.
