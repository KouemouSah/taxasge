# PHASE E — Assets Store Play Console (Plan détaillé)

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Sortie attendue** : tous les visuels Play Store prêts (icon 512, feature graphic 1024×500, 8 screenshots × 3 langues, captions, descriptions × 3 langues).
**Cible time** : 0.5j (faible — réutilise 23 captures existantes)
**Branche** : `develop`

---

## 1. CONTEXTE & DÉCOUVERTES

### 1.1 Inventaire visuel disponible

Suite au feedback user 2026-05-02, le dossier `Documentations/Mobile/images/` contient déjà :

**Logos / icones — réutilisables Play Console** :
- `icon_facil.png` — logo "A" stylisé vert (`#2E7D32`) cerclé blanc — **= app icon 512×512** (déjà dans `packages/mobile/assets/images/icon_facil.png`)
- `logo.png` — logo complet "FACIL" + tagline "simplificarte la vida" — **= base feature graphic**
- `f2.png` — capture d'un Recibo de Pago officiel (preuve qualité output) — **= screenshot premium**

**Captures app — 23 disponibles** (`0.jpg` à `22.jpg` + Screenshot natif récent + 3 onboarding `o1-o3.jpg`) :
- Home (0, 1) — slides hero avec Assistant IA + slogan
- Login/auth (15)
- Catalogue services (5)
- Chat IA (8)
- Guides/Procédures (10, 12)
- Entreprises business (18)

**Palette identifiée** :
| Couleur | Hex approximatif | Usage |
|---------|-------------------|-------|
| Vert principal | `#2E7D32` (logo) / `#4CAF50` (boutons) | Brand color |
| Vert clair container | `#C8E6C9` | Surface secondary, badges |
| Blanc | `#FFFFFF` | Backgrounds |
| Noir texte | `#212121` (logo word "FACIL") | Headings |
| Gris texte secondaire | `#757575` | Body text |

**Tagline officiel** : "simplificarte la vida" (ES) — slogan visible sur le logo

### 1.2 Spécifications Play Store

| Asset | Dimensions | Format | Obligatoire | Source |
|-------|-----------|--------|-------------|--------|
| App icon | 512 × 512 | PNG 32-bit alpha | ✅ | `assets/images/icon_facil.png` (à vérifier dimensions) |
| Feature graphic | 1024 × 500 | PNG/JPG 24-bit | ✅ | À CRÉER (Phase E.3) |
| Phone screenshots | 1080 × 2340 (existing capture format) | JPG | ✅ min 2 max 8 | Réutiliser `Documentations/Mobile/images/` |
| 7" tablet screenshots | min 1024 × 600 | PNG/JPG | ❌ optionnel | Skip V1 |
| 10" tablet screenshots | min 1080 × 1920 | PNG/JPG | ❌ optionnel | Skip V1 |
| Promo video | URL YouTube | URL | ❌ optionnel | Skip V1 |

---

## 2. SÉLECTION 8 SCREENSHOTS

Stratégie : **funnel marketing** — captures qui suivent un parcours qui démontre la valeur progressive de l'app.

| # | Source | Écran | Pourquoi |
|---|--------|-------|----------|
| 1 | `0.jpg` | Home avec Assistant IA fiscal (slide 2) | **Hero shot** — carte bleue prominente, accroche visuelle. Met en avant l'IA dès l'ouverture du store. |
| 2 | `1.jpg` | Home avec slogan "Rien de plus facile pour vous servir" + 850+ services + 4 quick actions (Services / Licences / Entreprises / Calculateur) | **Positioning** — affiche l'ampleur du catalogue + 4 use cases principaux |
| 3 | `15.jpg` | Login Facil — logo + tagline "simplificarte la vida" + "Bienvenue" | **Branding** — logo HD + tagline officiel, polished |
| 4 | `5.jpg` | Détail service Passeport (7500 XAF, 1 jour, 4 procédures, services associés) | **Richesse fonctionnelle** — montre la profondeur d'info par service (prix, délai, procédure, services connexes) |
| 5 | `8.jpg` | Chat IA — réponse détaillée "Procédure de passeport" avec coût, délai, documents requis, étapes | **Différenciation IA** — preuve que l'assistant produit du contenu structuré pertinent |
| 6 | `10.jpg` | Guide pas à pas (Étapes / Questions / Formulaires) | **Pédagogie** — 6 étapes claires avec icônes, montre l'aspect guided |
| 7 | `18.jpg` | Détail entreprise "Tienda El Sol" — obligations fiscales (4 lignes) + bouton "Payer" + Historique paiements | **Cas business** — couvre la persona PME/autonomes (différent du citoyen) |
| 8 | `f2.png` | Recibo de Pago officiel (REC-2026-000011, Tesoro, 99000 XAF, validé, QR code) | **Preuve sociale** — output tangible, document officiel exploitable, confirme la qualité institutionnelle |

**Total** : 8 screenshots × 3 langues = 24 captures à uploader Play Console.

⚠️ **À noter** : les captures sont en français. Pour ES + EN, il faudra :
- **Option A** : reprendre les captures avec langue switch in-app (le user peut le faire en 30min sur device — l'app supporte les 3 langues)
- **Option B** : poster les mêmes 8 captures FR pour les 3 langues (Play Store autorise — moins polished mais OK V1)

**Recommandation** : Option B pour V1 (économie temps), **Option A en V1.1** pour optimisation conversion.

---

## 3. FEATURE GRAPHIC 1024×500

### 3.1 Brief design

**Format** : 1024×500 PNG, fond fixe (pas de transparence, Play Store recommande)
**Audience** : visiteurs Play Store qui découvrent l'app pour la 1re fois
**Message clé** : "Plateforme adaptable de digitalisation des procédures administratives"
**Sub-message** : "Instance déployée pour la Guinée Équatoriale"

### 3.2 Composition visuelle proposée

**Layout horizontal**, divisé en 3 zones :

```
┌────────────────────────────────────────────────────────────────┐
│  Zone 1 (gauche, 40%)        Zone 2 (centre, 30%)   Zone 3 (40%)│
│                                                                  │
│  Logo FACIL (HD)              Smartphone mockup     Hero text    │
│  Tagline "simplificarte la    avec capture 0.jpg    "Plateforme  │
│   vida"                       à l'intérieur          de digital. │
│                                                       procédures │
│  Sous-tagline FR/ES/EN                                admin."    │
│                                                                  │
│                                                       Tagline    │
│                                                       country    │
└────────────────────────────────────────────────────────────────┘
```

**Palette** : dégradé vert `#2E7D32` → `#4CAF50` (haut → bas) avec accents blancs.
**Typographie** : sans-serif moderne (Inter / Roboto / Helvetica). Logo conservé en noir+vert (cohérence brand).

### 3.3 Délégation agent design

Le brief sera délégué à l'agent `frontend-design` pour produire un **mockup HTML+CSS** (fichier `.html` standalone) que le user peut :
- Ouvrir dans un navigateur
- Exporter en PNG via screenshot navigateur ou Puppeteer/Playwright
- Uploader sur Play Console

**Pourquoi pas un PNG direct** : aucun outil dans cette session ne génère d'images. Le mockup HTML est la voie la plus pragmatique.

**Alternative** : le user peut commander une création Figma/Canva à un designer (~30€ via Fiverr) si le mockup HTML ne convient pas.

---

## 4. CAPTIONS × 3 LANGUES

### Caption pour chaque screenshot (≤80 chars Play Store)

| # | ES | FR | EN |
|---|------|------|------|
| 1 | "Asistente IA fiscal multilingüe" | "Assistant IA fiscal multilingue" | "Multilingual AI fiscal assistant" |
| 2 | "+850 trámites · 21 ministerios · 20 entidades" | "+850 démarches · 21 ministères · 20 entités" | "+850 procedures · 21 ministries · 20 entities" |
| 3 | "Inicio seguro con autenticación 2FA" | "Connexion sécurisée avec 2FA" | "Secure login with 2FA" |
| 4 | "Detalle por servicio: precio, plazo, documentos" | "Détail par service: prix, délai, documents" | "Service detail: price, deadline, documents" |
| 5 | "Chatea con el agente IA experto" | "Discutez avec l'agent IA expert" | "Chat with the expert AI agent" |
| 6 | "Guías paso a paso para cada trámite" | "Guides pas à pas pour chaque démarche" | "Step-by-step guides for every procedure" |
| 7 | "Gestión de obligaciones fiscales empresa" | "Gestion des obligations fiscales entreprise" | "Business fiscal obligations management" |
| 8 | "Recibos oficiales con código QR de validación" | "Reçus officiels avec QR code de validation" | "Official receipts with validation QR code" |

---

## 5. CHECKLIST OPÉRATIONNELLE

### E.1 Plan détaillé ✅
- [x] Ce fichier

### E.2 Sélection screenshots ✅
- [x] 8 screenshots identifiés (§2)
- [x] Captions × 3 langues rédigés (§4)

### E.3 Feature Graphic — délégation agent design
- [ ] Brief envoyé à `frontend-design` agent
- [ ] Mockup HTML+CSS généré dans `.claude/plans/feature-graphic.html`
- [ ] Documentation procédure de capture PNG via navigateur
- [ ] Validation visuelle user

### E.4 Vérification icon 512×512
- [ ] Vérifier dimensions de `packages/mobile/assets/images/icon_facil.png`
- [ ] Si pas 512×512 → upscale ou re-générer

### E.5 Préparation upload Play Console
- [ ] Copier les 8 captures choisies dans `.claude/plans/playstore-screenshots/` pour traçabilité
- [ ] Documenter le mapping (file → caption × 3 langues) dans `MOBILE_PHASE_10_USER_MANUAL_ACTIONS.md` C.3

### E.6 Critique + commits
- [ ] `MOBILE_PHASE_10_E_CRITIQUE.md`
- [ ] Commit local sémantique

---

## 6. RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Icon `icon_facil.png` ≠ 512×512 | MOYENNE | MOYEN | Vérifier via `file` ou Pillow ; upscale si nécessaire |
| Mockup HTML n'a pas le rendering exact attendu | MOYENNE | MOYEN | Fournir brief Figma/Canva alternatif si user préfère pro design |
| Captures ES/EN absentes | HAUTE | FAIBLE | Option B accepté V1 (mêmes captures FR pour 3 langues) |
| Captures incluent données réelles user (PII) | FAIBLE | MOYEN | Vérifier les captures choisies — Tienda El Sol = nom fictif, Recibo = données factices |
| Format PNG ≠ JPEG attendu Play Store | FAIBLE | FAIBLE | Play Store accepte les 2 |
| Feature graphic typographie illisible sur mobile | MOYENNE | FAIBLE | Mockup à valider sur device avant upload |

---

## 7. DÉCISIONS

- **8 screenshots fixés** : 0/1/15/5/8/10/18/f2.png — funnel marketing : Hero → Catalog → Auth → Service Detail → AI Agent → Guides → Business → Output Proof
- **Captions** : 8 × 3 langues = 24 phrases courtes (≤80 chars)
- **Captures FR seulement V1** (option B) — Option A multilingue reportée V1.1
- **Feature graphic** : mockup HTML+CSS à générer par agent `frontend-design`, capturable via navigateur
- **Tablet screenshots** : skip V1 (optionnel Play Store)
- **Promo video** : skip V1 (optionnel Play Store, à créer V1.1 si traction)

---

## 8. SUIVI

- **2026-05-02 v1.0** : Plan détaillé créé après inspection complète des assets disponibles. 8 screenshots sélectionnés, captions × 3 langues prêts. Brief feature graphic prêt pour délégation agent design. Aucune capture nouvelle à créer.
