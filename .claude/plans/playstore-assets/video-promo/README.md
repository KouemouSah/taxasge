# Facil — Promo Videos for Play Store

**Date** : 2026-05-02
**Format livrable** : 2 vidéos × 8 secondes
**Ratio** : 9:16 vertical (1080×1920) — optimal mobile + Play Store + Reels/Stories cross-promotion
**FPS** : 30
**Audio** : musique sans paroles, mood "tech / clean / inspirant"
**Outils cibles** : Google Veo 3 ou Runway Flow (Gen-3 Alpha Turbo / Gen-4)

---

## Critique honnête (challenge utilisateur)

**Tu as proposé** : 1-2 vidéos de 8 secondes.

**Mes réserves** :

1. **8s est très court pour Play Store**. Recommandation Google : 30s (idéal), 15s (acceptable).
   8s ne laisse que 4-6 keyframes utiles → une seule idée par vidéo.

2. **Play Store accepte UNE seule URL YouTube** par fiche app. Donc 2 vidéos = il faut soit en concaténer (16s = OK), soit choisir laquelle uploader.

3. **9:16 vertical** est mon choix car :
   - Mobile-first (les visiteurs Play Store sont sur mobile)
   - Réutilisable Reels Instagram + TikTok + YouTube Shorts
   - Mais Play Store affiche en lettrebox sur tablette horizontale

   **Alternative** : 16:9 (1920×1080) pour Play Store + tablette, mais format mobile bizarre.

**Décision retenue V1** : 9:16 vertical (mobile-first, viralisable). Si on veut un asset premium pour la fiche store, on concatènera V1+V2 = 16s en 9:16.

**Recommandation V1.1** : ajouter une 3e vidéo de 30s (full storyboard) si l'app gagne de la traction.

---

## Vidéo 1 — "Discover Facil" (8s) — Hero overview

**Objectif** : montrer "qu'est-ce que c'est" en 8 secondes
**Audience** : visiteur Play Store qui découvre l'app
**Mood** : énergique, moderne, transition fluide

### Storyboard frame-by-frame

| Time | Frame | Visual | Transition | Audio cue |
|------|-------|--------|-----------|-----------|
| 0.0s | 1 | Logo Facil ("A" vert dans cercle) **anime** : zoom du centre, fade-in léger sur fond blanc | — | Note synth aiguë qui monte |
| 0.5s | 2 | Logo se transforme : reveal du wordmark complet "FACIL" + tagline "simplificarte la vida" | Morph fluide | Synth pad doux |
| 1.5s | 3 | **Capture 01-onboarding-hero.jpg** apparaît dans un mockup smartphone vertical (illustration robot+chat) | Push-in latéral droite | Whoosh |
| 3.0s | 4 | **Capture 02-home-quick-actions.jpg** glisse depuis la droite (Home avec 4 actions + Asistente IA card) | Slide-left | Tick-tick UI sound |
| 4.5s | 5 | **Capture 03-ai-assistant-welcome.jpg** apparaît avec **highlight sur "Asistente IA"** (zoom progressif sur ce badge) | Cross-dissolve + zoom 1.2× | Pop notification |
| 6.0s | 6 | Split-screen 4 captures simultanément (04-services + 05-simulator + 06-dashboard + 08-receipt) en grille 2×2 avec voile vert dégradé | Quick cuts | Build-up musical |
| 7.0s | 7 | Texte centré : **"+850 servicios. 21 ministerios. IA multilingüe."** sur fond vert (`#2E7D32` → `#4CAF50`) | Text reveal animation char-by-char | Drop musical |
| 7.5s | 8 | Logo Facil + **"Disponible en Google Play"** + tagline + small Equatorial Guinea flag accent | Logo bounce subtle | Note finale |
| 8.0s | END | — | — | — |

### Prompt Veo 3 (à coller dans le prompt textbox)

```
A 9:16 vertical mobile app promotional video, 8 seconds, 30fps. Style: clean, modern,
fintech aesthetic. Brand color palette: deep green #2E7D32 to bright green #4CAF50
gradient backgrounds, white surface elements, subtle shadows.

Sequence:
0-1s: A green letter "A" inside a green circle (Facil logo) animates with a gentle
zoom-in and reveals the full wordmark "FACIL" with tagline "simplificarte la vida"
on a white background.

1-3s: A vertical smartphone mockup slides in from the right, displaying a friendly
cartoon robot character with chat bubbles (the Facil AI Assistant onboarding screen).

3-4s: Smooth slide transition to a new mobile screen showing a clean home interface
with 4 colored quick-action cards (green "Servicios", blue "Licencias", orange
"Empresas", purple "Calculador") and a prominent "Asistente IA" card.

4-6s: Cross-dissolve into a chat AI interface with a friendly green AI avatar
saying "¡Hola! Soy el asistente de Facil". Zoom 1.2x onto the assistant card,
emphasizing the AI feature.

6-7s: Split-screen 2x2 grid showing four mobile screens simultaneously (services
catalog, license tax simulator, my requests dashboard, official PDF receipt with
QR code) with a soft green gradient overlay.

7-8s: Text "+850 servicios · 21 ministerios · IA multilingüe" reveals letter-by-letter
on a green gradient background, then the Facil logo bounces in with the text
"Disponible en Google Play" and a small Equatorial Guinea flag accent.

Audio: Modern minimalist tech music — light synth pad, gentle whoosh transitions,
subtle UI tick sounds, building up to a satisfying drop at second 7.5. No voiceover.
```

### Reference images to upload to Veo 3

| File | Role | Notes |
|------|------|-------|
| `playstore-assets/icon-512.png` | Logo | For frame 1 zoom-in |
| `packages/mobile/assets/images/logo_hd.png` | Wordmark | For frame 2 reveal |
| `playstore-assets/screenshots-es/01-onboarding-hero.jpg` | Mockup content | Frame 3 |
| `playstore-assets/screenshots-es/02-home-quick-actions.jpg` | Mockup content | Frame 4 |
| `playstore-assets/screenshots-es/03-ai-assistant-welcome.jpg` | Mockup content | Frame 5 |
| `playstore-assets/screenshots-es/04-services-catalog.jpg` | Grid 2x2 | Frame 6 |
| `playstore-assets/screenshots-es/05-license-simulator.jpg` | Grid 2x2 | Frame 6 |
| `playstore-assets/screenshots-es/06-my-requests-dashboard.jpg` | Grid 2x2 | Frame 6 |
| `playstore-assets/screenshots-es/08-official-receipt.png` | Grid 2x2 | Frame 6 |

---

## Vidéo 2 — "AI + Multilingual + Government" (8s) — Features highlight

**Objectif** : différenciation — pourquoi Facil > apps concurrentes
**Audience** : visiteur curieux qui a survolé Vidéo 1
**Mood** : confiant, professionnel, légèrement institutionnel

### Storyboard frame-by-frame

| Time | Frame | Visual | Transition | Audio cue |
|------|-------|--------|-----------|-----------|
| 0.0s | 1 | Texte central "Tres pilares" sur fond vert dégradé, fade-in | — | Drum kick + low pad |
| 1.0s | 2 | **Pilier 1: AI** — gros mot "IA" en blanc bold, sub-text "Asistente especializado" + capture 03-ai-assistant.jpg réduite à droite | Slide-up | Synth note |
| 2.5s | 3 | Animation : 3 bulles de chat IA apparaissent l'une après l'autre (responses traduites) | Sequential pop | Tick-tick |
| 3.0s | 4 | **Pilier 2: Multilingual** — 3 drapeaux "ES · FR · EN" rotation 3D | Flip horizontal | Whoosh |
| 4.5s | 5 | Capture 04-services-catalog.jpg avec language switcher "ES" highlighted, puis "FR" puis "EN" en cycle rapide | Quick zoom on switcher | Tick-tick UI |
| 5.0s | 6 | **Pilier 3: Trust** — capture 08-official-receipt.png avec **"Validado"** badge + QR code zoom | Cross-dissolve + zoom on QR | Beep validation |
| 6.5s | 7 | Texte central sur fond blanc : **"Adaptable framework | Deployed for Equatorial Guinea"** | Letter-by-letter | Build-up |
| 7.5s | 8 | Logo Facil + texte "Disponible en Google Play" + small "AI · Multilingual · GDPR" badges | Logo bounce | Note finale |
| 8.0s | END | — | — | — |

### Prompt Veo 3

```
A 9:16 vertical mobile app feature highlight video, 8 seconds, 30fps. Style:
confident, professional, institutional feel. Color palette: deep green
#2E7D32 to #4CAF50 gradient, accents in white and gold.

Sequence:
0-1s: Large white text "Tres pilares" (Three pillars) fades in centered on
deep green background. Subtle drum + bass build-up starts.

1-3s: Pillar 1 reveals — large bold white text "IA" slides up from bottom,
with subtitle "Asistente especializado" below. To the right, a mobile mockup
shows a chat AI interface. Three speech bubbles pop up sequentially showing
multilingual AI responses.

3-5s: Pillar 2 reveals via a horizontal flip — three flag chips appear
"ES · FR · EN" rotating in 3D space. A mobile screen shows a services catalog
with a language switcher button rapidly cycling ES → FR → EN highlighting.

5-7s: Pillar 3 reveals — a cross-dissolve to an official receipt mockup
(white card with green "Validado" badge, QR code, fiscal data). Camera zooms
slowly into the QR code which animates with a scanner-line effect.

7-8s: Final card on white background: text "Adaptable framework | Deployed
for Equatorial Guinea" reveals letter by letter. Then the Facil logo
bounces in with three small chips: "AI-powered · Multilingual · GDPR-ready"
and "Disponible en Google Play".

Audio: Cinematic tech-corporate music — minimal piano motif building over
percussion, gentle synth pads, validation beep at 5s, satisfying resolution
chord at 7.5s. No voiceover.
```

### Reference images to upload to Veo 3

| File | Role | Notes |
|------|------|-------|
| `playstore-assets/icon-512.png` | Final logo | Frame 8 |
| `playstore-assets/screenshots-es/03-ai-assistant-welcome.jpg` | Pillar 1 | Frame 2-3 |
| `playstore-assets/screenshots-es/04-services-catalog.jpg` | Pillar 2 | Frame 5 |
| `playstore-assets/screenshots-es/08-official-receipt.png` | Pillar 3 | Frame 6 |

---

## Génération étape par étape

### Veo 3 (Google AI Studio / Gemini)
1. https://gemini.google.com/ → modèle Gemini 2.5 Pro avec Veo 3 enabled
2. Coller le prompt
3. Upload reference images si Veo 3 supporte image-to-video (selon ton plan)
4. Génération : ~30-60s par vidéo
5. Download MP4 (9:16, 1080×1920, 30fps, ~5-10MB)

### Runway Flow / Gen-3 Alpha Turbo
1. https://app.runwayml.com/
2. New project → Gen-3 Alpha (image-to-video)
3. Upload première frame (logo Facil ou screenshot 01)
4. Coller prompt textuel
5. Set duration 8s, 9:16
6. Generate ($0.05-0.10 par seconde de vidéo)
7. Download MP4

### Étape post-production (optionnelle)
- Si on veut concat V1 + V2 = vidéo 16s : utiliser CapCut Web ou ffmpeg :
  ```bash
  ffmpeg -i v1.mp4 -i v2.mp4 -filter_complex \
    "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]" \
    -map "[outv]" -map "[outa]" facil-promo-16s.mp4
  ```

### Upload Play Console
- Play Console accepte UNE URL YouTube par fiche app
- Workflow : upload sur YouTube channel "@facil-app" (à créer) en non-listed → coller URL dans fiche Play Console

---

## Suivi

- **2026-05-02 v1.0** : Scripts initiaux. 2 vidéos × 8s, format 9:16 vertical, prompts Veo 3 + Runway prêts. Reference images mappées sur les 8 captures ES sélectionnées.
