# Phase 10 — Guide d'actions manuelles utilisateur

**Date** : 2026-05-02
**Pour** : `kouemou.sah@gmail.com` (compte Google Play Console + GCP)
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`

> Ce document liste TOUTES les actions que toi (user) dois faire manuellement
> en dehors du code (consoles GCP/Play, signatures de docs, etc.) pour mener
> Phase 10 jusqu'à la publication. Chaque action est numérotée + horodatée
> pour pouvoir cocher au fur et à mesure.

---

## A — Avant de pouvoir builder l'AAB production (Phase F)

### A.1 — Créer la fiche app sur Google Play Console (UNE FOIS)

⏰ **Quand** : maintenant ou à n'importe quel moment avant Phase F
⏱️ **Durée** : 5 min
🔗 **URL** : https://play.google.com/console

**Étapes** :
1. Login avec `kouemou.sah@gmail.com`
2. **All apps** → bouton **Create app** (en haut à droite)
3. Remplir le formulaire :
   | Champ | Valeur |
   |-------|--------|
   | App name | `Facil` |
   | Default language | `Spanish – es-ES` |
   | App or game | `App` |
   | Free or paid | `Free` |
   | Declarations | cocher les 3 cases (developer programs policies, US export laws, content guidelines) |
4. Click **Create app**

⚠️ **Important** : le package name `com.taxasge.app` n'est demandé QU'AU PREMIER UPLOAD AAB. Pas besoin de le saisir maintenant — il sera inféré du fichier AAB.

✅ **Coche quand fait** : `[ ]`

---

### A.2 — Inviter le service account `play-publisher` (CRITIQUE)

⏰ **Quand** : juste après A.1
⏱️ **Durée** : 3 min + 24h propagation
🔗 **URL** : https://play.google.com/console (compte connecté)

Sans cette étape, le workflow CI `mobile-eas-submit.yml` échoue avec `403 PermissionDenied`.

**Étapes** :
1. Play Console → **Settings** (icône engrenage en bas du menu gauche)
2. **Developer account** → **Users and permissions**
3. Bouton **Invite new users** (en haut à droite)
4. Remplir :
   | Champ | Valeur |
   |-------|--------|
   | Email | `play-publisher@taxasge-dev.iam.gserviceaccount.com` |
   | Send invitation email | (laisser décoché — c'est un SA, pas un humain) |
5. Onglet **Account permissions** : tout laisser vide (le SA n'a pas besoin d'accès au compte global)
6. Onglet **App permissions** :
   - Bouton **Add app**
   - Sélectionner **Facil** (créée en A.1)
   - Cocher uniquement :
     - ✅ View app information (read-only data)
     - ✅ **Manage testing tracks**
   - **NE PAS COCHER** :
     - ❌ Manage production releases (V1 — promotion Production reste manuelle)
     - ❌ Manage store presence (listing manuel par toi)
     - ❌ Financial : tous décochés
7. Click **Apply**
8. Click **Send invitation**

⏰ **Délai propagation Google** : ~24h. Avant cela, `eas submit` retourne 403. Ne pas re-essayer en boucle, juste attendre.

✅ **Coche quand fait** : `[ ]`
🕐 **Heure de l'invitation** : `____` (note pour calculer +24h)

---

### A.3 — Test propagation invitation (24h après A.2)

⏰ **Quand** : ~24h après A.2
⏱️ **Durée** : 2 min

**Test rapide** :
1. Ouvrir un terminal local
2. Lancer :
   ```bash
   gh workflow run mobile-eas-submit.yml \
     --repo=KouemouSah/taxasge \
     -f track=internal
   ```
3. Suivre le run sur https://github.com/KouemouSah/taxasge/actions
4. Si le workflow échoue avec `403 PermissionDenied` → invitation pas encore propagée, attendre encore 12h
5. Si le workflow réussit OU échoue avec `App not found` → invitation OK, on peut soumettre

✅ **Coche quand fait** : `[ ]`

---

## B — Configuration pré-soumission (formulaires Play Console)

> Source : `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` — chaque champ est pré-rempli
> dans ce doc, à copier-coller.

### B.1 — Privacy Policy URL

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 1 min
🔗 **URL** : Play Console → Facil → **App content** → Privacy policy

**Saisir** :
```
https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/privacy
```

(Vérifié 2026-05-02 retourne 200 OK)

✅ **Coche quand fait** : `[ ]`

---

### B.2 — Data Safety Form

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 25-40 min
🔗 **URL** : Play Console → Facil → **App content** → Data safety

**Source** : `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` §5

**À toggle dans Play Console** (matrice complète dans le doc) :
- Encryption in transit : ✅ YES
- User data deletion : ✅ YES, in-app
- Personal info → Name (required, not shared, account mgmt)
- Personal info → Email (required, not shared, account mgmt + comm)
- Personal info → User IDs (required, **shared with Sentry + LogRocket**, account mgmt + analytics)
- Personal info → Phone (optional, **shared with BANGE**, app function)
- Personal info → Address (optional, not shared)
- Personal info → Other personal info (NIF/DIP) (optional, **shared with Vertex AI for OCR**)
- Financial → Payment info (required, **shared with BANGE**, app function + fraud prevention)
- Financial → Purchase history (optional, not shared)
- Messages → Other in-app messages (chatbot) (optional, **shared with Vertex AI**, app function)
- Photos and videos → Photos (required, **shared with Vertex AI/Cloud Vision**, app function)
- Files and docs (required, **shared with Vertex AI**, app function)
- App activity → App interactions (optional, **shared with LogRocket sanitized**, analytics)
- App activity → Other UGC (required, not shared, app function)
- App info → Crash logs (optional, **shared with Sentry**, analytics)
- App info → Diagnostics (optional, **shared with Sentry + LogRocket**, analytics)
- Device or other IDs (required, **shared with FCM**, app function)

✅ **Coche quand fait** : `[ ]`

---

### B.3 — Content Rating (IARC questionnaire)

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 5-10 min
🔗 **URL** : Play Console → Facil → **App content** → Content rating

**Source** : `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` §6

**Réponses** :
- Email contact : `kouemou.sah@gmail.com`
- Category : **Reference, News, or Educational** (Facil = informational/services)
- Toutes les questions sensibles : **NO** (violence, sexuality, profanity, drugs, gambling, horror, discrimination, crude humor)
- User-generated content : **YES** — moderated (support tickets only)
- In-app purchases : **NO**
- Location sharing : **NO** (city is text input, not GPS)
- Personal info shared : **YES** (Sentry, LogRocket, Vertex AI, FCM, BANGE — see Privacy Policy)

**Rating attendu** : **Everyone (3+)** / **PEGI 3** / **ESRB Everyone**

✅ **Coche quand fait** : `[ ]`

---

### B.4 — Target Audience

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 3 min
🔗 **URL** : Play Console → Facil → **App content** → Target audience

**Réponses** :
- Target age groups : **18+** (services nécessitant NIF officiel et signature légale)
- Is your app primarily intended for children ? **NO**
- Does your app appeal to children ? **NO**
- Family policy : not applicable

✅ **Coche quand fait** : `[ ]`

---

### B.5 — App Access (credentials reviewer Google)

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 5 min (créer compte test) + 2 min (saisir Play Console)
🔗 **URL** : Play Console → Facil → **App content** → App access

**Étape A : créer le compte test en BD** (1 fois) :
```bash
# Dans le shell local avec gcloud + database-url accessibles
export DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url --project=taxasge-dev)

# Créer un compte de test review (citizen role, email vérifié)
"/c/Program Files/Odoo 17/python/python.exe" -c "
import asyncio, asyncpg, os, secrets, hashlib
from datetime import datetime, timezone

async def main():
    # Generate random secure password
    password = secrets.token_urlsafe(16)
    print(f'Password to save in GCP Secret: {password}')

    # bcrypt hash (FastAPI uses bcrypt, but for quick INSERT we use a placeholder
    # — best practice : run register endpoint instead of INSERT direct)
    # → BETTER : use the API endpoint to create the user (real bcrypt, real validation)
    print('USE BACKEND ENDPOINT INSTEAD: POST /api/v1/auth/register with this payload')
asyncio.run(main())
"
```

**Plus simple** : utiliser le backend API directement :
```bash
# 1. Demander le code de vérification email (skipped si testing-only)
curl -X POST 'https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1/auth/request-verification-code' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test-google-review@taxasge.dev","language":"es"}'

# 2. Récupérer le code reçu par email puis :
curl -X POST 'https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"test-google-review@taxasge.dev",
    "verification_code":"<from email>",
    "password":"<generated 16+ chars>",
    "first_name":"Google",
    "last_name":"Reviewer",
    "phone":"222000000",
    "role":"citizen",
    "preferred_language":"es",
    "terms_version_accepted":"1.0.0",
    "privacy_version_accepted":"1.0.0"
  }'
```

**Étape B : sauvegarder le password en GCP Secret** :
```bash
echo -n "<the password>" | gcloud secrets create play-review-test-password \
  --data-file=- --project=taxasge-dev
```

**Étape C : saisir dans Play Console App Access** :
| Champ | Valeur |
|-------|--------|
| Username | `test-google-review@taxasge.dev` |
| Password | (le password généré, à coller — Play Console le chiffre) |
| Notes | `Standard citizen account, empty workflow history. Reviewers can verify: sign-up, vault, payments, support, chatbot. Cannot access admin features.` |
| Are restricted parts of your app accessible to all users without a login ? | **NO** |

✅ **Coche quand fait** : `[ ]`

---

### B.6 — Government App Declaration

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 1 min

**Décision user 2026-05-02** : **NE PAS déclarer** comme Government Entity.

Raison : Facil est un framework adaptable, l'instance GE n'est qu'un déploiement. Cocher "Government" lierait le store listing à une seule juridiction.

**Réponse** :
- Q : Does this app belong to a government entity ? → **NO**

✅ **Coche quand fait** : `[ ]`

---

### B.7 — News app declaration / COVID-19 / Ads

⏰ **Quand** : avant la 1re soumission AAB
⏱️ **Durée** : 1 min

**Réponses** : tous **NO** (Facil n'est ni news, ni COVID, ni ads-supported).

✅ **Coche quand fait** : `[ ]`

---

## C — Listing visuel (assets)

### C.1 — App icon 512×512

⏰ **Quand** : avant la 1re soumission AAB
🔗 **URL** : Play Console → Facil → **Main store listing** → Graphics → App icon

**Source** : `packages/mobile/assets/images/icon_facil.png` (déjà 512×512 selon EAS metadata)

⚠️ **Vérifier** que c'est bien du **PNG 32-bit avec alpha** (pas JPG, pas opaque). Sinon Play Console rejette.

✅ **Coche quand fait** : `[ ]`

---

### C.2 — Feature graphic 1024×500

⏰ **Quand** : avant la 1re soumission AAB

**Source** : Phase E (à créer — voir `MOBILE_PHASE_10_E_ASSETS_DETAILED.md` quand cette phase sera attaquée).

**Suggestion design** : logo Facil centré + tagline "Plateforme de digitalisation des procédures administratives" sur fond vert dégradé.

✅ **Coche quand fait** : `[ ]`

---

### C.3 — Phone screenshots × 3 langues

⏰ **Quand** : avant la 1re soumission AAB

**Bonne nouvelle** : 23 captures d'écran existent déjà dans `Documentations/Mobile/images/0.jpg` à `22.jpg`.

**Sélection recommandée — 8 captures** :
1. `0.jpg` — Home Assistant IA fiscal
2. `1.jpg` — Home secondary slide
3. (à choisir parmi 2-22 pour : Services list, Wizard, Documents vault, Companies, Profile)

✅ **Coche quand fait** : `[ ]`

---

### C.4 — Short description × 3 langues

⏰ **Quand** : avant la 1re soumission AAB
🔗 **URL** : Play Console → Facil → **Main store listing**

**Source** : `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` §2

| Lang | Texte (≤80 chars) |
|------|-------------------|
| ES | `Facil — Plataforma para la digitalización de procedimientos administrativos` |
| FR | `Facil — Plateforme de digitalisation des procédures administratives` |
| EN | `Facil — Platform for digitizing administrative procedures` |

✅ **Coche quand fait** : `[ ]`

---

### C.5 — Full description × 3 langues

⏰ **Quand** : avant la 1re soumission AAB

**Source** : `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` §3 — copier-coller verbatim les 3 blocs ES/FR/EN.

✅ **Coche quand fait** : `[ ]`

---

## D — Soumission Internal Testing

### D.1 — Build AAB v1.0.0 via tag

⏰ **Quand** : après A+B+C tous cochés + déploiement backend + redeploy frontend
⏱️ **Durée** : 5 min CLI + 25 min EAS Cloud build

**Étapes** (depuis le shell local) :
```bash
# 1. S'assurer qu'on est sur develop à jour
git checkout develop && git pull origin develop

# 2. Créer le tag v1.0.0
git tag v1.0.0
git push origin v1.0.0

# 3. Le workflow `mobile-eas-build.yml` se déclenche automatiquement
#    Suivre sur https://expo.dev/accounts/emacsah/projects/facil/builds
#    OU sur https://github.com/KouemouSah/taxasge/actions
```

⏰ **Délai EAS** : ~25 min en queue + build. Ne pas annuler.

✅ **Coche quand fait** : `[ ]`

---

### D.2 — Soumission via workflow CI

⏰ **Quand** : après D.1 réussi
⏱️ **Durée** : 5 min

**Option A** — Auto (si workflow_run trigger fonctionne) :
- Le workflow `mobile-eas-submit.yml` se déclenche automatiquement après que `mobile-eas-build.yml` se termine SUCCESS sur le tag.
- Vérifier sur https://github.com/KouemouSah/taxasge/actions

**Option B** — Manuel :
```bash
gh workflow run mobile-eas-submit.yml \
  --repo=KouemouSah/taxasge \
  -f track=internal
```

✅ **Coche quand fait** : `[ ]`

---

### D.3 — Vérification Play Console post-submit

⏰ **Quand** : 1-2 min après D.2 réussi

**Étapes** :
1. Play Console → Facil → **Testing → Internal testing** → Releases
2. Vérifier qu'une nouvelle release apparaît avec status "In review" puis "Available"
3. **Première fois** : Google demandera "Use Play App Signing ?" → choisir **YES** → suivre les instructions PEPK (voir `MOBILE_PHASE_10_D_SIGNING_KEYS.md` §2)

✅ **Coche quand fait** : `[ ]`

---

### D.4 — Inviter testeurs internes

⏰ **Quand** : après D.3 OK
🔗 **URL** : Play Console → Facil → Testing → Internal testing → Testers

**Étapes** :
1. Bouton **Create email list**
2. Liste name : `Facil Internal Testers V1`
3. Coller les emails (un par ligne) — équipe + early adopters
4. Save
5. Onglet **How testers join your test** → copier le **opt-in URL**
6. Envoyer le opt-in URL aux testeurs (par email/Slack)
7. Les testeurs cliquent → acceptent → reçoivent l'app via Play Store

✅ **Coche quand fait** : `[ ]`

---

## E — Soft-launch monitoring (5-7 jours Internal Testing)

### E.1 — Sentry alerts setup

⏰ **Quand** : juste après D.4
🔗 **URL** : https://taxasge.sentry.io/alerts/

**Alertes recommandées** :
1. **Crash-free sessions < 99% over 1h** → email `kouemou.sah@gmail.com`
2. **New issue with ≥ 50 events/h** → email + (optionnel) Slack
3. **Specific error : terms_acceptance_failed** (filtre `error_code:outdated_terms_version` count > 5/h) → email — détecte les users avec mobile pré-Phase B

✅ **Coche quand fait** : `[ ]`

---

### E.2 — Daily check (5-7 jours)

⏰ **Quand** : J+1, J+3, J+5, J+7 après D.4
⏱️ **Durée** : 5 min/jour

**Checklist quotidienne** :
- [ ] Sentry → crash-free sessions > 99.5%
- [ ] LogRocket → frustration index < 5%
- [ ] Support tickets in-app : pas de bug bloquant signalé
- [ ] Play Console → Internal testing → Vitals : ANR < 0.5%

**GO/NO-GO Production** :
- ✅ GO : crash-free > 99.5%, ANR < 0.5%, 0 issue P1, 0 crash bloquant signalé
- ❌ NO-GO : ≥ 1 crash bloquant → patch v1.0.1 + nouvelle attente 5j

✅ **Coche quand fait** : `[ ]`

---

## F — Promotion Production (post soft-launch validé)

### F.1 — Promotion Internal → Production

⏰ **Quand** : après E.2 GO
🔗 **URL** : Play Console → Facil → **Production**

**Étapes** :
1. **Create new release** dans Production track
2. **Reuse release** → sélectionner la release validée Internal Testing
3. **Release name** : `1.0.0`
4. **What's new** :
   - Saisir × 3 langues — voir master plan §G
5. **Phased rollout** : 20% (recommandé V1)
6. Submit for review

⏰ **Délai review Google** : 1-7 jours.

✅ **Coche quand fait** : `[ ]`

---

### F.2 — Country availability

⏰ **Quand** : avant approval F.1

**Décision** : Equatorial Guinea (primary). Optionnel : Espagne, France, Cameroun (diaspora).

🔗 **URL** : Play Console → Facil → Production → **Countries / regions**

✅ **Coche quand fait** : `[ ]`

---

### F.3 — Augmentation rollout

⏰ **Quand** : J+3 après F.1 approval (si métriques OK)

**Étapes** :
- 20% → 50% (J+3)
- 50% → 100% (J+7)

🔗 **URL** : Play Console → Facil → Production → **Releases** → onglet "Live releases" → bouton "Update rollout"

✅ **Coche quand fait** : `[ ]`

---

## G — Post-launch (continu)

### G.1 — Rotation annuelle service account JSON key

⏰ **Quand** : 1 an après création (donc 2027-05-02 si on lance 2026-05-02)

**Procédure** : voir `MOBILE_PHASE_10_D_SIGNING_KEYS.md` §4.1

✅ **Coche au calendar** : `[ ]`

---

### G.2 — Rotation upload keystore (24 mois recommandé)

⏰ **Quand** : 2 ans après lancement

**Procédure** : voir `MOBILE_PHASE_10_D_SIGNING_KEYS.md` §1 + Play Console **App integrity** → "Rotate upload key"

✅ **Coche au calendar** : `[ ]`

---

## H — Timeline résumée (au mieux)

| Étape | Min | Max |
|-------|-----|-----|
| A.1 + A.2 (créer app + invite SA) | T0 | T0+5min |
| Attendre propagation SA | T0+24h | T0+24h |
| B + C (formulaires + assets) | T0+24h | T0+30h |
| D.1 (tag + EAS build) | T0+30h | T0+31h |
| D.2 + D.3 (submit + Play App Signing) | T0+31h | T0+32h |
| D.4 + E (soft-launch 5-7j) | T0+32h | T0+8j |
| F (promotion Prod + review Google 1-7j) | T0+8j | T0+15j |
| Rollout 100% | T0+8j | T0+22j |

**Réaliste avec un peu de slack** : ~3 semaines T0 → app live publique 100%.

---

## Changelog

- **2026-05-02 v1.0** : Création initiale post-Phase D livrée. 7 sections (A-G), 23 actions numérotées avec horodatage attendu, sources documentaires liées.
