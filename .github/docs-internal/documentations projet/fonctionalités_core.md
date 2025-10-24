Répartition des Fonctionnalités par Profil Métier
Ce document détaille l'ensemble des fonctionnalités de la plateforme e-Fiscal, organisées par type d'utilisateur. Il sert de référence pour le développement des interfaces (frontend) et la configuration des permissions (backend).
1. Profil : Contribuable (Citoyen & Entreprise)
C'est l'utilisateur final de la plateforme. Son expérience doit être simple, guidée et transparente. L'interface doit lui permettre de remplir ses obligations fiscales avec un minimum de friction.
[Image d'un tableau de bord utilisateur moderne et épuré]
Module 1 : Gestion de Compte & Entités
Tableau de Bord Personnel : Vue d'ensemble de ses déclarations en cours, des paiements à effectuer et des notifications importantes.
Gestion de Profil : Mise à jour des informations personnelles (nom, contact, préférences de langue).
Gestion des Entreprises :
Création et modification des profils d'entreprise (NIF, adresse, etc.).
Gestion des rôles et des accès pour les collaborateurs (inviter un comptable, un employé).
Gestion des Documents d'Identité : Téléversement et suivi de la validation des documents d'identité (CNI, NIF de l'entreprise, etc.) requis pour la vérification du compte.
Module 2 : Catalogue de Services & Déclarations
Exploration du Catalogue :
Moteur de recherche par mots-clés, filtrage par ministère, catégorie, etc.
Consultation détaillée de chaque service fiscal et de chaque type de déclaration (tarifs, documents requis, procédures à suivre).
Calculatrice Fiscale : Outil interactif pour estimer le coût d'un service fiscal en fonction de paramètres spécifiques.
Gestion des Favoris : Possibilité de marquer des services ou déclarations pour un accès rapide.
Module 3 : Soumission de Déclarations & Services
Workflow de Déclaration de Taxe :
Option 1 (Assistée par IA) : Téléversement d'un formulaire scanné (PDF, JPG).
Interface de validation côte à côte (scan vs. formulaire web) pour corriger les données extraites par l'OCR.
Option 2 (Manuelle) : Saisie directe des informations dans le formulaire web.
Téléversement des pièces justificatives requises.
Sauvegarde de la déclaration en tant que brouillon.
Soumission pour validation par un agent.
Workflow de Service Fiscal Direct :
Sélection d'un service.
Saisie des informations de base.
Passage direct à l'étape de paiement.
Module 4 : Paiement et Suivi
Notifications : Réception de notifications en temps réel (email, push mobile) à chaque changement de statut d'un dossier (approbation, rejet, demande de documents).
Suivi des Dossiers : Visualisation claire de l'étape actuelle du workflow pour chaque soumission.
Portail de Paiement :
Activation du bouton de paiement uniquement après approbation du dossier par un agent.
Choix de la méthode de paiement (Mobile Money, Carte, etc.).
Exécution du paiement via l'interface sécurisée du partenaire bancaire.
Historique et Archivage :
Accès à l'historique complet de toutes les soumissions et de tous les paiements.
Téléchargement des reçus de paiement et des documents finaux (attestations, etc.) générés par la plateforme.
2. Profil : Agent Ministériel (Validateur)
C'est l'utilisateur opérationnel de l'administration. Son interface doit être un outil de productivité, conçu pour traiter les dossiers rapidement, de manière sécurisée et traçable.
[Image d'un tableau de bord de traitement de dossiers avec des files d'attente]
Module 1 : Tableau de Bord & Gestion des Tâches
File d'Attente Personnalisée : Vue de tous les dossiers assignés à son ministère/département.
Priorisation Intelligente : Tri et filtrage des dossiers par urgence (SLA imminent), niveau d'escalade, complexité ou montant.
Verrouillage des Tâches : Possibilité de "verrouiller" un dossier pour le traiter, le rendant invisible aux autres agents et évitant les conflits. Le verrouillage est temporaire pour éviter les blocages.
Module 2 : Traitement et Validation des Dossiers
Interface de Validation :
Affichage centralisé de toutes les données soumises par le contribuable.
Visualiseur de documents intégré pour consulter les pièces justificatives sans les télécharger.
Actions sur le Workflow :
Approuver : Valide la soumission et déclenche la notification de paiement pour l'utilisateur.
Rejeter : Refuse la soumission avec obligation de fournir un motif de rejet clair.
Demander des Informations : Met le dossier en attente et envoie une notification à l'utilisateur pour demander des documents ou des précisions supplémentaires.
Escalader : Fait remonter le dossier à un superviseur pour une validation de second niveau.
Traçabilité :
Ajout de commentaires (internes pour l'administration ou visibles par le contribuable).
Toutes les actions sont enregistrées dans un journal d'audit immuable.
3. Profil : Administrateur Général (Superviseur)**
C'est l'utilisateur qui configure et supervise l'ensemble de la plateforme. Son interface est un centre de contrôle complet.
[Image d'un tableau de bord analytique avec des graphiques et des KPIs]
Module 1 : Gestion du Contenu et du Catalogue
Gestion de la Hiérarchie : CRUD (Créer, Lire, Mettre à jour, Supprimer) sur les ministères, secteurs et catégories.
Gestion des Services Fiscaux :
CRUD complet sur la table fiscal_services.
Configuration fine des règles de tarification (JSON), des périodes de validité et des pénalités.
Gestion des Types de Déclaration : CRUD sur les tax_declaration_types.
Module 2 : Gestion des Modèles (Templates)
Gestion des Procédures : CRUD sur les procedure_templates et leurs étapes (procedure_template_steps).
Gestion des Documents Requis : CRUD sur les document_types.
Association : Interface pour lier les procédures et les documents requis aux services fiscaux.
Gestion des Templates OCR : CRUD sur les form_templates et leurs zones de capture (form_zones) pour l'IA.
Module 3 : Administration des Utilisateurs et des Droits
Gestion des Utilisateurs : Vue de tous les utilisateurs, activation/suspension des comptes.
Gestion des Rôles : Assignation des rôles (agent, admin, etc.).
Gestion des Agents : Création des profils d'agents, assignation à un ministère, configuration de leurs permissions (montant max d'approbation, etc.).
Module 4 : Supervision et Reporting
Supervision des Workflows : Vue globale de tous les dossiers en cours sur la plateforme, avec la possibilité de réassigner une tâche bloquée.
Tableaux de Bord Analytiques :
Statistiques sur les revenus générés (par taxe, par période, par ministère).
Analyse des performances : délais moyens de traitement, g
