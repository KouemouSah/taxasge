# Brief Designer - Animations Lottie pour TaxasGE

## 🎯 Contexte du Projet

**Application :** TaxasGE - E-Fiscal Servicios (Guinée Équatoriale)  
**Plateforme :** Mobile (iOS & Android via React Native)  
**Librairie d'animation :** Lottie (Adobe After Effects → JSON)  
**Deadline :** [À définir]

---

## 🎨 Charte Graphique à Respecter

### Palette de Couleurs Obligatoire
```
Rouge :     #d10d00  (Primaire - Attention, Action)
Bleu :      #004aad  (Confiance, Sécurité)
Vert :      #499003  (Innovation, IA)
Vert clair: #def6e5  (Backgrounds secondaires)
Jaune :     #ffde59  (Highlights)
Blanc :     #ffffff  (Textes, éléments principaux)
Noir :      #000000  (Textes secondaires)
```

### Style Général
- **Design :** Flat/Moderne avec touches d'illustration 2D
- **Personnages :** Style friendly, inclusif, professionnel
- **Mood :** Rassurant, accessible, technologique mais humain
- **Inspiration :** Applications gouvernementales modernes, fintech accessible

---

## 📋 Liste des Animations à Créer

### 1️⃣ Animation Logo TaxasGE (Splash Screen)

**Fichier de sortie :** `taxage_logo_animation.json`

#### Spécifications Techniques
```
Format : Lottie JSON (After Effects)
Durée totale : 4 secondes
Taille canvas : 500x500px
Framerate : 60 FPS
Compression : Optimisée pour mobile (<150kb)
```

#### Description de l'Animation

**Phase 1 : Intro (0-2s) - Joue UNE fois**
```
0.0s → Le logo TGE apparaît du centre (scale 0 → 1.0)
0.3s → Le cercle coloré (rouge/bleu/vert/jaune) se dessine progressivement
0.8s → Les lettres "TGE" apparaissent lettre par lettre (T → G → E)
1.2s → Le texte "TaxasGE" apparaît en dessous (fade in)
1.5s → Le sous-titre "E-Fiscal Servicios" apparaît (slide up + fade in)
2.0s → Animation se stabilise
```

**Phase 2 : Loop Micro-animation (2-4s) - Boucle infinie**
```
2.0s → Un faisceau lumineux blanc (opacity 60%) commence à glisser
2.0-3.5s → Le faisceau fait le tour du cercle coloré dans le sens horaire
3.5-4.0s → Légère oscillation du logo (scale 1.0 → 1.02 → 1.0)
4.0s → Retour au début du loop (seamless)
```

#### Éléments Visuels
- **Logo de base :** Utiliser `taxage.png` comme référence
- **Cercle coloré :** Divisé en 4 segments (rouge, bleu, vert, jaune)
- **Faisceau lumineux :** Gradient blanc radial, blur léger
- **Police texte :** Sans-serif moderne (ex: Montserrat Bold pour "TGE", Regular pour sous-titre)

#### Références Visuelles
```
Exemple 1 : Animation logo Google (dessin progressif du cercle)
Exemple 2 : Splash screen Revolut (faisceau lumineux)
Exemple 3 : Logo animé Stripe (micro-oscillation)
```

---

### 2️⃣ Animation Onboarding 1 - Gestion Fiscale

**Fichier de sortie :** `onboarding_1_gestion_fiscal.json`

#### Spécifications Techniques
```
Format : Lottie JSON
Durée : 4-5 secondes en loop
Taille canvas : 400x400px
Framerate : 30 FPS
Poids max : 200kb
```

#### Description de l'Animation

**Concept :** Une personne consultant un document fiscal sur tablette, entourée d'icônes flottantes (graphiques, checkmarks, documents)

**Timeline :**
```
0.0s → La personne (silhouette) apparaît avec la tablette
0.5s → Écran de la tablette s'allume (glow vert #499003)
1.0s → Icône document 📄 apparaît en haut à gauche (bounce)
1.5s → Icône graphique 📊 apparaît à droite (slide in)
2.0s → Checkmark ✓ vert apparaît (scale + rotate)
2.5s → Les icônes font une légère rotation orbitale autour de la personne
3.0-4.0s → Loop : les icônes oscillent doucement
4.0s → Retour au début du cycle
```

#### Palette Spécifique
- Personne : Silhouette neutre (#004aad - bleu)
- Tablette : Gris clair (#e0e0e0) avec écran lumineux vert
- Icônes : Mix vert (#499003), jaune (#ffde59), blanc (#ffffff)
- Background : Transparent (géré par l'app)

#### Éléments à Inclure
- 1 personnage style "flat illustration"
- 1 tablette/smartphone en main
- 3-4 icônes fiscales (document, graphique, checkmark, calculatrice)
- Effet de glow subtil sur les éléments interactifs

---

### 3️⃣ Animation Onboarding 2A - Consulta Sencilla

**Fichier de sortie :** `onboarding_2_consulta_sencilla.json`

#### Spécifications Techniques
```
Format : Lottie JSON
Durée : 5 secondes en loop
Taille canvas : 450x350px (paysage)
Framerate : 30 FPS
Poids max : 250kb
```

#### Description de l'Animation

**Concept :** Femme professionnelle consultant son smartphone, avec des informations fiscales apparaissant sur l'écran

**Timeline :**
```
0.0s → Femme apparaît avec smartphone en main
0.5s → Écran du smartphone s'allume (glow blanc)
1.0s → Liste de documents apparaît sur l'écran (scroll animation)
1.5s → Bulle de pensée "💡" apparaît au-dessus de sa tête
2.0s → Expression de soulagement (sourire subtil)
2.5s → Checkmark ✓ vert apparaît sur le smartphone
3.0-5.0s → Loop : les données scrollent doucement sur l'écran
5.0s → Retour au début
```

#### Palette Spécifique
- Femme : Teint neutre, vêtements bleu (#004aad) et blanc (#ffffff)
- Smartphone : Noir avec écran lumineux blanc/bleu
- Icônes écran : Vert (#499003) pour succès
- Bulle de pensée : Jaune (#ffde59)

#### Style Personnage
- Design inclusif (éviter stéréotypes)
- Expression positive et professionnelle
- Posture détendue (consultation facile)
- Style "friendly corporate illustration"

---

### 4️⃣ Animation Onboarding 2B - Cálculo Exacto

**Fichier de sortie :** `onboarding_2_calculo_exacto.json`

#### Spécifications Techniques
```
Format : Lottie JSON
Durée : 4-5 secondes en loop
Taille canvas : 400x400px
Framerate : 30 FPS
Poids max : 200kb
```

#### Description de l'Animation

**Concept :** Calculatrice géante avec chiffres et formules fiscales animés, résultat final qui apparaît

**Timeline :**
```
0.0s → Calculatrice apparaît (scale in)
0.5s → Chiffres commencent à s'afficher sur l'écran (1234...)
1.0s → Main stylisée appuie sur les touches (tap animation)
1.5s → Symboles mathématiques flottent autour (+ - × ÷ %)
2.0s → Bouton "=" s'illumine (glow vert)
2.5s → Résultat apparaît en grand (bounce)
3.0s → Checkmark ✓ se superpose (confirmation)
3.5-5.0s → Loop : les chiffres changent doucement
5.0s → Retour au début
```

#### Palette Spécifique
- Calculatrice : Gris clair (#e0e0e0) avec touches blanches
- Écran : Fond vert clair (#def6e5) avec chiffres noirs
- Bouton "=" : Vert (#499003) avec glow
- Main : Silhouette bleue (#004aad)
- Symboles : Mix jaune (#ffde59) et blanc (#ffffff)

#### Éléments Mathématiques
- Symboles : +, -, ×, ÷, %, =
- Chiffres : 0-9 avec police digitale moderne
- Effet de calcul : Progression visuelle (barre de chargement rapide)

---

### 5️⃣ Animation Onboarding 3 - TaxaBot AI

**Fichier de sortie :** `onboarding_3_taxabot_ai.json`

#### Spécifications Techniques
```
Format : Lottie JSON
Durée : 6 secondes en loop (avec pause)
Taille canvas : 400x400px
Framerate : 30 FPS
Poids max : 300kb (plus complexe)
```

#### Description de l'Animation

**Concept :** Robot chatbot friendly avec casque audio, bulle de dialogue animée, particules AI flottantes

**Timeline :**
```
0.0s → Robot apparaît (bounce in)
0.5s → Yeux du robot s'allument (blink)
1.0s → Casque audio apparaît sur sa tête
1.5s → Bulle de dialogue "Hi there!" apparaît (typing effect)
2.0s → Particules d'IA (points lumineux) flottent autour
2.5s → Robot fait un geste de salut (main animée)
3.0s → Deuxième bulle "¿En qué puedo ayudarte?" (typing)
4.0-5.5s → Robot respire doucement (idle animation)
5.5s → PAUSE de 0.5s
6.0s → Retour au début du loop
```

#### Palette Spécifique
- Corps robot : Vert (#499003) avec accents vert clair (#def6e5)
- Yeux : Blanc (#ffffff) avec pupilles noires (expressions)
- Casque : Bleu (#004aad) avec microphone
- Bulles dialogue : Blanc (#ffffff) avec bordure verte, texte noir
- Particules IA : Mix vert/jaune avec glow

#### Style Robot
- Design "friendly bot" (pas menaçant)
- Formes arrondies, pas de angles agressifs
- Expression sympathique et serviable
- Micro-expressions (clignements, sourires)

#### Éléments Techniques IA
- Particules flottantes (simulation réseau neural)
- Effet de "thinking" (points animés ... )
- Icônes : 🤖, 💬, ✨

---

### 6️⃣ Animation Onboarding 4 - Funcionalidades

**Fichier de sortie :** `onboarding_4_funcionalidades.json`

#### Spécifications Techniques
```
Format : Lottie JSON
Durée : 5 secondes en loop
Taille canvas : 400x450px
Framerate : 30 FPS
Poids max : 280kb
```

#### Description de l'Animation

**Concept :** Femme avec smartphone, éléments de sécurité (empreinte, cadenas, shield) apparaissant en rotation

**Timeline :**
```
0.0s → Femme apparaît avec smartphone
0.5s → Empreinte digitale 👆 apparaît (scan effect)
1.0s → Cadenas 🔒 apparaît en rotation (lock animation)
1.5s → Shield (bouclier) apparaît (glow rouge)
2.0s → Checkmarks ✓ multiples apparaissent (cascade)
2.5s → Tous les éléments font une rotation orbitale autour du smartphone
3.5-5.0s → Loop : les éléments pulsent doucement
5.0s → Retour au début
```

#### Palette Spécifique
- Femme : Vêtements rouges (#d10d00) et blancs (#ffffff)
- Smartphone : Noir avec écran lumineux
- Empreinte : Bleu (#004aad) avec effet scan
- Cadenas : Jaune (#ffde59) avec effet métal
- Shield : Rouge (#d10d00) avec glow
- Checkmarks : Vert (#499003)

#### Éléments de Sécurité
- Empreinte digitale avec lignes animées
- Cadenas avec animation d'ouverture/fermeture
- Bouclier avec effet de protection (onde)
- Particules de sécurité (pixels, grilles)

---

## 🎬 Spécifications Techniques Globales

### Export Lottie depuis After Effects

#### Plugin Requis
```
Bodymovin (Lottie plugin officiel)
Version : 5.12.0 ou supérieure
Download : https://aescripts.com/bodymovin/
```

#### Paramètres d'Export Recommandés
```json
{
  "glyphs": false,  // Ne pas inclure les polices (poids)
  "hidden": false,   // Ne pas exporter les layers cachés
  "inlineStyles": false,
  "exportMode": "normal",
  "compSettings": true,
  "demoPlayer": false,
  "compress": true  // IMPORTANT : Activer la compression
}
```

#### Optimisation Obligatoire
```
1. Utiliser formes vectorielles (pas d'images bitmap si possible)
2. Minimiser les layers (fusionner quand possible)
3. Éviter les effets After Effects non compatibles :
   ❌ Lens Flare
   ❌ Fractal Noise (utiliser alternatives)
   ❌ Glow (simuler avec shapes)
   ✅ Position, Scale, Rotation, Opacity
   ✅ Trim Paths
   ✅ Fill, Stroke
   
4. Tester avec LottieFiles.com avant livraison
5. Vérifier compatibilité iOS/Android
```

### Poids et Performance
```
Taille maximale par fichier : 300kb
Taille idéale : 150-200kb
Framerate : 30 FPS (60 FPS uniquement pour splash screen)
Résolution : 2x pour Retina
```

---

## 📦 Livrables Attendus

### Fichiers à Fournir

#### 1. Fichiers JSON Lottie (Priorité 1)
```
✅ taxage_logo_animation.json
✅ onboarding_1_gestion_fiscal.json
✅ onboarding_2_consulta_sencilla.json
✅ onboarding_2_calculo_exacto.json
✅ onboarding_3_taxabot_ai.json
✅ onboarding_4_funcionalidades.json
```

#### 2. Fichiers After Effects (Priorité 2 - pour modifications futures)
```
✅ taxage_logo_animation.aep
✅ onboarding_1.aep
✅ onboarding_2.aep
✅ onboarding_3.aep
✅ onboarding_4.aep
```

#### 3. Assets Complémentaires
```
✅ Images PNG de fallback (si animation ne charge pas)
   - 2x et 3x résolutions
   - Même dimensions que les canvas Lottie
   
✅ GIF preview (pour validation rapide)
   - Résolution web (400x400px max)
   - Toutes les animations en loop
```

#### 4. Documentation
```
✅ README.md avec :
   - Liste des animations et leurs usages
   - Notes sur les modifications possibles
   - Palette de couleurs utilisée
   - Crédits des assets (si illustrations tierces)
```

---

## ✅ Checklist de Validation (Tests Requis)

Avant de livrer, le designer DOIT tester :

### Tests Techniques
- [ ] Fichiers JSON s'ouvrent sans erreur sur LottieFiles.com
- [ ] Animations tournent en loop sans saccades
- [ ] Poids de chaque fichier < 300kb
- [ ] Pas d'effets incompatibles (check console LottieFiles)
- [ ] Transparence (alpha) fonctionne correctement

### Tests Visuels
- [ ] Couleurs respectent exactement la charte (#d10d00, #004aad, etc.)
- [ ] Animations fluides à 30 FPS minimum
- [ ] Éléments centrés dans le canvas
- [ ] Pas de coupure sur les bords
- [ ] Lisibilité sur fond clair ET foncé

### Tests d'Intégration (si possible)
- [ ] Test dans l'app React Native (simulateur iOS)
- [ ] Test dans l'app React Native (simulateur Android)
- [ ] Performance : pas de lag sur iPhone SE (ancien device)

---

## 🚨 Erreurs Fréquentes à Éviter

### ❌ NE PAS FAIRE

1. **Utiliser des images bitmap** → Augmente drastiquement le poids
2. **Effets After Effects complexes** → Non compatibles Lottie
3. **Trop de layers** → Lag sur devices anciens
4. **Animations trop rapides** → Désagréable à regarder
5. **Couleurs hors charte** → Incohérence visuelle
6. **Oublier les loops** → Animation joue qu'une fois
7. **Canvas trop grand** → Poids excessif
8. **Textes en fonts non-standard** → Problèmes de rendu

### ✅ BONNES PRATIQUES

1. **Utiliser shapes vectorielles** → Léger et scalable
2. **Animer les path/trim** → Effets fluides et légers
3. **Prévisualiser en boucle** → Vérifier les transitions
4. **Garder des timings naturels** → 0.3-0.5s pour les transitions
5. **Tester sur mobile** → Rendu réel vs desktop
6. **Compresser les JSON** → Minifier avant livraison
7. **Nommer les layers** → Facilite modifications futures

---

## 📚 Ressources et Inspirations

### Outils Recommandés
```
Adobe After Effects (animation)
Bodymovin Plugin (export Lottie)
LottieFiles.com (test & preview)
Figma (mockups & design)
```

### Références d'Animations Similaires
```
1. LottieFiles - "Financial App Onboarding"
   → https://lottiefiles.com/tags/financial

2. LottieFiles - "Chatbot Assistant"
   → https://lottiefiles.com/tags/chatbot

3. Dribbble - "Tax App Illustrations"
   → https://dribbble.com/search/tax-app

4. Behance - "Government App UX"
   → https://www.behance.net/search/projects?search=government+app
```

### Styles à Imiter
```
✅ Illustrations Flat moderne (style 2020-2025)
✅ Couleurs vives mais professionnelles
✅ Personnages inclusifs et neutres
✅ Animations subtiles (pas Disney level)
✅ Mood : Confiance + Accessibilité
```

---

## 💰 Budget et Timeline (Suggestion)

### Estimation de Temps par Animation
```
Logo Splash (complexe)     : 8-12 heures
Onboarding 1-4 (standard)  : 6-8 heures chacun
Total                      : ~40-50 heures de travail
```

### Planning Proposé
```
Semaine 1 :
- Jours 1-2 : Recherche & concepts (sketches)
- Jours 3-5 : Animation logo + Onboarding 1

Semaine 2 :
- Jours 1-3 : Onboarding 2A et 2B
- Jours 4-5 : Onboarding 3 (TaxaBot - plus complexe)

Semaine 3 :
- Jours 1-2 : Onboarding 4
- Jours 3-4 : Optimisation + exports
- Jour 5 : Tests + corrections

Livraison : Fin Semaine 3
```

---

## 📞 Questions / Points de Contact

Avant de commencer, clarifier avec le client :

### Design
1. Y a-t-il un guide de marque existant (brand guidelines) ?
2. Les personnages doivent-ils représenter une ethnicité spécifique (Guinée Équatoriale) ?
3. Préférence pour un style d'illustration particulier ?

### Technique
4. Quelle version minimale d'iOS/Android à supporter ?
5. Y a-t-il des animations à prioriser (MVP) ?
6. Budget disponible pour illustrations custom vs banques d'images ?

### Contenu
7. Les textes dans les bulles (TaxaBot) sont-ils définitifs ?
8. Validation de chaque animation requise ou liberté créative ?
9. Qui valide les livrables finaux ?

---

## ✅ Acceptation des Livrables

Les animations seront considérées comme **validées** si :

1. ✅ Tous les fichiers JSON sont fournis et fonctionnels
2. ✅ Respect strict de la charte graphique
3. ✅ Poids < 300kb par fichier
4. ✅ Pas d'erreurs sur LottieFiles preview
5. ✅ Animations fluides sur simulateurs iOS & Android
6. ✅ Validation visuelle par le Product Owner

**Processus de Révision :**
- Maximum 2 rounds de révisions inclus
- Révisions majeures (changement de concept) = coût additionnel
- Révisions mineures (couleurs, timings) = incluses

---

## 🎬 Let's Go!

**Ce brief est complet et prêt à être envoyé à un designer/animateur.** 

**Prochaine étape :** Trouver un freelance spécialisé en :
- Adobe After Effects
- Lottie / Bodymovin
- Illustrations flat/moderne
- Mobile app animations

**Plateformes recommandées :**
- Dribbble (portfolio)
- Upwork / Fiverr (freelances)
- LottieFiles (créateurs spécialisés)

**Budget estimé :** 1500-3000€ selon expérience du designer

---

Bonne création ! 🚀