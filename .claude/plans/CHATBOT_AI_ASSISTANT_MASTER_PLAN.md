# CHATBOT AI ASSISTANT - PLAN MAÎTRE D'AMÉLIORATION

**Date**: 2026-03-27
**Statut**: EN COURS
**Objectif**: Faire monter l'agent LLM assistant IA au niveau d'un expert avec raisonnement avancé

---

## RAPPORT CRITIQUE INITIAL

### Documents indexés vs disponibles
| Document | Indexé | Chunks | Problème |
|----------|--------|--------|----------|
| Ley_de_Tasas_Fiscales.pdf | OUI | 212 | OK mais verbeux |
| Libro_LPGE.pdf | OUI | 24 | OK |
| Precios.pdf | OUI | 60 | CRITIQUE: encoding garbled, tables perdues |
| Requisitos_Pasaportes.pdf | NON | 0 | A indexer |
| CODIGOS-DE-INGRESOS-2025.pdf | NON | 0 | A indexer |
| LEY_TRIBUTARIA.pdf | NON | 0 | A indexer |
| Carnet de Funcionario.pdf | NON | 0 | A indexer |

### Bugs critiques
1. **SCROLL CASSÉ** - overflow-y-auto + scrollbar cachée + pt-12 absolu = hauteur incorrecte
2. **PRIX INEXACTS** - Bundles ignorés dans consolidation, Precios garbled, pas de tool bundles
3. **INCOHÉRENCE PASAPORTE** - PDF non indexé, pas de promotion Facil, pas de cross-referencing

### Failles raisonnement agent
- Pas de Chain-of-Thought
- Pas de promotion Facil vs cnedoge.gq
- Pas de logique bundle/zone
- Pas de cross-referencing sources
- Pas d'intent detection (comprendre vs prix vs démarrer)
- Pas de query rewriting
- Self-evaluation simpliste

### Outils manquants
- `search_bundles` - type commerce + zone -> tarif total
- `calculate_bundle_price` - devis structuré par zone
- `get_zone_info` - identifier zone géographique
- `start_workflow` - lien direct wizard Facil
- `get_document_requirements` - docs requis par workflow

---

## PHASE 1: FIXES CRITIQUES (Scroll + Indexation + Prompt v2) ✅ COMPLETE

### 1.1 Fix Scroll CSS ChatPage ✅
- [x] Diagnostiqué: double overflow-y-auto imbriqué (ChatPage + MessageList)
- [x] Fix: supprimé scroll interne de MessageList, gardé scroll parent ChatPage
- [x] Scroll visible avec scrollbar-thin au lieu de scrollbar cachée
- [x] Auto-scroll via scrollIntoView sur messagesEndRef (ancêtre scrollable)
- [x] Scroll detection via useEffect sur parent scrollable le plus proche
- [x] FloatingChatbot non affecté (implémentation indépendante)

### 1.2 Ré-indexation PDFs manquants ✅
- [x] PDFs copiés dans packages/backend/data/legislacion/ (inclus dans Docker image)
- [x] CODIGOS-DE-INGRESOS-2025.pdf → scanné, non indexable (OCR à planifier)
- [x] Endpoint admin POST /chatbot/admin/reindex-legislacion ajouté
- [ ] À exécuter après déploiement pour indexer les 4 PDFs restants

### 1.3 Améliorer extraction Precios.pdf ✅
- [x] Analysé: 21 pages, 2 tables side-by-side par page, 4 zones, 10 types commerce
- [x] Script index_precios_structured.py créé (extract_tables + structured chunks)
- [x] 46 chunks structurés avec zone + type commerce + items + totaux
- [x] Page 20 résumé (Ayuntamientos Malabo/Bata) extraite
- [ ] À exécuter après déploiement

### 1.4 System Prompt v2 - Raisonnement avancé ✅
- [x] Chain-of-Thought: 5 étapes de raisonnement interne avant réponse
- [x] Promotion Facil: identité + mission + vs plateformes officielles
- [x] Intent detection: information/prix/procédure/initier/comparer
- [x] Logique prix bundles: zones A1-D1, paquets fiscaux, desglose structuré
- [x] Cross-referencing: Precios Oficiales > Servicios BD > Herramientas
- [x] Nouveau tool search_bundles (commerce_type + zone → pricing)
- [x] Bundle enrichment automatique dans _consolidate_context

### 1.5 Auto-critique & corrections ✅
- [x] Fix chat_stream: ajouté bundle enrichment (manquait)
- [x] Fix MessageList: supprimé handleScroll mort
- [x] Fix search_bundles: zone filtering avec city_zone_map
- [x] Fix ChatPage: i18n pour bouton stop

### Fichiers modifiés Phase 1
| Fichier | Changement |
|---------|-----------|
| MessageList.tsx | Supprimé double scroll, détection scroll parent |
| ChatPage.tsx | Scrollbar visible, i18n stop button |
| gemini_service.py | System prompt v2 (3 langues) |
| chatbot_service_rag.py | _enrich_with_bundles + _consolidate_context v2 |
| chatbot_tools.py | Nouveau tool search_bundles |
| chatbot_routes.py | Endpoint admin reindex-legislacion |
| scripts/index_precios_structured.py | Nouveau extracteur structuré |
| data/legislacion/*.pdf | 7 PDFs copiés dans backend |

---

## PHASE 2: INTELLIGENCE RAG (Bundles + Tools + Routing)

### 2.1 Nouveaux tools function-calling
- [ ] `search_bundles(commerce_type, zone_code)` - recherche bundles
- [ ] `calculate_bundle_price(bundle_code, zone_code)` - devis structuré
- [ ] `get_zone_info(city_name)` - identifier zone
- [ ] `start_workflow(workflow_code)` - lien wizard Facil
- [ ] `get_document_requirements(workflow_code)` - docs requis

### 2.2 Query Rewriting + Intent Detection
- [ ] Classifier intent (info/prix/procédure/démarrer/comparer)
- [ ] Rewriter query pour optimiser recall RAG
- [ ] Détecter entités (ville, type commerce, service)

### 2.3 Context Consolidation v2
- [ ] Intégrer bundles dans consolidation (zone + items + totaux)
- [ ] Cross-referencing intelligent (prix BD + procédure PDF)
- [ ] Source routing (prix -> bundles, procédure -> PDFs)

### 2.4 Hybrid Search
- [ ] Activer full-text search en plus de semantic
- [ ] Weighted scoring (70% semantic + 30% full-text)
- [ ] Re-ranking post-retrieval

### Checklist validation Phase 2
- [ ] "Prix restaurant Malabo" → tableau par zone avec totaux corrects
- [ ] "Pasaporte" → procédure + prix + proposition Facil
- [ ] "Ouvrir une pharmacie" → bundle CLINICAS_FARMACIAS avec zones
- [ ] Tools appelés automatiquement par l'agent
- [ ] Intent correctement détecté

---

## PHASE 3: UX AVANCÉE (Feedback + Streaming + Design)

### 3.1 Feedback utilisateur
- [ ] Boutons 👍/👎 sur chaque réponse
- [ ] Stockage feedback en BD
- [ ] Dashboard admin feedback analytics

### 3.2 Streaming optimisé
- [ ] SSE robuste avec retry
- [ ] Affichage progressif markdown
- [ ] Indicateur de raisonnement ("Recherche en cours...")

### 3.3 Mode devis interactif
- [ ] Composant tableau prix par zone
- [ ] Sélecteur ville/zone inline
- [ ] Bouton "Démarrer cette procédure"

### 3.4 Suggestions contextuelles
- [ ] Suggestions dynamiques basées sur la conversation
- [ ] "Vous pourriez aussi être intéressé par..."
- [ ] Lien direct vers workflow wizard

### Checklist validation Phase 3
- [ ] Feedback collecté et visible admin
- [ ] Streaming fluide sans coupure
- [ ] Devis prix affiché en tableau
- [ ] Suggestions pertinentes après chaque réponse

---

## PHASE 4: SÉCURITÉ + PERFORMANCE

### 4.1 Sécurité
- [ ] Input sanitization (anti prompt-injection)
- [ ] XSS hardening (remplacer dangerouslySetInnerHTML)
- [ ] Rate limiting adaptatif (progressive backoff)
- [ ] Content filtering responses

### 4.2 Performance
- [ ] Embedding cache (queries fréquentes)
- [ ] Connection pooling optimisé
- [ ] Response streaming backend optimisé
- [ ] CDN pour assets chat

### 4.3 Monitoring
- [ ] Logging structuré (query, intent, sources, response_time)
- [ ] Alerting qualité (réponses fallback > 10%)
- [ ] Dashboard analytics chatbot

### Checklist validation Phase 4
- [ ] Prompt injection bloquée
- [ ] XSS impossible
- [ ] Temps réponse < 2s p95
- [ ] Monitoring actif

---

## DONNÉES DE RÉFÉRENCE

### Commerce Zones (12 zones)
| Zone | Code | Tier | Exemple ville |
|------|------|------|---------------|
| Capitales de Regiones | A1 | A | Malabo, Bata |
| Capitales de Regiones (2) | A2 | A | - |
| Capitales de Regiones (3) | A3 | A | - |
| Capitales de Provincias | B1 | B | - |
| Capitales de Provincias (2) | B2 | B | - |
| Capitales de Provincias (3) | B3 | B | - |
| Capitales Distritales | C1 | C | - |
| Capitales Distritales (2) | C2 | C | - |
| Capitales Distritales (3) | C3 | C | - |
| Consejos de Poblados | D1 | D | - |
| Consejos de Poblados (2) | D2 | D | - |
| Consejos de Poblados (3) | D3 | D | - |

### Bundles (10 types commerces)
| Bundle | Code | Commerce |
|--------|------|----------|
| Abacerias | ABACERIAS | abaceria |
| Bares y Restaurantes | BARES_RESTAURANTES | bar_restaurante |
| Cafeterias-Pastelerias | CAFETERIAS_PASTELERIAS | cafeteria_pasteleria |
| Carpinterias | CARPINTERIAS | carpinteria |
| Clinicas, Farmacias | CLINICAS_FARMACIAS | clinica_farmacia |
| Discotecas | DISCOTECAS | discoteca |
| Ferreterias | FERRETERIAS | ferreteria |
| Talleres y Bloquerias | TALLERES_BLOQUERIAS | taller_bloqueria |
| Talleres Artesanales | TALLERES_ARTESANALES | taller_artesanal |
| Video Clubs | VIDEOS_CLUBS | video_club |

### Prix exemple: BARES_RESTAURANTES par zone
| Zone | Total XAF |
|------|-----------|
| A1 (Capitales Regiones) | 855,350 |
| A2 | 459,750 |
| B1 (Capitales Provincias) | 322,000 |
| A3 | 227,750 |
| C1 (Capitales Distritales) | 212,000 |
| B2 | 182,000 |
| D1 (Consejos Poblados) | 174,000 |
| C2 | 156,000 |
| B3 | 138,000 |
| D2 | 129,000 |
| C3 | 106,000 |
| D3 | 87,000 |
