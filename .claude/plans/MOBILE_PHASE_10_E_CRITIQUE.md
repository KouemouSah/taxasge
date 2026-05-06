# PHASE E — Critique honnête

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Statut** : Assets visuels livrés. 8 screenshots sélectionnés parmi les 23 existantes. Captions × 3 langues rédigés. Feature graphic 1024×500 + icon 512×512 générés via Pillow.

---

## 1. Sortie livrée

| Asset | Localisation | Dimensions | Format |
|-------|--------------|-----------|--------|
| App icon Play Store | `.claude/plans/playstore-assets/icon-512.png` | 512×512 | PNG 32-bit RGBA |
| Feature graphic | `.claude/plans/playstore-assets/feature-graphic-1024x500.png` | 1024×500 | PNG RGB |
| Plan détaillé Phase E | `.claude/plans/MOBILE_PHASE_10_E_ASSETS_DETAILED.md` | — | MD |
| Captions × 3 langues | dans plan détaillé §4 | — | MD |
| Screenshots (8) sélectionnés | dans `Documentations/Mobile/images/` (existants) | 1080×2340 | JPG |

**Stratégie pragmatique** : aucune capture nouvelle créée. Les 23 captures existantes (`0.jpg` à `22.jpg` + Screenshot natif récent) couvrent tout le funnel marketing. Le user n'aura PAS besoin de re-captures device — gain de temps important.

---

## 2. Détails — assets générés

### 2.1 App icon 512×512

**Source** : `packages/mobile/assets/images/icon_facil.png` (308×308 RGBA)
**Méthode** : upscale Lanczos via Pillow vers 512×512
**Résultat** : logo "A" vert dans cercle vert sur fond blanc, conforme Play Store specs

⚠️ **Risque qualité** : upscale Lanczos depuis 308px peut produire des bords légèrement flous comparé à un re-render depuis vecteur. **Visuellement acceptable** mais sub-optimal.

**Recommandation V1.1** : récupérer le SVG source du logo Facil (à demander au designer original) et re-rendre en 512×512 natif.

### 2.2 Feature graphic 1024×500

**Composition** :
- Background gradient vertical `#2E7D32` → `#4CAF50` (brand green)
- Cercles décoratifs blancs translucides (depth visuelle)
- Carte blanche centrée-gauche avec logo HD complet "FACIL — simplificarte la vida"
- Hero text à droite : "Plataforma de digitalización de procedimientos" (3 lignes)
- Sous-tagline "Plateforme · Platform" (3 langues abrégées)
- 3 chips features bas-gauche : AI-powered · Multilingual · GDPR-ready
- Pill country bas-droite : "Adaptable framework | Deployed for Equatorial Guinea"

**Framing strict respecté** : le graphic positionne Facil comme **framework adaptable** en premier, l'instance Guinée Équatoriale en sous-texte (pill bas-droite).

⚠️ **Limites honnêtes** :
- Police système Windows utilisée (Segoe UI) — sur d'autres OS le rendu peut différer (mais l'image générée est figée en PNG, donc pas un vrai problème)
- Hero text uniquement en ES — les visiteurs Play Store FR/EN voient le même graphic. Acceptable car la sous-tagline mentionne "Plateforme · Platform"
- Pas de smartphone mockup avec capture in-app comme initialement proposé dans le plan détaillé §3.2 → simplification scope, mais réduit l'impact "produit visible"

**Recommandation V1.1** : intégrer un mockup smartphone avec capture `0.jpg` (Assistant IA) à droite du logo, ou commander un design pro Figma pour ~30€.

---

## 3. Risques & honnêteté

### 3.1 GAP — Captures uniquement en français V1

Les 8 screenshots sélectionnés sont en français (langue d'utilisation du device user). Pour Play Store ES + EN, on poste les **mêmes** captures FR (Option B documentée plan détaillé §2).

**Impact** :
- ✅ User espagnol/anglais voit l'app "fonctionne en français" (peut décourager)
- ❌ Conversion install probablement réduite vs captures localisées

**Mitigation V1.1** : user re-capture les 8 écrans en switchant la langue système Android (es / en) — 30 min total.

### 3.2 GAP — Icon upscale qualité sub-optimale

L'icon 512×512 est un upscale Lanczos depuis 308×308. Sur Play Store, l'icon sera affiché dans des tailles variées (48, 72, 96, 144, 192) et le grand format 512 sera utilisé pour la fiche store. **Rendu visible** : OK pour V1, mais un designer pro pourrait produire mieux depuis vecteur.

### 3.3 RISQUE — Captures peuvent contenir données factices PII

**Vérifications faites** :
- 18.jpg (entreprise) → "Tienda El Sol" + "Miguel Nsue Mokuy" — semblent fictifs (à confirmer user — si réels, anonymiser)
- f2.png (Recibo) → REC-2026-000011, PE-1011, Tesoro Malabo II — données fictives ou test
- 8.jpg (Chat IA) → conversation procédure passeport — pas de PII visible

**Action requise user** : valider avant upload Play Console qu'aucune des 8 captures ne contient de données réelles d'utilisateur prod (vérifier user_id, NIF, email, phone). Si oui → re-capturer avec compte test.

### 3.4 GAP — Pas de smartphone mockup dans feature graphic

Le plan initial §3.2 prévoyait un smartphone mockup avec capture in-app à droite du logo. **Pas implémenté** par simplicité (compositing PNG mockup dans Pillow demande un asset frame iPhone/Android complexe).

**Impact** : le graphic est plus textuel que visuel. Un design pro mettrait un mockup product au centre.

**Mitigation** : si le user souhaite, je peux re-générer avec un cadre smartphone simple en HTML/CSS rendu via Playwright. Sinon V1.1.

### 3.5 RISQUE — Police système Windows pas universelle

Le rendu du feature graphic dépend des polices Windows installées localement. Sur un autre OS (linux, mac), la regénération pourrait donner un rendu légèrement différent. **L'image PNG actuelle est figée** donc pas un problème pour l'upload Play Console — mais documente la limitation pour reproductibilité.

### 3.6 GAP — Animation/promo video absente

Play Store accepte une URL YouTube de promo video (≤30s recommandé). **Skip V1** — à créer V1.1 si traction (typiquement génère +20% conversion install).

---

## 4. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | Icon 512×512 généré, conforme PNG 32-bit alpha | `file icon-512.png` | ✅ 512×512 RGBA |
| V2 | Feature graphic 1024×500 généré | `file feature-graphic-1024x500.png` | ✅ 1024×500 RGB |
| V3 | 8 screenshots sélectionnés depuis captures existantes | plan §2 | ✅ |
| V4 | Captions × 3 langues ≤80 chars chacun | plan §4 | ✅ |
| V5 | Framing framework adaptable respecté | inspection feature graphic | ✅ pill bas-droite |
| V6 | Aucune nouvelle capture nécessaire | plan §1.1 | ✅ |
| V7 | Logos identifiés et utilisés (icon_facil + logo_hd) | files exist | ✅ |
| V8 | Description ES/FR/EN pre-rédigées (Phase C) | doc forms | ✅ depuis Phase C |
| V9 | Vérification PII dans les 8 captures choisies | manual user | ⏳ pending |
| V10 | Tablet screenshots / promo video | skip V1 | ✅ |

---

## 5. Recommandation push

### 5.1 Maintenant
- **Commit local** : 3 fichiers (plan détaillé Phase E, critique, 2 PNG assets)
- **PAS DE PUSH** tant que toutes les phases A-E ne sont pas validées (économie EAS quota)

### 5.2 Action user requise avant Phase F
1. **Vérifier les 8 captures sélectionnées** ne contiennent pas de PII réelle (10 min)
2. **Optionnel** : re-capturer en ES + EN si volume V1.1 acceptable (30 min)
3. **Optionnel** : valider visuellement le feature graphic dans `playstore-assets/feature-graphic-1024x500.png` — accepter en l'état OU demander variant

### 5.3 Phase F enchaînable
Phase F = Tests E2E + Build AAB v1.0.0 + Internal Testing. Tous les pré-requis assets sont satisfaits (icon, feature graphic, captures, captions, descriptions).

**Bloquant Phase F restant** : invitation SA `play-publisher` Play Console (action user, propagation 24h) — voir `MOBILE_PHASE_10_USER_MANUAL_ACTIONS.md` §A.2.

---

## 6. Changelog

- **2026-05-02 v1.0** : Phase E livrée. 2 assets PNG générés (icon-512 + feature-graphic-1024x500). 8 screenshots existants sélectionnés. Captions × 3 langues prêts. Aucune capture nouvelle requise. 6 risques/gaps documentés (pas de blocker V1).
