# Facil — Documentation interactive (PRD + BPMN web)

Version web statique du **PRD** et des **processus BPMN** Facil, avec **vue couplée** user stories ↔ workflows.

## Aperçu

Mini-site HTML statique, **sans framework JS**, sans backend, sans build. **100 % offline** — aucune connexion Internet requise. Tous les diagrammes Mermaid et données sont **inlinés** dans des fichiers JS locaux.

## Structure

```
web/
├── index.html              # Landing : 3 cartes vers PRD / BPMN / Vue couplée
├── prd.html                # PRD interactif (32 user stories filtrables)
├── bpmn.html               # BPMN visuel (17 diagrammes Mermaid rendus inline)
├── prd-bpmn.html           # Vue couplée split-screen (innovation)
├── assets/
│   ├── img/                # Logos Facil + favicon
│   ├── mermaid.min.js      # Mermaid 10.9.1 (local, offline-ready, 3.3 MB)
│   ├── styles.css          # CSS responsive WCAG AA + print stylesheet
│   ├── app.js              # JS utilitaires (vanilla, no framework)
│   ├── prd-data.js         # Données PRD inline (window.PRD_DATA) — offline
│   ├── bpmn-data.js        # Données BPMN + 17 Mermaid inline (window.BPMN_DATA) — offline
│   ├── prd-data.json       # Source JSON (pour fallback HTTP server, optionnel)
│   └── bpmn-data.json      # Idem
└── README.md               # Ce fichier
```

## Comment utiliser

### Option 1 — Ouverture directe (file://) — RECOMMANDEE OFFLINE

Double-cliquez sur `index.html`. **Tout fonctionne 100 % en local**, sans serveur HTTP, sans Internet.

Données et diagrammes sont chargés via `<script>` (pas de `fetch()`) — les navigateurs ne bloquent pas en `file://`.

### Option 2 — Serveur HTTP local (si vous préférez)

Depuis le dossier `web/`, lancez un serveur statique :

```bash
# Windows (Python Odoo)
"C:/Program Files/Odoo 17/python/python.exe" -m http.server 8000

# Ou python dans PATH
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000/` dans votre navigateur.

### Option 3 — Hébergement statique

Le dossier `web/` peut être uploadé tel quel sur Firebase Hosting, Netlify, GitHub Pages, ou tout CDN statique.

## Statistiques

- **32 user stories** (US-001 à US-032)
- **17 workflows BPMN** (10 processus + 4 architecture + 1 state-machine + 1 cross-functional + 1 pattern)
- **7 personas** + 1 transverse
- **Cross-links US ↔ Workflow** : 50+ liens bidirectionnels
- **Pages HTML** : 4

## Compatibilité offline

| Aspect | État |
|---|---|
| Vanilla JS (no framework) | OK |
| Mermaid local | OK 3.3 MB |
| Données inline | OK (window globals) |
| Diagrammes inline | OK (17 .mmd dans bpmn-data.js) |
| Logo local | OK |
| Fonts | Inter via Google Fonts CDN — fallback système si offline |
| WCAG 2.1 AA | OK |
| Responsive | OK (mobile <= 768px) |
| Print-friendly | OK |

## Couleurs (palette gov-emergent-country)

- **Primaire** : `#1F4E79` (bleu institutionnel)
- **Accent** : `#C9A227` (jaune)
- **Header v2** : blanc (`#FFFFFF`) avec texte primaire
- **Persona** : 7 couleurs WCAG AA distinctes

## Versions Markdown intactes

Ce site NE MODIFIE PAS les fichiers Markdown source :
- `Documentations/marketing/02-PRD.md`
- `Documentations/marketing/03-BPMN_PROCESSES.md`
- `Documentations/marketing/bpmn/*.mmd` (17 diagrammes)

## Contact

- **Auteur** : KOUEMOU SAH JEAN EMAC
- **Email** : kouemou.sah@gmail.com

---

© 2026 **Facil** — KOUEMOU SAH JEAN EMAC. Tous droits réservés.
