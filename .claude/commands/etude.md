# MISSION : AUDIT & MISE À NIVEAU DES MODULE 

l'objectif est de rédiger le plan d'implémentation et intégrations des workflows tel que definis dans le fichier 
Documentations/workflow/Rapport_Architecture_TaxasGE.md dans le système actuel dans packages/backend

## 🛑 CONSIGNE PRIORITAIRE : THINK FIRST & PLAN FIRST

#Processus de planification

## 1. Analyse du CONTEXTE
charger les contexts pertinents
Lis et Analyse tout les fichiers du dossier Documentations/workflow/*
Exemple de fichier commande : .claude/commands/ai-chatbot.md , module-ocr-extraction.md,


## 2. Questions à se poser
Noustraitons uniquement le cas et workflow de service declaration:


<thinking>
**Fonctionnel**
1.Liste les fichiers trouvés et analysés ensuite dis ce que penses-tu de cette analyse?
2.Qules sont les cas d'usages?
3.Quels sont les règles métiers?
4.Quels seont les différents workflows recencés? 
5.Quels rôles sont impliqués?
6.Quels validations?
**Techniques**
1.Quels sont les modules et fonctionnalités concernés?
2.Quels sont les modules actuels concernés?
3.Nouvelles APIs?
4.Analyse des manques du schema DB actuel pour intégration des services IA.
5.Penses-tu que le schema actuel de la base de données est idéal pour cette intégration selon les fonctionnalités à venir? 
6.Quels sont les ou
tils que tu proposes à utiliser? 
Quels outils AI gratuit peuvent êtres utiliser?
7.COmment penses-tu qu'on peux utiliser Google AI Studio pour les service AI?
8.Quels outils,framework,model opensources AI gratuit peut-on utiliser dans le cas où nous ne voulons pas utiliser les services de Google?
9.quelle architecture de deploiement pour ces agents proposes-tu?
10.Peut-on remplacer certains agents par des algorithme sophistiqués et performant?

**intégration**
1.quels sont les modules a créer?
2.Quels impactent sur les workflows existants? 
3.Ces modules sont-ils compatibles? dois tu les modifier? 
4.Notification à déclencher?
</thinking>

## 3. Plan d'Action
Produire :
1. rapport un plan de travail enregistrer dans Documentations/workflow/  avec une checklist par module avec chacun son workflow et foncitonnalités de son plan
2. Liste des fichiers à créer/modifier
3. ordre d'implémentation (travail en mode worktree et une branche par module)
4. points de vigilence
5. Test à prévoir
6. Les fichiers commandes d'impélementation de chaque modules mis a jour (si deja existant), créer pour les nouveaux modules
dans le dossier .claude/commands/

#Validation du PLAN

Avant d'implémenter :
- [] Plan cohérent avec l'architecture
- [] respect des conventions
- [] pas de breaking changes
- [] tests prévus

##Output
Produire un plan structuré en markdown avec :
- Objectif clair
- Fichier impactés
- Etapes numérotés
- point d'attention
