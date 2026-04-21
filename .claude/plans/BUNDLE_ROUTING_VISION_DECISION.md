# Bundle Workflow — Vision de routing post-paiement

**Statut** : 🟡 DÉCISION MÉTIER REQUISE (pas un plan d'implémentation)
**Date** : 2026-04-14
**Auteur** : Session Claude (audit BD + code 2026-04-13/14)
**Dépendance** : Aucune — indépendant du hotfix `a0ad80a2` qui est en déploiement staging
**Public cible** : Produit + Tech lead + Stakeholders métier (ministères/entités)

---

## 1. Pourquoi ce document existe

Pendant le cycle de debug bundle (Phases 1-5 + hotfix P1.1), j'ai découvert que le système TaxasGE contient **deux hiérarchies de routing parallèles** pour les obligations fiscales, mais **seule la première est branchée en code**. La seconde est prévue en BD (tables, vues, agents créés) mais aucun code Python ne la consomme.

Cette divergence est invisible à l'usage normal car :
1. Pour les fee_types `chamber` et `municipal`, les deux hiérarchies sont identiques (collect == process)
2. Pour `tesoro`, la divergence existe mais est masquée par le fait qu'aucun bundle n'avait jamais fonctionné en production (bug Phase 1)

Le hotfix `a0ad80a2` débloque le flux et **révèle** ce choix architectural latent. Une décision produit est nécessaire pour aligner le code avec l'intention métier.

---

## 2. État vérifié en BD

### 2.1 Deux tables parallèles

| Table | Rows | Contenu | Contient des agents ? |
|---|---|---|---|
| `entities` | ~10 | TESORO, AYUNTAMIENTO, CAMARA_COMERCIO, MIN_HACIENDA, MIN_COMERCIO, MIN_AGRICULTURA, MIN_TURISMO, MIN_ELECTRICIDAD, MIN_INFORMACION, MINFP | ✅ OUI |
| `ministries` | 21 | Référentiel complet des ministères de Guinée Équatoriale, avec `ministry_code` (M-001 à M-021) | ❌ NON |

### 2.2 FK de `license_obligations`

```sql
license_obligations.ministry_id
    FK → ministries(id)   -- table référentielle
    (NE pointe PAS vers entities)
```

### 2.3 Distribution des agents par entité (staging)

| Entity | Total agents | Actifs | Utilisé par auto-assignment ? |
|---|---|---|---|
| TESORO | 3 | 2 | ✅ oui |
| AYUNTAMIENTO | 4 | 3 | ✅ oui |
| CAMARA_COMERCIO | 4 | 2 | ✅ oui |
| MIN_HACIENDA | 4 | 2 | ❌ jamais |
| MIN_AGRICULTURA | 4 | 2 | ❌ jamais |
| MIN_TURISMO | 4 | 2 | ❌ jamais |
| MIN_COMERCIO | 2 | 0 | ❌ jamais |
| MIN_ELECTRICIDAD | 2 | 0 | ❌ jamais |
| MIN_INFORMACION | 2 | 0 | ❌ jamais |
| MINFP | 0 | 0 | n/a |

**Observation** : 8 agents actifs dans les entités `MIN_*` ne reçoivent aucune assignment aujourd'hui.

### 2.4 Vue `v_obligation_routing` — deux routing_roles

```
routing_role = 'payment_validator'
    tesoro    → TESORO
    municipal → AYUNTAMIENTO
    chamber   → CAMARA_COMERCIO

routing_role = 'post_payment_processor'
    tesoro → MIN_HACIENDA
    tesoro → MIN_COMERCIO
    tesoro → MIN_INFORMACION
    tesoro → MIN_TURISMO
    tesoro → MIN_AGRICULTURA
    tesoro → MIN_ELECTRICIDAD
    (chamber et municipal: pas de post_payment_processor — collect == process)
```

**Recherche code** : `grep post_payment_processor packages/backend/app` → **0 match**. La vue existe mais personne ne la consomme.

### 2.5 Distribution réelle des obligations tesoro par ministère propriétaire

| Ministère propriétaire (via `ministries.id`) | Obligations tesoro |
|---|---|
| MINISTERIO DE COMERCIO Y PROMOCION PME | 35 (64 %) |
| MINISTERIO DE HACIENDA | 11 (20 %) |
| MINISTERIO DE INFORMACION | 7 (13 %) |
| MINISTERIO DE TURISMO | 1 (2 %) |
| MINISTERIO DE AGRICULTURA | 1 (2 %) |
| **Total tesoro** | **55** |

---

## 3. Question centrale à trancher

> **Qui émet le document/certificat/permis quand un citoyen paie une obligation dont le propriétaire est un ministère (ex: MIN_HACIENDA) mais dont le collecteur est TESORO ?**

Deux visions produit possibles, mutuellement exclusives.

---

## 4. Vision A — Tesoro comme guichet unique polyvalent

### 4.1 Principe
Les agents TESORO ont la responsabilité **complète** de l'obligation : ils collectent le paiement **ET** émettent le document final. Les ministères propriétaires (`license_obligations.ministry_id`) sont des informations de reporting uniquement, pas des destinataires opérationnels.

### 4.2 Conséquences organisationnelles
- 1 seul pool d'agents à former sur tous les types de documents tesoro (permis, licences, certificats)
- Nécessite des agents TESORO **généralistes** et très formés
- Les ministères délèguent complètement leur back-office à Tesoro
- Rapidité : pas de bascule inter-entités après paiement
- **Risque** : goulet d'étranglement si pic de volume sur un type spécifique
- Convient si Tesoro est vu comme un **Guichet Unique** administratif fort

### 4.3 Conséquences techniques
- Le code actuel (avec hotfix `a0ad80a2`) est **déjà correct** pour cette vision
- Action de cleanup : retirer `routing_role = 'post_payment_processor'` de la vue `v_obligation_routing` (migration)
- Action de cleanup : retirer les entités `MIN_*` de la table `entities` (ou les marquer `is_active=false`) et leurs 8 agents inactifs
- Action de cleanup : `license_obligations.ministry_id` devient strictement du reporting (pas de routing)

### 4.4 Questions métier à valider
- [ ] Tesoro a-t-il **la capacité humaine** de traiter les 55 types d'obligations tesoro ?
- [ ] Les 8 agents MIN_* aujourd'hui en staging sont-ils des agents **réels** en prod ? S'ils existent en vrai, que font-ils ?
- [ ] Comment les citoyens récupèrent-ils aujourd'hui leur document après un paiement tesoro ?
- [ ] Y a-t-il un accord formel (SLA, mémorandum) entre Tesoro et chaque ministère propriétaire ?

### 4.5 Effort technique
**S (petit)** — environ 1 jour :
- 1 migration SQL pour cleanup `v_obligation_routing`
- 1 migration SQL pour désactiver les entités MIN_* inactives (ou les archiver)
- Mise à jour de la documentation interne
- Aucun changement dans `bundle_workflow_service.py`
- Aucun changement frontend

---

## 5. Vision B — Fédération Tesoro-Ministères (routing 2-tiers)

### 5.1 Principe
Tesoro **collecte** le paiement (niveau 1). Après validation du paiement, une **assignment secondaire** est créée vers l'entité propriétaire du ministère (niveau 2) qui est responsable de l'émission du document final. Chaque ministère garde la maîtrise de son back-office et de ses documents.

### 5.2 Conséquences organisationnelles
- Les agents Tesoro restent spécialisés dans le **contrôle financier** (vérification paiement, reconciliation BANGE, comptabilité)
- Les agents MIN_* récupèrent la main sur **leur métier** (émission de certificats, suivi dossier, archivage)
- Séparation claire des responsabilités (SoD) — meilleure auditabilité
- Les citoyens voient un **flow en deux étapes** dans leur dashboard : "Paiement validé par Tesoro → En cours d'émission par Ministère X"
- **Risque** : délai ajouté entre paiement et émission (bascule inter-entités)
- Convient si les ministères veulent **garder leur autonomie** sur leurs documents

### 5.3 Conséquences techniques
- **Nouveau concept** : `processing_entity_id` distinct du `payment_entity_id` sur `service_payments`
- **Nouveau mapping** requis : `ministries.ministry_code` ↔ `entities.code` (ex: M-007 Hacienda ↔ MIN_HACIENDA)
  - Option 1 : ajouter une colonne `ministries.corresponding_entity_id` (FK vers entities)
  - Option 2 : JOIN par convention de nommage (fragile)
  - Option 3 : ajouter directement `entity_id` sur `license_obligations` (redondant avec ministry_id mais non-ambigu)
- **Nouveau listener** : event `PAYMENT_VALIDATED` → crée une assignment secondaire vers l'entité propriétaire
- **Nouveau dashboard** pour chaque MIN_* : "Mes obligations à traiter après validation Tesoro"
- **Nouveau statut** : `service_payment.workflow_status='processing_by_ministry'` (post-TESORO)
- **Notifications** : 2 niveaux (citoyen notifié à la validation Tesoro, puis à l'émission MIN_*)

### 5.4 Questions métier à valider
- [ ] Chaque ministère veut-il **réellement** reprendre la main sur son back-office ou est-ce optionnel ?
- [ ] Quel est le SLA attendu entre paiement Tesoro et émission MIN_* ? (24 h ? 72 h ?)
- [ ] Que se passe-t-il si un ministère ne traite pas une obligation dans le délai ? Escalation vers Tesoro ?
- [ ] Les agents MIN_* ont-ils les permissions RBAC nécessaires pour émettre les documents ? (probablement à configurer)
- [ ] Comment gérer les obligations où le `ministry_id` ne correspond à aucune entité `MIN_*` existante ? (7 ministères sur 21 ont une entité, 14 n'en ont pas)

### 5.5 Effort technique
**L (large)** — environ 5-8 jours ouvrés :
- **Phase 1** : décision du mapping `ministries ↔ entities` (1j)
- **Phase 2** : migration SQL pour ajouter le mapping + backfill des obligations existantes (1j)
- **Phase 3** : listener `PAYMENT_VALIDATED` + creation assignment secondaire (1j)
- **Phase 4** : dashboard MIN_* (agent view "mes obligations à traiter") (1-2j)
- **Phase 5** : workflow status tracking + transitions (processing_by_ministry → completed) (1j)
- **Phase 6** : notifications 2 niveaux + permissions RBAC MIN_* (1j)
- **Phase 7** : tests E2E + migration de rôles des agents existants si nécessaire (1j)

**Risque** : si les 14 ministères sans entité doivent aussi être gérés, il faut soit créer 14 nouvelles entités, soit définir une politique de fallback (vers TESORO) pour les ministères "orphelins".

---

## 6. Tableau comparatif rapide

| Critère | Vision A (Tesoro guichet unique) | Vision B (Fédération) |
|---|---|---|
| Code actuel | Déjà aligné | À réécrire |
| Effort | S (1j) | L (5-8j) |
| Agents formés | Tesoro polyvalent (pression forte) | Ministères spécialisés |
| Autonomie ministères | ❌ Aucune (délégation totale) | ✅ Complète |
| Délai citoyen | Court (1 étape) | Long (2 étapes) |
| Séparation des responsabilités (auditabilité) | Faible | Forte |
| Scalabilité | Risque goulet sur Tesoro | Bonne (charge répartie) |
| Infrastructure BD existante | Déjà payée (agents MIN_* dorment) | Déjà payée (à brancher) |
| Dette technique résultante | Cleanup de la vue + entities MIN_* | Code à écrire |
| Réversibilité | Moyenne (suppression de data) | Facile (ajout de code) |

---

## 7. Recommandations techniques (sans trancher le métier)

### 7.1 Si Vision A est choisie
- Ne **pas supprimer** immédiatement les entités `MIN_*` : les marquer `is_active=false` d'abord, observer 3 mois, puis drop
- Mettre à jour le README/ADR pour documenter le choix "Tesoro = guichet unique polyvalent"
- Supprimer les 5 lignes `post_payment_processor` de `v_obligation_routing` via migration

### 7.2 Si Vision B est choisie
- Commencer par la **Phase 1-2** (mapping ministries↔entities + backfill) **AVANT** toute logique de routing
- Le mapping doit être **explicite en BD** (nouvelle colonne + FK), pas par convention de nommage
- Gérer les ministères "orphelins" (sans entité) en fallback vers TESORO avec un log `WARNING`
- Créer un **feature flag** `FEATURE_MINISTRY_POST_PAYMENT_ROUTING` pour activer graduellement
- Rollout par entité : commencer avec MIN_HACIENDA (domaine financier, alignement naturel avec Tesoro), puis généraliser

### 7.3 Recommandation de séquencement
**Avant toute décision**, il faut obtenir une réponse de Tesoro + des ministères propriétaires sur la question 3 :
> "Aujourd'hui, quand un citoyen paie une obligation tesoro, qui émet le document physique/numérique et comment ?"

Cette réponse tranche **immédiatement** Vision A vs Vision B :
- Réponse "Tesoro fait tout" → Vision A confirmée
- Réponse "On transfère à Min_X manuellement" → Vision B justifiée (la dette technique existe déjà, on la paie en code)
- Réponse "On ne sait pas / ça dépend" → alarme rouge, besoin d'un workshop produit

---

## 8. Ce qui N'EST PAS dans ce document

- **Aucun code écrit** — c'est un document de décision, pas un plan d'implémentation
- **Aucune migration écrite** — les migrations viendront dans un plan Phase suivant si Vision B est choisie
- **Aucune modification du hotfix `a0ad80a2`** — le hotfix est **orthogonal** aux 2 visions et reste valide dans les deux cas
- **Aucune recommandation finale A ou B** — c'est une décision métier qui n'appartient pas à Claude

---

## 9. Prochaine étape

1. **Partager ce document** avec le tech lead et le product owner
2. **Identifier les stakeholders** (Tesoro, 5-6 ministères concernés)
3. **Poser la question 3** (§7.3) et recueillir les réponses
4. **Workshop de décision** (30 min max) pour trancher A ou B
5. Si décision prise → créer un plan d'implémentation dédié `BUNDLE_ROUTING_VISION_[A|B]_PLAN.md`
6. Si décision reportée → pas grave, le code actuel (hotfix `a0ad80a2`) est stable dans les deux cas

---

## 10. Annexe — Requêtes SQL de vérification

Pour relancer l'audit à tout moment :

```bash
"C:/Program Files/Odoo 17/python/python.exe" scripts/debug_bundle_p5_db_probe.py
```

Requêtes clés à exécuter dans Supabase SQL Editor :

```sql
-- Agents par entité MIN_*
SELECT e.code, COUNT(ap.id) FILTER (WHERE ap.is_active) AS active_agents
FROM entities e
LEFT JOIN agent_profiles ap ON ap.entity_id = e.id
WHERE e.code LIKE 'MIN_%'
GROUP BY e.code;

-- Ministères orphelins (ministries sans entité correspondante)
SELECT m.ministry_code, m.name_es
FROM ministries m
WHERE NOT EXISTS (
    SELECT 1 FROM entities e
    WHERE UPPER(e.code) LIKE '%' || UPPER(SPLIT_PART(m.name_es, ' ', 2)) || '%'
);

-- Obligations tesoro par ministère (distribution de charge)
SELECT m.name_es, COUNT(lo.id)
FROM license_obligations lo
JOIN ministries m ON m.id = lo.ministry_id
WHERE lo.fee_type = 'tesoro'
GROUP BY m.name_es
ORDER BY 2 DESC;
```

---

**Fin du document**. Aucune action requise côté code tant que la décision métier n'est pas prise. Le hotfix `a0ad80a2` reste valide et correct dans les deux visions.
