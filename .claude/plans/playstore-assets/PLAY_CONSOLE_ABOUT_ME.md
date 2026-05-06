# Play Console — "À propos de vous" / "About you"

**Pour** : Google Play Console — section "À propos de vous" (`kouemou.sah@gmail.com`)
**Date** : 2026-05-02
**Auteur** : KOUEMOU SAH Jean Emac
**Visibilité** : section privée (vue uniquement par Google Play team)

> Plusieurs versions selon le ton souhaité. Choisir celle qui correspond le
> mieux ou faire un mix.

---

## Version 1 — Concise et factuelle (recommandée)

```
Je suis KOUEMOU SAH Jean Emac, développeur full-stack et architecte de
solutions digitales. Je suis le fondateur et l'unique développeur de
Facil, un framework AI-powered de digitalisation des procédures
administratives gouvernementales, actuellement déployé pour la
République de Guinée Équatoriale en partenariat avec la Direction
Générale des Impôts.

Expérience Android et Play Console :
- Conception, développement et publication de Facil sur Play Store —
  application native React Native (Expo SDK 54), avec build via EAS
  Cloud, signing géré par Google Play App Signing, et soumission
  automatisée via GitHub Actions + service account de l'API Google
  Play Developer.
- Architecture mobile professionnelle : observabilité Sentry +
  LogRocket, push notifications FCM, OWASP Mobile Top 10 partiel
  (M1-M9), conformité RGPD avec endpoint d'export et de suppression
  de compte intégrés à l'app.
- 3800+ commits sur le projet, 15 phases de développement structurées,
  audits sécurité automatisés (CodeQL, npm audit, Sentry releases).

Stack technique :
- Mobile : React Native, Expo SDK 54, TypeScript, React Query,
  React Native Paper (Material Design 3)
- Backend : Python 3.11, FastAPI, asyncpg, PostgreSQL (Supabase),
  Redis (Upstash), déployé sur Google Cloud Run
- IA : Google Vertex AI / Gemini 2.5 Flash, RAG avec pgvector,
  agents spécialisés multi-rôles avec tools confidentialité-aware
- DevOps : GitHub Actions, EAS Build/Submit, Firebase Hosting,
  Sentry pour 3 plateformes (mobile, web, backend), LogRocket
  session replay

Liens :
- Profil GitHub : https://github.com/KouemouSah
- Site personnel : https://emacsah.com
- Repository projet : https://github.com/KouemouSah/taxasge

Pour toute question : kouemou.sah@gmail.com
```

---

## Version 2 — Narrative (storytelling)

```
Je m'appelle KOUEMOU SAH Jean Emac. Je conçois et développe des
plateformes digitales depuis plusieurs années, avec un focus particulier
sur les services administratifs gouvernementaux et l'intelligence
artificielle appliquée.

Mon projet principal, Facil, est né d'un constat simple : digitaliser
une démarche administrative dans un pays en développement nécessite
souvent autant de complexité technique que de complexité
réglementaire. J'ai donc construit Facil comme un framework
configurable — déployable pour n'importe quelle entité (gouvernement,
organisation, entreprise) en configurant ses workflows, ses entités et
ses règles métier, sans réécrire le code.

La première instance de Facil est actuellement déployée pour la
République de Guinée Équatoriale, en partenariat avec la Direction
Générale des Impôts. Elle propose 873 services administratifs issus
de 21 ministères et 20 entités gouvernementales, avec un assistant IA
multilingue (espagnol, français, anglais) basé sur Google Vertex AI
(Gemini 2.5 Flash).

Pour la version mobile que je publie aujourd'hui sur Play Store, j'ai
mis en place un pipeline professionnel complet : EAS Build pour la
compilation cloud, Google Play App Signing pour la sécurité de la
clé de distribution, soumission automatisée via service account, et
observabilité de bout en bout (Sentry crash reporting + LogRocket
session replay + Firebase Cloud Messaging).

Conformité et sécurité :
- OWASP Mobile Top 10 partiellement audité (M1-M9 traités)
- RGPD : export et suppression de compte intégrés
- Politique de confidentialité et CGU disponibles en 3 langues
- Acceptation explicite à l'inscription avec versioning persistant

Liens :
- GitHub : https://github.com/KouemouSah
- Site personnel : https://emacsah.com
- Repository du projet : https://github.com/KouemouSah/taxasge

Contact : kouemou.sah@gmail.com
```

---

## Version 3 — Très courte (si la section Play Console est limitée à ~500 chars)

```
Je suis KOUEMOU SAH Jean Emac, développeur full-stack et fondateur de
Facil, un framework AI-powered de digitalisation des procédures
administratives gouvernementales (instance actuelle : République de
Guinée Équatoriale). Stack : React Native + Expo, FastAPI, PostgreSQL,
Vertex AI. Pipeline professionnel via EAS Build/Submit + Play App
Signing + Sentry + LogRocket. 3800+ commits, OWASP Mobile partiel,
RGPD compliant.

GitHub : https://github.com/KouemouSah
Site : https://emacsah.com
Projet : https://github.com/KouemouSah/taxasge
Contact : kouemou.sah@gmail.com
```

---

## Recommandations de remplissage

### Ordre de préférence
1. **V1 (concise et factuelle)** si le champ accepte 1500-2500 caractères : équilibre information vs lisibilité, plus convaincante pour un reviewer Play Console.
2. **V2 (narrative)** si tu veux montrer la vision derrière le projet — bon storytelling pour réviseurs humains qui repèrent les "personal apps" suspectes.
3. **V3 (très courte)** si le champ est strictement limité.

### Points-clés à préserver dans toutes les versions
- ✅ Nom complet : KOUEMOU SAH Jean Emac
- ✅ Rôle : développeur full-stack / architecte / fondateur
- ✅ Projet : Facil (framework de digitalisation gov procedures)
- ✅ Instance actuelle : Guinée Équatoriale (DGI)
- ✅ Stack technique principale : React Native, Expo, FastAPI, Vertex AI
- ✅ Pipeline pro : EAS Build/Submit, Play App Signing, observabilité
- ✅ Liens : GitHub @KouemouSah, emacsah.com, repo taxasge
- ✅ Contact email : kouemou.sah@gmail.com

### Points à NE PAS inclure
- ❌ Mention "official government app" ou "ministry app" — réservé aux apps Government Entity déclarées (Phase C decision)
- ❌ Détails financiers ou pricing
- ❌ Informations personnelles non-professionnelles (âge, localisation, etc.)

---

## Suivi

- **2026-05-02 v1.0** : 3 versions rédigées (concise / narrative / courte). Tous les éléments factuels sourcés du README + master plan + critiques des phases A-E. Tagline cohérente avec le framing "framework adaptable + instance Guinée Équatoriale" décidé Phase C.
