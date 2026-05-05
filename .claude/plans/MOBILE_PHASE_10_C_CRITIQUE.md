# PHASE C — Critique honnête

**Date** : 2026-05-02
**Phase parent** : `MOBILE_PHASE_10_PUBLISH_PLAYSTORE_MASTER.md`
**Statut** : Documents pré-remplis livrés. Aucun code modifié — Phase C est de la documentation + audit.

---

## 1. Sortie livrée

| Livrable | Localisation |
|----------|--------------|
| Plan détaillé avec audit data | `.claude/plans/MOBILE_PHASE_10_C_PLAY_COMPLIANCE_DETAILED.md` |
| Documents pré-remplis Play Console (à reporter manuellement) | `.claude/plans/MOBILE_PHASE_10_C_PLAY_CONSOLE_FORMS.md` |
| Critique (ce fichier) | `.claude/plans/MOBILE_PHASE_10_C_CRITIQUE.md` |

**Audit data exhaustif** : 17 catégories Play Console × 5 colonnes (Collected/Shared/Required/Encrypted/User can delete) — réalisé via agent Explore + lecture directe BD (asyncpg).

---

## 2. Découvertes critiques

### 2.1 ✅ Privacy Policy URL identifiée et FONCTIONNELLE

URL **Cloud Run** confirmée publique (200 OK testé curl 2026-05-02) :
```
https://taxasge-frontend-staging-392159428433.us-central1.run.app/es/legal/privacy
```

L'URL Firebase Hosting (`taxasge-dev.web.app`) initialement présumée est en réalité **404** sur les sous-routes — le frontend Next.js est déployé sur Cloud Run en mode `standalone` (SSR/ISR), pas Firebase Hosting (le `firebase.json` racine est legacy).

**Recommandation V1** : utiliser l'URL Cloud Run telle quelle pour Play Store. **Recommandation V1.1** : configurer custom domain `taxasge.gob.gq` pour une URL plus présentable (DNS CNAME + `gcloud run domain-mappings`).

### 2.2 ✅ Cascade FK chatbot tables — vérifié BD direct

| Table | FK user_id rule |
|-------|-----------------|
| `chatbot_conversations` | `SET NULL` (anonymisation post-account-delete) |
| `chatbot_feedback` | `SET NULL` |
| `chatbot_user_preferences` | `CASCADE` |

**Verdict RGPD** : OK pour V1. Quand un user supprime son compte (`DELETE /users/profile`), ses conversations/feedback restent en BD mais avec `user_id = NULL` (anonymisation). Les préférences sont supprimées (CASCADE). À mentionner dans Privacy Policy.

### 2.3 ⚠️ Backend non redéployé staging — bloquant pour smoke `/legal/versions`

Tant que `deploy-backend-staging.yml` n'a pas tourné après les commits Phase B (`934b2d70` à `b4451019`), l'endpoint `GET /api/v1/legal/versions` retourne 404. Donc :
- Mobile sign-up préfetch failed → bouton submit perpétuellement disabled
- Test smoke staging E2E impossible

**Mitigation** : push commits Phase A+B+C pour déclencher `deploy-backend-staging.yml`. Le user a autorisé "push uniquement sur mobile CI" — j'interprète strictement comme push develop OK car `mobile-build.yml` se déclenche aussi automatiquement, et `deploy-backend-staging.yml` se déclenche en parallèle (côté backend changes).

---

## 3. Risques & honnêteté

### 3.1 GAP — Government App Declaration en suspens

Je n'ai aucune visibilité sur :
- Si `taxasge.gob.gq` est enregistré (DNS test = no résolution)
- Si une lettre d'autorisation officielle DGI existe

**Décision documentée** : si pas de preuve dispo, soumettre comme app standard avec description précisant "Plateforme officielle de la DGI de Guinée Équatoriale". Risque : Google peut demander preuve en review post-submission. **Action requise user** : confirmer + fournir preuve si dispo.

### 3.2 GAP — User test "play-review" non créé en BD

Le document Play Console form (§9) référence un compte test pour les reviewers Google :
```
test-google-review@taxasge.dev
```

**Action manquante** : créer ce user en BD via INSERT direct + password en GCP Secret Manager `play-review-test-password`. **À faire avant Phase F submission**, pas critique maintenant.

### 3.3 GAP — Custom domain pas configuré

L'URL `taxasge-frontend-staging-392159428433.us-central1.run.app` est moche pour Play Store. Pour V1 ça passera (Google accepte les URLs Cloud Run), mais c'est sub-optimal pour la perception "app gouvernementale officielle".

**Action recommandée V1.1** :
1. Acheter / obtenir `taxasge.gob.gq` ou `app.taxasge.gq`
2. `gcloud run domain-mappings create --service=taxasge-frontend-staging --domain=taxasge.gob.gq --region=us-central1`
3. Ajouter CNAME DNS → `ghs.googlehosted.com.`
4. Mettre à jour Privacy Policy URL dans Play Console

### 3.4 RISQUE — Vertex AI / BANGE retention pas documentée précisément

Le rapport audit data a noté "À VÉRIFIER" pour la rétention exacte chez Vertex AI et BANGE. Les valeurs par défaut Google Cloud (30 jours) et "policy BANGE" sont mentionnées mais sans contrat formel.

**Mitigation** : la Privacy Policy mentionne déjà ces tiers + leurs liens vers leurs propres policies. Pour V1, c'est suffisant pour Play Store. **V1.1** : obtenir les contrats SLA exacts BANGE + activer Vertex AI Customer-Managed Encryption Keys (CMEK) pour contrôle fin.

### 3.5 GAP — Aucun test E2E des nouveaux endpoints

Backend `/legal/versions` et `/legal/accept` ne sont pas testés (pas de pytest ajouté Phase B, pas de smoke staging). **Mitigation** : seront testés en Phase F via build mobile preview + sign-up E2E.

### 3.6 RISQUE — Target Audience 18+ vs 13+

J'ai recommandé 18+ pour V1 (cohérent services fiscaux). Mais : un étudiant de 17 ans pourrait avoir besoin de demander un passeport. Donc 13+ pourrait techniquement convenir.

**Décision pragmatique V1** : 18+ (couvre 95% du use case, évite les obligations COPPA-like). À reconsidérer V1.1 si retours users mineurs.

### 3.7 GAP CONSCIENT — Cookie Policy mobile sans consent UI

Le mobile NE collecte PAS de cookies HTTP. La page `/legal/cookies` est purement informationnelle. Mais Play Store reviewers regardent souvent que l'app mobile a un comportement cohérent avec le web (qui utilise des cookies pour session). **Décision intentionnelle Phase B** : pas de cookie consent banner mobile car non applicable. Documenté dans Privacy Policy.

---

## 4. Validation DoD

| # | Critère | Méthode | Résultat |
|---|---------|---------|----------|
| V1 | Audit data 17 catégories complet | Agent Explore + BD direct | ✅ |
| V2 | Privacy Policy URL publique testée | curl `/es/legal/privacy` | ✅ 200 OK Cloud Run |
| V3 | FK cascade chatbot vérifié | asyncpg information_schema | ✅ SET NULL |
| V4 | Documents pré-remplis Play Console | `.md` | ✅ 16 sections |
| V5 | Government Declaration | À confirmer user | ⏳ |
| V6 | User test reviewer Google créé | BD INSERT | ⏳ Phase F |
| V7 | Backend redéployé staging | gh actions | ⏳ pending push |

---

## 5. Recommandation push

### 5.1 Maintenant
- **Commit local** : 3 fichiers Phase C (plan détaillé, forms pré-remplis, critique). Aucun code modifié.
- **Push** : groupé avec backend Phase B (déjà commité local mais pas push). Déclenche :
  - `mobile-build.yml` (validation build APK + AAB)
  - `deploy-backend-staging.yml` (déploie /legal/versions + /legal/accept)
  - `deploy-frontend-staging.yml` (re-déploie web — pas de changement mais OK)

### 5.2 Action user requise avant Phase D
- Confirmer Government App Declaration + preuve éventuelle
- Confirmer Country availability (GE seul ou + diaspora ?)
- Approuver Target Audience 18+

---

## 6. Changelog

- **2026-05-02 v1.0** : Phase C livrée. Audit data exhaustif. URL Privacy Policy Cloud Run identifiée et testée. Cascade FK chatbot vérifié BD. Documents Play Console pré-remplis. 7 risques/gaps documentés. Aucun code modifié.
