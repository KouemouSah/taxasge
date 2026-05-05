---
description: Invoke the LogRocket Observability Agent to wire session replay (web + mobile + inspector) production-grade on this project. Reusable across projects via infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md.
argument-hint: [setup|wire|audit-pii|fix <issue>] (optional, default = full pipeline)
---

# LogRocket Observability Agent

Lis et exécute **strictement** le document
`infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md` (7 phases avec gates).

## Comportement selon $ARGUMENTS

- **`setup`** → Phase 0 + Phase 1 uniquement (compte, App ID, stack detection)
- **`wire`** → Phase 2 + Phase 3 + Phase 4 (wrapper + PII + secret topology)
- **`audit-pii`** → Phase 3 ciblée (audit DOM/JSX redaction sur projet existant)
- **`fix <issue>`** → garde-fou ciblé (ex: `fix minsdk-24-25`)
- **vide** → flux complet 0 → 7

## Règles non-négociables

1. **Phases dans l'ordre** : ne pas sauter de gate. Demander validation utilisateur entre chaque phase.
2. **Phase 0 obligatoire** : ne pas commencer Phase 1 sans App ID + surfaces identifiées + niveau compliance connu.
3. **Phase 3 (PII redaction) bloquante si compliance** : sur projet régulé (RGPD/HIPAA/PCI), aucune Phase 4-7 sans audit PII signé par l'utilisateur dans le commit message.
4. **Identify policy stricte** : `id + role + locale` only. Pas de `email`, `phone`, `nif`, `address`. TypeScript signature `SafeUser` enforced.
5. **Pas de push git automatique** : à la fin, demander explicitement « OK pour `git push origin <branch>` ? ».
6. **Pas de App ID en clair dans la conversation** : toujours via `.env` gitignored (même si l'App ID est public dans le bundle, l'hygiène est consistante).
7. **Toujours `--build-arg`** pour `NEXT_PUBLIC_*`, JAMAIS `--set-env-vars` Cloud Run.
8. **Toujours `--visibility plaintext`** sur EAS pour `EXPO_PUBLIC_*`, JAMAIS `secret` (redacted du bundle).
9. **Toujours `minSdkVersion 25`** en 2 endroits (`android/build.gradle` + `app.json plugins`).
10. **Toujours `.easignore`** quand `/android` est dans `.gitignore`.

## Sortie attendue

À la fin du flux complet (sans args) :
- 1 wrapper SDK par surface (`<src>/core/observability/logrocket.ts`)
- 1 Provider client component (web) ou wrapper deferred-effects (mobile)
- 4 layers PII redaction actifs (L1 SDK options, L2 sanitizers, L3 DOM/JSX, L4 identify policy)
- Secret en SM/Key Vault/Secrets Manager + mirror CI (GitHub) + EAS (mobile)
- Mobile : `minSdkVersion 25` + Maven repo + `.easignore` (si applicable)
- Sentry bridge actif si Sentry présent
- README projet à jour
- Smoke test : sessions visibles dans LogRocket UI
- Commits locaux sémantiques (1 par phase ou groupés)
- Demande explicite de push

## Anti-patterns à refuser

L'agent **doit refuser** si l'utilisateur demande :
- Coller l'App ID directement dans la conversation (au lieu de `.env`)
- Sauter Phase 3 (PII redaction) sur un projet régulé
- Bypasser l'identify policy via `as any` ou ajouter `email` / `phone` / `nif` au payload
- Push git sans validation explicite
- Hardcoder l'App ID dans le code source
- Utiliser `--set-env-vars` Cloud Run pour des `NEXT_PUBLIC_*` (cf. Faiblesse 3)
- Garder `minSdkVersion 24` sur projet RN avec LogRocket (cf. Faiblesse 4)
- Marquer EAS env var comme `secret`-typed pour `EXPO_PUBLIC_*` (cf. Faiblesse 7)
- Init `LogRocket.init()` direct dans le main thread d'une app RN (cf. Faiblesse 1)

Dans ces cas, expliquer la raison et proposer la voie correcte.

## Garde-fous actifs (faiblesses gérées pendant le flux)

L'agent **N'enregistre PAS** ces faiblesses comme dette technique. Il les
**neutralise pendant l'exécution** via les garde-fous §10 du document agent :

| # | Faiblesse | Garde-fou pendant l'exécution |
|---|---|---|
| 1 | Init eager bloque cold-start (RN) | Phase 2.4 — wrapper dans `InteractionManager.runAfterInteractions` |
| 2 | `as any` bypass identify policy | Phase 3.5 — TS signature stricte + lint rule |
| 3 | `NEXT_PUBLIC_*` bake-time vs runtime | Phase 4.2 — `--build-arg` Docker, pas `--set-env-vars` |
| 4 | `minSdkVersion 24 vs 25` LogRocket RN | Phase 5.1 — bump en 2 endroits (gradle + app.json) |
| 5 | Maven repo LogRocket pas Central | Phase 5.2 — déclaration explicite des extra Maven repos |
| 6 | `.gitignore /android` strip à l'upload EAS | Phase 5.3 — `.easignore` override |
| 7 | App ID `secret`-typed sur EAS = redacted | Phase 4.3 — `--visibility plaintext` |
| 8 | Free tier 1K sessions/mois saturée | Phase 0.2 — alerte si stack > 1 surface |

**Si une faiblesse non-listée est rencontrée**, l'agent doit :
1. Documenter la nouvelle faiblesse dans §10 du document agent
2. Proposer un garde-fou actif (pas juste un disclaimer)
3. Mettre à jour cette table

→ L'agent **n'autorise PAS** un flux qui aurait des faiblesses non-couvertes.

## Reproductibilité multi-projets

Cet agent fonctionne sur **n'importe quel projet** web et/ou mobile :
1. Copier `infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md` dans le nouveau repo
2. Copier `.claude/commands/logrocket-observability.md` (ce fichier)
3. Adapter les chemins (`src/core/observability/` ou équivalent du projet)
4. Lancer `/logrocket-observability` → l'agent guide depuis zéro

Le projet **Facil (taxasge)** a servi de validation : 3 surfaces (web,
mobile, inspector) wirées en une session, 8 pièges neutralisés. Voir
`.claude/plans/OBSERVABILITY_STACK.md` pour le bilan complet.
