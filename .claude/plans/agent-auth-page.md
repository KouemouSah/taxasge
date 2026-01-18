# Plan: Page d'Authentification Agent Dédiée

## Objectif
Créer une page de login dédiée aux agents avec une interface épurée et professionnelle.

---

## Spécifications UI/UX

### Header Minimaliste
- Logo TaxasGE centré uniquement
- Lien vers site public (`/`)
- Pas de navigation
- Pas de menu

### Corps de Page
- Fond avec gradient subtil ou pattern professionnel
- Card de login centrée verticalement et horizontalement
- Icône Shield (sécurité) proéminente
- Titre: "Portail Agent TaxasGE"
- Sous-titre: "Accès réservé aux agents autorisés"
- Formulaire: Email + Mot de passe uniquement
- Pas d'onglet "Register" (agents créés par admin)
- Support 2FA intégré

### Footer Minimaliste
- Une ligne simple
- Copyright + Année
- Lien "Besoin d'aide?" vers support

---

## Structure des Fichiers

```
packages/web/src/app/[locale]/(auth)/auth/agent/
├── page.tsx                 # Page login agent
└── layout.tsx               # Layout minimaliste (optionnel)
```

---

## Composants à Créer/Modifier

### 1. Nouveau: `auth/agent/page.tsx`
- Composant autonome
- Header minimaliste inline
- Formulaire login (sans register)
- Footer minimaliste inline
- Gestion 2FA
- Redirection vers `/dashboard/agent`

### 2. Réutilisés (sans modification)
- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/card`
- `@/core/api/auth` (authApi)
- `@/core/auth/storage` (setAuthData)
- `@/core/validations/auth` (loginSchema)

---

## Design Tokens

```typescript
// Couleurs Agent
const agentTheme = {
  primary: 'hsl(var(--primary))',      // Couleur principale
  accent: 'emerald-600',                // Badge sécurité
  background: 'slate-50',               // Fond clair
  cardBg: 'white',                      // Card blanche
}
```

---

## Flux d'Authentification

```
1. Agent accède à /auth/agent
2. Saisie email + mot de passe
3. POST /api/v1/auth/login
4. Si 2FA activé:
   - Afficher formulaire code 2FA
   - POST /api/v1/auth/verify-2fa
5. setAuthData(response)
6. Redirect → /dashboard/agent (ou /dashboard selon profil)
```

---

## Tâches d'Implémentation

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 1 | Créer page agent login | `auth/agent/page.tsx` | ⏳ |
| 2 | Header minimaliste (logo centré) | Inline dans page | ⏳ |
| 3 | Formulaire login + 2FA | Inline dans page | ⏳ |
| 4 | Footer minimaliste | Inline dans page | ⏳ |
| 5 | Styles et animations | Tailwind inline | ⏳ |
| 6 | Traductions (i18n) | Utiliser existantes | ⏳ |
| 7 | Test manuel | - | ⏳ |

---

## Maquette ASCII

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      [LOGO TAXASGE]                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │         🛡️ SHIELD           │                │
│              │                             │                │
│              │    Portail Agent TaxasGE    │                │
│              │  Accès réservé aux agents   │                │
│              │                             │                │
│              │  ┌───────────────────────┐  │                │
│              │  │ Email                 │  │                │
│              │  └───────────────────────┘  │                │
│              │                             │                │
│              │  ┌───────────────────────┐  │                │
│              │  │ Mot de passe          │  │                │
│              │  └───────────────────────┘  │                │
│              │                             │                │
│              │  [    Se connecter     ]    │                │
│              │                             │                │
│              │  Mot de passe oublié?       │                │
│              │                             │                │
│              └─────────────────────────────┘                │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│         © 2025 TaxasGE  •  Besoin d'aide?                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation du Plan

- [x] Pas d'impact sur dashboard
- [x] Pas d'impact sur autres routes
- [x] Réutilisation API existante
- [x] Réutilisation validations existantes
- [x] Design cohérent avec charte graphique
- [x] Support i18n
- [x] Support 2FA

---

## Prêt pour Implémentation ✅
