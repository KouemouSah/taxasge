# Plan : Phase 4 — Reports Supervisor + Escalations Résolues

## Contexte

Phase 3 (i18n hardening + supervisor opérationnel) est **100% COMPLÈTE** (commit `7d0b1080`).
Le frontend supervisor a 8 pages fonctionnelles, mais manque :
1. Une page **Reports** centralisant les données éparpillées (dashboard, performance, workload, rules effectiveness, escalations)
2. Une page **Escalations résolues** (directory `/escalations/resolved/` existe mais vide)

L'infrastructure backend est riche — 21 endpoints supervisor + 9 endpoints statistics + 13 endpoints treasury. Aucun nouveau endpoint n'est nécessaire.

---

## Tâche A : Page Escalations Résolues

### Principe
Copier la structure de `pending/page.tsx` (954 lignes) et la simplifier :
- Query : `status_filter=resolved` (backend le supporte déjà — lignes 1028-1036 supervisor_routes.py)
- **Lecture seule** : aucune mutation, aucun dialog d'action, pas de bulk actions
- **Pas d'auto-refresh** : données historiques (résolutions des 7 derniers jours)
- **1 dialog** : détails seulement (pas resolve/approve/reject/reassign)
- Colonnes supplémentaires : date de résolution, résolu par (tiré de l'historique)

### Fichiers

| Fichier | Action |
|---------|--------|
| `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/escalations/resolved/page.tsx` | CRÉER |
| `packages/web/messages/es.json` | MODIFIER (3 clés) |
| `packages/web/messages/fr.json` | MODIFIER (3 clés) |
| `packages/web/messages/en.json` | MODIFIER (3 clés) |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/page.tsx` | MODIFIER (ajouter lien) |

### Clés i18n à ajouter (sous `supervisor.escalations.*`)
- `noResolved` : "No hay escalaciones resueltas" / "Aucune escalation résolue" / "No resolved escalations"
- `resolvedAt` : "Resuelto el" / "Résolu le" / "Resolved on"
- `resolvedBy` : "Resuelto por" / "Résolu par" / "Resolved by"

### Implémentation — Split View (pas de Dialog)
- ~300 lignes (vs 954 pour pending — pas de mutations/dialogs/bulk)
- Même interfaces `Escalation`, mêmes helpers `getPriorityLevel`, `PRIORITY_COLORS`
- Query : `GET /supervisor/escalations?status_filter=resolved&include_resolved=true`
- **Layout split view** : table à gauche (60%) + panneau détails à droite (40%)
  - Clic sur une ligne → affiche détails dans le panneau droit (pas de dialog)
  - Panneau vide par défaut avec message "Sélectionner une escalation"
  - Panneau détails : reference, type, priority badge, escalated by/at, reason, resolved at/by
- Search + Priority filter (même pattern que pending)
- Mobile : table full-width, clic → expand inline (pas de split)

### Lien navigation (supervisor/page.tsx)
Ajouter un lien secondaire sous le bouton "Escalaciones Pendientes" :
```tsx
<Link href={`/${locale}/dashboard/supervisor/escalations/resolved`}>
  <Button variant="ghost" size="sm" className="w-full mt-2">
    {t('nav.resolvedEscalations')}
  </Button>
</Link>
```

---

## Tâche B : Page Reports Supervisor

### Principe
Page unique avec 3 onglets, **zéro nouveau endpoint backend**. Orchestre les endpoints existants.

### Route
`/supervisor/reports`

### Architecture : 3 onglets

#### Onglet 1 : Vue d'ensemble (Performance)
**Endpoints consommés :**
- `GET /supervisor/dashboard` → stats team, escalations, assignments, performance
- `GET /supervisor/agents` → liste agents avec métriques
- `GET /supervisor/rules/effectiveness/report` → efficacité des règles

**Contenu :**
- 4 stat cards (mêmes que dashboard mais regroupés) : agents actifs, SLA compliance, avg response time, quality score
- Table top agents (top 5 par success_rate)
- Table efficacité des règles (triée par effectiveness_score DESC)

#### Onglet 2 : Charge de travail (Workload)
**Endpoints consommés :**
- `GET /supervisor/workload/balance` → rapport balance + recommendations
- `GET /supervisor/agents` → capacité par agent

**Contenu :**
- Balance score avec badge couleur (excellent/good/moderate/poor)
- Recommendations list
- Distribution chart (CSS bars) : agents par tranche de capacité (0-25%, 25-50%, 50-75%, 75-100%)
- Table agents triés par capacity_percentage DESC

#### Onglet 3 : Exports
**Endpoints consommés :**
- `GET /supervisor/export/assignments` → CSV download (blob pattern, déjà implémenté Phase 3)

**Contenu :**
- Formulaire export : sélection période (7j/30j/90j/365j), agent optionnel
- Bouton "Télécharger CSV"
- Note : pas d'historique d'exports (pas de table treasury_exports pour supervisor)

### Fichiers

| Fichier | Action |
|---------|--------|
| `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/reports/page.tsx` | CRÉER |
| `packages/web/messages/es.json` | MODIFIER (~15 clés) |
| `packages/web/messages/fr.json` | MODIFIER (~15 clés) |
| `packages/web/messages/en.json` | MODIFIER (~15 clés) |
| `packages/web/src/app/[locale]/(dashboard)/dashboard/supervisor/page.tsx` | MODIFIER (ajouter card Reports) |

### Clés i18n (sous `supervisor.reports.*`)
```
reports.title = "Informes" / "Rapports" / "Reports"
reports.description = "Informes y métricas del equipo" / "Rapports et métriques de l'équipe" / "Team reports and metrics"
reports.overview = "Vista General" / "Vue d'ensemble" / "Overview"
reports.workloadTab = "Carga de Trabajo" / "Charge de travail" / "Workload"
reports.exportsTab = "Exportaciones" / "Exportations" / "Exports"
reports.topAgents = "Mejores Agentes" / "Meilleurs Agents" / "Top Agents"
reports.rulesEffectiveness = "Eficacia de Reglas" / "Efficacité des Règles" / "Rules Effectiveness"
reports.timesApplied = "Aplicaciones" / "Applications" / "Applications"
reports.matchRate = "Tasa de coincidencia" / "Taux de correspondance" / "Match Rate"
reports.effectivenessScore = "Puntuación" / "Score" / "Score"
reports.capacityDistribution = "Distribución de Capacidad" / "Distribution de Capacité" / "Capacity Distribution"
reports.exportPeriod = "Período de exportación" / "Période d'exportation" / "Export Period"
reports.selectPeriod = "Seleccionar período" / "Sélectionner une période" / "Select period"
reports.downloadCsv = "Descargar CSV" / "Télécharger CSV" / "Download CSV"
reports.noRules = "No hay reglas con suficientes aplicaciones" / "Aucune règle avec suffisamment d'applications" / "No rules with enough applications"
```

### Card navigation (supervisor/page.tsx)
Ajouter une 5ème card dans la grille (passer de 4 cols à 5, ou 2 rangées) :
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileBarChart className="h-5 w-5 text-teal-500" />
      {t('nav.reports')}
    </CardTitle>
    <CardDescription>{t('reports.description')}</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href={`/${locale}/dashboard/supervisor/reports`}>
      <Button variant="outline" className="w-full">
        {t('nav.reports')}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  </CardContent>
</Card>
```

### Implémentation
- ~400 lignes total
- Pattern Tabs de shadcn/ui pour les 3 onglets
- Composant `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- 3 useQuery indépendants (dashboard stats, workload balance, agents list)
- 1 useQuery conditionnel pour rules effectiveness (activé quand onglet Overview visible)
- Export : même blob download pattern que Phase 3

---

## Modification supervisor/page.tsx

Actuellement 4 cards dans `grid md:grid-cols-2 lg:grid-cols-4` :
1. Team Management → `/team/agents`
2. Workload → `/team/workload`
3. Assignment Rules → `/assignments/rules`
4. Escalations → `/escalations/pending`

**Après modification** : 5 cards dans `grid md:grid-cols-2 lg:grid-cols-3` (2+3) ou garder la grille de 4 et mettre Reports + resolved escalation link dans le 4ème :

**Option retenue** : Passer à `lg:grid-cols-5` (5 colonnes sur grand écran) pour garder tout sur une ligne. Ajouter :
5. Reports → `/reports`

Et ajouter le lien `/escalations/resolved` sous le bouton escalations existant.

---

## Ordre d'exécution

| # | Tâche | Fichiers | Lignes estimées |
|---|-------|----------|-----------------|
| 1 | Escalations résolues | 1 TSX + 3 JSON + 1 TSX (nav) | ~260 |
| 2 | Reports page | 1 TSX + 3 JSON + 1 TSX (nav) | ~420 |
| 3 | Type check + lint | - | - |
| 4 | Commit + push | - | - |

**Total** : 2 nouvelles pages, ~680 lignes, 5 fichiers modifiés, 2 fichiers créés

---

## Vérification

- [ ] `npm run type-check` passe
- [ ] ESLint passe (0 erreurs)
- [ ] Page `/supervisor/escalations/resolved` affiche les escalations résolues (7 derniers jours)
- [ ] Page `/supervisor/reports` affiche 3 onglets fonctionnels
- [ ] Onglet Overview : stats + top agents + rules effectiveness
- [ ] Onglet Workload : balance score + distribution + agents
- [ ] Onglet Exports : formulaire + download CSV
- [ ] Liens navigation depuis la page supervisor dashboard
- [ ] i18n : textes corrects en ES, FR, EN
- [ ] Push → GitHub Actions build passe
