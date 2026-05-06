# Facil — Promo Video 30 seconds (Play Store premium asset)

**Date** : 2026-05-02
**Format** : 30 seconds, 9:16 vertical (1080×1920) — primary mobile-first; 16:9 (1920×1080) cropped fallback for landscape Play Store / YouTube
**FPS** : 30
**Audio** : musique cinématique modern-tech sans paroles + UI sound effects (pas de voix-off pour rester langue-agnostique multilingue)
**Outils cibles** : Google Veo 3 (Gemini Advanced), Runway Gen-3 / Gen-4, ou Adobe Firefly Video

---

## Pourquoi 30s (challenge user-validé)

| Format | Use-case | Pros | Cons |
|--------|----------|------|------|
| **8s × 2 (V1+V2)** | Reels / Stories / Shorts | Viralisable, faible coût gen | Trop court pour Play Store fiche |
| **30s** (ce script) | Play Store fiche store + YouTube channel | Standard Google recommandé, narrative complète | 1 seul asset, plus cher à générer |
| 60s | YouTube long-form | Détail produit complet | Trop long pour mobile attention spans |

**Recommandation V1 launch** : ce script 30s pour la fiche Play Store + concat des deux 8s pour Reels social.

---

## Structure narrative — 3 actes

| Acte | Durée | Goal | Émotion |
|------|-------|------|---------|
| **I. Hook (0-7s)** | 7s | Capter l'attention, brand reveal | Curiosité, énergie |
| **II. Demo (7-22s)** | 15s | Montrer ce que l'app fait, 4-5 features clés | Confiance, "wow ça existe ?" |
| **III. CTA (22-30s)** | 8s | Crédibiliser + driver vers download | Réassurance + appel à l'action |

---

## Storyboard frame-by-frame

### Acte I — Hook (0-7s)

| Time | Frame | Visual | Camera / FX | Audio |
|------|-------|--------|-------------|-------|
| 0.0s | 1 | Écran NOIR, point lumineux blanc minuscule au centre | Fade-in | Silence puis note synth single |
| 0.5s | 2 | Le point lumineux explose en plusieurs particules vertes qui forment progressivement le "A" du logo Facil | Particle reveal animation | Whoosh + build-up bass |
| 2.0s | 3 | Le "A" est complet vert (`#2E7D32`), zoom out légèrement, le cercle vert apparaît autour | Zoom-out + circle reveal | Drum kick |
| 3.0s | 4 | Le wordmark "FACIL" écrit lettre par lettre à droite du logo, fond blanc | Text reveal (typewriter effect) | Tick-tick UI |
| 4.5s | 5 | Tagline "simplificarte la vida" apparaît sous le logo | Fade-up | Synth pad doux |
| 5.0s | 6 | Background morph : du blanc → gradient vert (`#2E7D32` → `#4CAF50`), logo reste centré | Color transition smooth | Music intensifies |
| 6.0s | 7 | Question text reveal centré sous le logo : **"¿Y si simplificáramos sus trámites?"** (ES) | Text fade-in + subtle bounce | Beat drop préparé |
| 7.0s | END I | — | — | — |

### Acte II — Demo (7-22s)

| Time | Frame | Visual | Camera / FX | Audio |
|------|-------|--------|-------------|-------|
| 7.0s | 8 | Mockup smartphone vertical fade-in plein cadre, écran ON = capture **01-onboarding-hero.jpg** (illustration robot+chat) | Phone slide-up from bottom | Beat drop ! |
| 8.5s | 9 | Doigt animé tap sur l'écran → transition à **02-home-quick-actions.jpg** (Home avec 4 cards colorés) | Tap sound + UI click | UI tick-tick |
| 10.0s | 10 | Zoom progressif sur la card "Asistente IA" qui s'illumine, transition smooth vers **03-ai-assistant-welcome.jpg** | Zoom 1.5× + cross-dissolve | Whoosh + magical chime |
| 12.0s | 11 | Animation : 3 bulles de chat IA apparaissent l'une après l'autre avec texte ES → FR → EN qui glisse | Sequential pop + slide | Tick-tick × 3 |
| 13.5s | 12 | Cut rapide vers **04-services-catalog.jpg** (services list) avec compteur "+850 servicios" qui s'incrémente de 0 à 850 | Counter animation | Drum roll |
| 15.0s | 13 | **05-license-simulator.jpg** apparaît, focus sur le résultat "TOTAL ANUAL 114 000 XAF" qui pulse en vert | Pulse glow | Calculator beep |
| 16.5s | 14 | Split-vertical : à gauche **06-my-requests-dashboard.jpg** (3 demandes), à droite **07-bundle-payment-flow.jpg** (étape upload doc) | Split slide | Snare drum |
| 18.5s | 15 | Zoom sur le bouton "Pagar les obligations" qui clique automatiquement | Press animation | Click sound |
| 19.5s | 16 | Transition vers **08-official-receipt.png** plein écran avec QR code qui se génère devant la caméra | QR dot-by-dot reveal | Validation chime |
| 21.0s | 17 | Le QR code est complet, badge "Validado · 99 000 XAF" apparaît | Badge bounce | Success ding |
| 22.0s | END II | — | — | — |

### Acte III — CTA (22-30s)

| Time | Frame | Visual | Camera / FX | Audio |
|------|-------|--------|-------------|-------|
| 22.0s | 18 | Cut rapide vers fond vert dégradé (`#2E7D32` → `#4CAF50`), 3 chips features animés un par un : **"AI-powered"** → **"Multilingual"** → **"GDPR-ready"** | Sequential slide-in | 3 ticks ascending |
| 24.0s | 19 | Stats reveal centré : **"+850 servicios · 21 ministerios · 20 entidades"** (lettre par lettre) | Letter reveal | Counter ratchet |
| 25.5s | 20 | Logo Facil zoom-in centré + tagline "simplificarte la vida" | Zoom-in | Music swells |
| 26.5s | 21 | Texte sous logo : **"Adaptable framework"** sur ligne 1, **"Deployed for Equatorial Guinea"** sur ligne 2 (couleur blanc) | Two-line fade-in | Pad sustained |
| 28.0s | 22 | Logo Facil + Google Play badge "Disponible en Google Play" + Equatorial Guinea flag accent (très petit, en bas à droite) | All elements settle | Final note resolution |
| 29.5s | 23 | Hold final + subtle particle accent autour du logo | — | Sustained tail |
| 30.0s | END | — | — | — |

---

## Prompt Veo 3 (à coller intégralement)

```
A 30-second cinematic mobile app promotional video, 9:16 vertical (1080×1920),
30fps. Style: modern fintech aesthetic, premium quality, smooth transitions.
Brand color palette: deep green #2E7D32 to bright green #4CAF50 gradient,
clean white surfaces, subtle drop shadows, professional typography
(Inter or similar geometric sans-serif).

ACT I — HOOK (0-7s):
Open on a black screen. A single white pixel of light appears at center.
At 0.5s, the pixel explodes into green particles that swirl and assemble
into the letter "A" — stylized with a triangular cut-out. The "A" rests
inside a green circle (Facil logo). Camera zooms out subtly. The wordmark
"FACIL" types in letter-by-letter to the right of the icon, on white
background. Tagline "simplificarte la vida" fades in below. The white
background morphs into a deep green gradient. Centered text appears:
"¿Y si simplificáramos sus trámites?" in elegant white typography.

ACT II — DEMO (7-22s):
A smartphone mockup slides up from below, filling the frame. The screen
shows a friendly cartoon robot character with chat bubbles (Facil onboarding).
A finger taps the screen, transitioning smoothly to a clean home interface
with 4 colored quick-action cards (green Servicios, blue Licencias, orange
Empresas, purple Calculador) and a prominent "Asistente IA" card. Camera
zooms 1.5x on the AI card which transforms into a chat interface where 3
multilingual response bubbles appear sequentially in Spanish, French,
English. Quick cut to a services catalog screen with a counter animation
incrementing from 0 to 850. Cross-dissolve to a tax simulator screen
showing "TOTAL ANUAL 114 000 XAF" pulsing in green. Split-vertical
transition: left half shows 3 service requests, right half shows a
business document upload step. Zoom on a "Payer les obligations" button
which auto-clicks. Final transition: a full-screen official PDF receipt
appears with a QR code generating dot-by-dot live, then a "Validado ·
99 000 XAF" green badge bounces in.

ACT III — CTA (22-30s):
Cut to deep green gradient background. Three feature chips animate in
sequentially: "AI-powered" → "Multilingual" → "GDPR-ready" (white pills
with green text). Centered stats text reveals letter-by-letter:
"+850 servicios · 21 ministerios · 20 entidades". The Facil logo zooms
in with the tagline "simplificarte la vida". Two-line text appears below:
"Adaptable framework / Deployed for Equatorial Guinea". A Google Play
badge "Disponible en Google Play" slides in alongside a small Equatorial
Guinea flag accent. The logo holds with subtle particle effects swirling
around it.

Audio: 30-second cinematic tech-corporate music track. Build-up bass
and synth pad in Act I, beat drop and energetic percussion in Act II,
swelling resolution chord in Act III. Layer in subtle UI sound effects:
tap clicks, whoosh transitions, validation chimes, calculator beeps,
typewriter ticks. NO voiceover (language-agnostic to support ES/FR/EN
deployment instances).
```

---

## Reference images mapping (uploadable to Veo 3 / Runway)

| Frame # | Time | Reference image |
|---------|------|------------------|
| 1-7 | 0-7s | `playstore-assets/icon-512.png` + `packages/mobile/assets/images/logo_hd.png` |
| 8 | 7-8.5s | `playstore-assets/screenshots-es/01-onboarding-hero.jpg` |
| 9 | 8.5-10s | `playstore-assets/screenshots-es/02-home-quick-actions.jpg` |
| 10-11 | 10-13.5s | `playstore-assets/screenshots-es/03-ai-assistant-welcome.jpg` |
| 12 | 13.5-15s | `playstore-assets/screenshots-es/04-services-catalog.jpg` |
| 13 | 15-16.5s | `playstore-assets/screenshots-es/05-license-simulator.jpg` |
| 14 (left) | 16.5-18.5s | `playstore-assets/screenshots-es/06-my-requests-dashboard.jpg` |
| 14 (right) | 16.5-18.5s | `playstore-assets/screenshots-es/07-bundle-payment-flow.jpg` |
| 15-17 | 18.5-22s | `playstore-assets/screenshots-es/08-official-receipt.png` |
| 18-22 | 22-30s | Logo + brand assets only |

---

## Production workflow

### Option A : Veo 3 (Gemini Advanced — single-shot generation)
1. https://gemini.google.com/ — souscrire Gemini Advanced ($20/mois)
2. Générer en 1 shot avec le prompt ci-dessus
3. Limites Veo 3 : durée max ~8s par génération en V1 → **non viable pour 30s en un shot**
4. **Alternative** : générer 4 segments de 7-8s (Acte I, Acte II.A, Acte II.B, Acte III) puis concat avec ffmpeg

### Option B : Runway Gen-4 (recommandé pour 30s premium)
1. https://app.runwayml.com/ — plan Standard ($15/mois ~625 credits)
2. Gen-4 supporte 10s par génération → générer 3 segments de 10s
3. Coût : ~$3-6 total
4. Concat : Runway intégré ou ffmpeg local

### Option C : Synthesia / Sora (corporate-grade, $$)
1. https://www.synthesia.io/ — plan Personal ($30/mois)
2. Templates pré-faits, drag-drop, AI voiceovers
3. Plus de contrôle mais moins "cinematic"

### Concat ffmpeg (segments → 30s final)
```bash
# Save each generated segment as seg1.mp4, seg2.mp4, etc.
echo "file 'seg1.mp4'" > list.txt
echo "file 'seg2.mp4'" >> list.txt
echo "file 'seg3.mp4'" >> list.txt
echo "file 'seg4.mp4'" >> list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy facil-promo-30s.mp4
```

### Audio mixing (optionnel post-prod)
Si la musique générée par Veo/Runway n'est pas satisfaisante :
1. Choisir une track sur Epidemic Sound / Artlist (royalty-free, $15/mo)
2. Mixer avec ffmpeg :
   ```bash
   ffmpeg -i facil-promo-30s.mp4 -i music.mp3 \
     -filter_complex "[1:a]volume=0.8[a]" \
     -map 0:v -map "[a]" -shortest facil-promo-final.mp4
   ```

---

## Upload Play Console

1. Créer chaîne YouTube `@facil-app` (ou utiliser une existante)
2. Upload la vidéo en **Unlisted** (non-listed) avec ces metadata :
   - Title : "Facil — Plataforma con IA para digitalizar sus procedimientos"
   - Description : Copier le full description ES de `MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` §3
   - Tags : `Facil, fiscal, IA, Equatorial Guinea, government services`
   - Category : Science & Technology
3. Copier le video URL YouTube
4. Play Console → Facil → Main store listing → Promo video → coller URL

---

## Checklist pre-publish vidéo

- [ ] Vidéo générée 30s en 9:16 (1080×1920)
- [ ] Audio normalisé -16 LUFS (standard YouTube)
- [ ] Pas de copyright musical (royalty-free ou généré IA)
- [ ] Aucune PII visible dans les screenshots utilisés
- [ ] Logo Facil visible dans les 3 premières secondes (recall brand)
- [ ] CTA "Disponible en Google Play" dans les 5 dernières secondes
- [ ] Sous-titres optionnels désactivés (pour multilangue)
- [ ] Test playback sur device mobile + tablet
- [ ] Upload YouTube unlisted
- [ ] URL collée Play Console

---

## Suivi

- **2026-05-02 v1.0** : Script 30s créé. Storyboard 23 frames, 3 actes (Hook 7s + Demo 15s + CTA 8s). Prompt Veo 3 ready, options Runway Gen-4 + Synthesia documentées. Pas de voiceover (langue-agnostique). Reference images mappées sur les 8 captures ES + logos.
