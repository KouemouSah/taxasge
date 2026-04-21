# Phase 2 — Fix HAUTE Frontend (Error Handling + Race Conditions)
**Date**: 2026-04-21
**Dépendance**: Phase 1 (Backend fixes)

---

## Architecture de la solution

### Pattern unifié pour tous les handlers
Chaque handler d'action (approve, reject, request_docs, escalate, resolve_escalation) doit:
1. Wrapper l'appel API dans try-catch
2. Sur succès: invalidation complète (list + preview + stats) + navigation next item
3. Sur erreur: throw pour que RequestPreview affiche le toast d'erreur
4. Ne PAS naviguer en cas d'erreur (l'item reste sélectionné)

### Fonction helper `_afterAction()`
Extraire le code dupliqué (invalidation + navigation) dans une fonction réutilisable.

### Guard `isProcessing` renforcé
Le raccourci clavier 'A' utilise `isProcessing` comme guard, mais `setIsProcessing(true)` est async.
Solution: utiliser un `useRef` pour un guard synchrone.

### Takeover: ajouter error toast

---

## Checklist

- [x] B4: try-finally dans handleApprove — erreur remonte à RequestPreview.catch ✅
- [x] B4: try-finally dans handleReject — idem ✅
- [x] B4: try-finally dans handleRequestDocuments — idem ✅
- [x] B4: try-finally dans handleEscalate — idem ✅
- [x] B4: try-finally dans handleResolveEscalation — idem ✅
- [x] B6: `['entity-queue-stats']` invalidé via afterAction() centralisé ✅
- [x] B5: `actionInFlightRef` (useRef) + guard synchrone dans handlers + clavier ✅
- [x] B8: toast.success/error dans handleTakeover + import toast from sonner ✅
- [x] afterAction() centralisé — invalidation + navigation next item ✅
- [x] Traductions: takeoverSuccess/takeoverError ajoutés (es/fr/en) ✅
- [x] Syntaxe: TypeScript transpile OK ✅
