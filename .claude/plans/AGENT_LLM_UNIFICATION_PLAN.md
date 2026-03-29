# Agent LLM Unification — Upgrade cerveau + prompts pour 12 agents

**Date** : 2026-03-29
**Statut** : PLANIFIÉ
**Objectif** : Faire bénéficier les 12 agents existants des améliorations du chatbot (Gemini 2.5, CoT, formats, self-reflection) sans casser l'architecture.

## Principe : 80% du gain = améliorations de PROMPT, pas de modèle

## 7 étapes (risque croissant)

| # | Étape | Risque | Fichiers |
|---|-------|--------|----------|
| 1 | Upgrade modèle VertexAI → gemini-2.5-flash | LOW | vertex_ai_manager.py |
| 2 | Chain-of-Thought dans les prompts agents | ZERO | 4 system prompts |
| 3 | 15 formats de présentation | ZERO | 4 system prompts |
| 4 | Temperature/top_p optimisés | LOW | base_analyst_service.py, llm_agent_mixin.py |
| 5 | Thinking budget sélectif | MEDIUM | base_analyst_service.py, tool_registry.py |
| 6 | Self-reflection (Treasury/Admin/Supervisor) | MEDIUM | base_analyst_service.py, tool_registry.py |
| 7 | 8 nouveaux tools GAP métier | MEDIUM | agent_decision_tools.py (NOUVEAU) |
