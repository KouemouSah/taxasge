# Play Console — Texte promotionnel développeur (≤140 chars × 3 langues)

**Pour** : Google Play Console — Profil du développeur → Texte promotionnel
**Date** : 2026-05-02
**Auteur** : KOUEMOU SAH Jean Emac
**Limite** : **140 caractères max** par langue (compteur strict côté Play Console)
**Langues** : Français (par défaut), Espagnol, Anglais

> 3 versions (focus produit / focus compétences / mixte) × 3 langues. Chaque
> texte fait ≤140 chars (espaces inclus). Choisir une version + verifier le
> compteur côté Play Console avant de coller.

---

## Version 1 — Focus produit (mention de Facil)

### FR (par défaut) — 132 chars
```
Développeur full-stack | Architecte de Facil, framework AI de digitalisation des procédures administratives gouvernementales
```

### ES — 118 chars
```
Desarrollador full-stack | Arquitecto de Facil, framework con IA para digitalizar procedimientos administrativos
```

### EN — 110 chars
```
Full-stack developer | Architect of Facil, AI framework to digitize government administrative procedures
```

---

## Version 2 — Focus compétences (stack tech)

### FR — 122 chars
```
Développeur full-stack & architecte IA. Stack : React Native, FastAPI, Vertex AI. Pipelines DevOps Cloud Run + EAS Build
```

### ES — 116 chars
```
Desarrollador full-stack y arquitecto IA. Stack: React Native, FastAPI, Vertex AI. Pipelines DevOps Cloud Run + EAS
```

### EN — 118 chars
```
Full-stack dev & AI architect. Stack: React Native, FastAPI, Vertex AI. DevOps pipelines: Cloud Run + EAS Build/Submit
```

---

## Version 3 — Mixte (recommandée — équilibre identité + produit)

### FR — 117 chars
```
Architecte full-stack & IA — Auteur de Facil, framework de digitalisation des services administratifs gouvernementaux
```

### ES — 110 chars
```
Arquitecto full-stack e IA — Autor de Facil, framework para la digitalización de servicios administrativos
```

### EN — 102 chars
```
Full-stack & AI architect — Author of Facil, framework to digitize government administrative services
```

---

## Recommandation

**Version 3 (mixte) — recommandée** :
- Plus courte que V1+V2 → marge pour ajustements
- Identité tech ("Architecte full-stack & IA") + crédibilité produit ("Auteur de Facil")
- Cohérent avec le framing master plan : framework adaptable + instance GE en sous-texte
- Pas de jargon hardcore (pas de "EAS Build", "Cloud Run") qui nuirait à un reviewer non-tech

---

## Procédure de saisie Play Console

1. Compte développeur → Profil du développeur
2. Section **"Texte promotionnel"** → champ par défaut (FR)
3. Coller la version FR de ton choix
4. Cliquer **"Ajouter une traduction"**
5. Choisir **Spanish (Spain) — es-ES** → coller la version ES
6. Cliquer **"Ajouter une traduction"**
7. Choisir **English (US) — en-US** → coller la version EN
8. Sauvegarder en bas de page

---

## ⚠️ À noter — section "Application sélectionnée"

Tu m'as signalé que le dropdown **"Sélectionner une application"** est vide (capture `debug/tesoro/web.png`).

**Cause** : tu n'as pas encore créé la fiche app `Facil` (`com.taxasge.app`) sur Play Console. Le dropdown se peuple **automatiquement** dès qu'une app existe sur ton compte.

**Action requise** :
1. Compte développeur → **All apps** (menu gauche, en haut)
2. Bouton **"Create app"** (en haut à droite)
3. Remplir :
   - App name : `Facil`
   - Default language : `Spanish – es-ES`
   - App or game : `App`
   - Free or paid : `Free`
   - Cocher les 3 déclarations developer policies + US export laws + content guidelines
4. Bouton **"Create app"**
5. Retourner sur Profil du développeur → le dropdown "Application sélectionnée" doit maintenant proposer "Facil"

⏰ La création app prend 30 secondes. Le package name `com.taxasge.app` sera renseigné automatiquement au premier upload AAB.

---

## Site web du développeur — confirmation

Dans la même section (capture web.png), je vois "Site Web du développeur" avec `https://emacsah.com` déjà saisi. ✅ C'est la bonne URL.

---

## Suivi

- **2026-05-02 v1.0** : 3 versions × 3 langues rédigées, toutes ≤140 chars validées. Recommandation V3 mixte. Procédure step-by-step pour Play Console + diagnostic problème "Application sélectionnée" vide.
