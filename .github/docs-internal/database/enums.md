# TYPES ET ENUMS COMPLETS - SCHÉMA TAXASGE v3.4

Guide complet des types énumérés PostgreSQL avec traductions trilingues pour le système fiscal de Guinée Équatoriale.

---

## 1. TYPES UTILISATEURS

### user_role_enum

**citizen**
- es: Ciudadano
- fr: Citoyen  
- en: Citizen

**business**
- es: Empresa
- fr: Entreprise
- en: Business

**accountant**
- es: Contable
- fr: Comptable
- en: Accountant

**admin**
- es: Administrador
- fr: Administrateur
- en: Administrator

**dgi_agent**
- es: Agente DGI
- fr: Agent DGI
- en: DGI Agent

**ministry_agent**
- es: Agente Ministerial
- fr: Agent Ministériel
- en: Ministry Agent

--------

### user_status_enum

**active**
- es: Activo
- fr: Actif
- en: Active

**suspended**
- es: Suspendido
- fr: Suspendu
- en: Suspended

**pending_verification**
- es: Pendiente de Verificación
- fr: En Attente de Vérification
- en: Pending Verification

**deactivated**
- es: Desactivado
- fr: Désactivé
- en: Deactivated

--------

## 2. SERVICES FISCAUX

### service_type_enum

**document_processing**
- es: Procesamiento de Documentos
- fr: Traitement de Documents
- en: Document Processing

**license_permit**
- es: Licencias y Permisos
- fr: Licences et Permis
- en: License & Permit

**residence_permit**
- es: Permiso de Residencia
- fr: Permis de Séjour
- en: Residence Permit

**registration_fee**
- es: Tasas de Registro
- fr: Frais d'Enregistrement
- en: Registration Fee

**inspection_fee**
- es: Tasas de Inspección
- fr: Frais d'Inspection
- en: Inspection Fee

**administrative_tax**
- es: Impuesto Administrativo
- fr: Taxe Administrative
- en: Administrative Tax

**customs_duty**
- es: Derechos de Aduana
- fr: Droits de Douane
- en: Customs Duty

**declaration_tax**
- es: Impuesto de Declaración
- fr: Taxe de Déclaration
- en: Declaration Tax

--------

### service_status_enum

**active**
- es: Activo
- fr: Actif
- en: Active

**inactive**
- es: Inactivo
- fr: Inactif
- en: Inactive

**draft**
- es: Borrador
- fr: Brouillon
- en: Draft

**deprecated**
- es: Obsoleto
- fr: Obsolète
- en: Deprecated

--------

### calculation_method_enum

**fixed_expedition**
- es: Tarifa Fija de Expedición
- fr: Tarif Fixe d'Expédition
- en: Fixed Expedition Fee

**fixed_renewal**
- es: Tarifa Fija de Renovación
- fr: Tarif Fixe de Renouvellement
- en: Fixed Renewal Fee

**fixed_both**
- es: Tarifas Fijas para Ambos
- fr: Tarifs Fixes pour les Deux
- en: Fixed Fees for Both

**percentage_based**
- es: Basado en Porcentaje
- fr: Basé sur Pourcentage
- en: Percentage Based

**unit_based**
- es: Basado en Unidades
- fr: Basé sur Unités
- en: Unit Based

**tiered_rates**
- es: Tarifas por Tramos
- fr: Tarifs par Tranches
- en: Tiered Rates

**formula_based**
- es: Basado en Fórmula
- fr: Basé sur Formule
- en: Formula Based

--------

## 3. WORKFLOW & PAIEMENTS

### payment_workflow_status

**submitted**
- es: Enviado
- fr: Soumis
- en: Submitted

**auto_processing**
- es: Procesamiento Automático
- fr: Traitement Automatique
- en: Auto Processing

**auto_approved**
- es: Aprobado Automáticamente
- fr: Approuvé Automatiquement
- en: Auto Approved

**pending_agent_review**
- es: Pendiente Revisión Agente
- fr: En Attente Révision Agent
- en: Pending Agent Review

**locked_by_agent**
- es: Bloqueado por Agente
- fr: Verrouillé par Agent
- en: Locked by Agent

**agent_reviewing**
- es: Agente Revisando
- fr: Agent en Révision
- en: Agent Reviewing

**requires_documents**
- es: Requiere Documentos
- fr: Nécessite Documents
- en: Requires Documents

**docs_resubmitted**
- es: Documentos Reenviados
- fr: Documents Resoumis
- en: Documents Resubmitted

**approved_by_agent**
- es: Aprobado por Agente
- fr: Approuvé par Agent
- en: Approved by Agent

**rejected_by_agent**
- es: Rechazado por Agente
- fr: Rejeté par Agent
- en: Rejected by Agent

**escalated_supervisor**
- es: Escalado a Supervisor
- fr: Escaladé au Superviseur
- en: Escalated to Supervisor

**supervisor_reviewing**
- es: Supervisor Revisando
- fr: Superviseur en Révision
- en: Supervisor Reviewing

**completed**
- es: Completado
- fr: Terminé
- en: Completed

**cancelled_by_user**
- es: Cancelado por Usuario
- fr: Annulé par Utilisateur
- en: Cancelled by User

**cancelled_by_agent**
- es: Cancelado por Agente
- fr: Annulé par Agent
- en: Cancelled by Agent

**expired**
- es: Expirado
- fr: Expiré
- en: Expired

--------

### payment_status_enum

**pending**
- es: Pendiente
- fr: En Attente
- en: Pending

**processing**
- es: Procesando
- fr: En Cours de Traitement
- en: Processing

**completed**
- es: Completado
- fr: Terminé
- en: Completed

**failed**
- es: Fallido
- fr: Échec
- en: Failed

**refunded**
- es: Reembolsado
- fr: Remboursé
- en: Refunded

**cancelled**
- es: Cancelado
- fr: Annulé
- en: Cancelled

--------

### payment_method_enum

**bank_transfer**
- es: Transferencia Bancaria
- fr: Virement Bancaire
- en: Bank Transfer

**card**
- es: Tarjeta
- fr: Carte
- en: Card

**mobile_money**
- es: Mobile Money
- fr: Mobile Money
- en: Mobile Money

**cash**
- es: Efectivo
- fr: Espèces
- en: Cash

**bange_wallet**
- es: Billetera Bange
- fr: Portefeuille Bange
- en: Bange Wallet

--------

### agent_action_type

**lock_for_review**
- es: Bloquear para Revisión
- fr: Verrouiller pour Révision
- en: Lock for Review

**approve**
- es: Aprobar
- fr: Approuver
- en: Approve

**reject**
- es: Rechazar
- fr: Rejeter
- en: Reject

**request_documents**
- es: Solicitar Documentos
- fr: Demander Documents
- en: Request Documents

**add_comment**
- es: Agregar Comentario
- fr: Ajouter Commentaire
- en: Add Comment

**escalate**
- es: Escalar
- fr: Escalader
- en: Escalate

**unlock_release**
- es: Desbloquear y Liberar
- fr: Déverrouiller et Libérer
- en: Unlock and Release

**assign_to_colleague**
- es: Asignar a Colega
- fr: Assigner à Collègue
- en: Assign to Colleague

--------

### escalation_level

**low**
- es: Bajo
- fr: Bas
- en: Low

**medium**
- es: Medio
- fr: Moyen
- en: Medium

**high**
- es: Alto
- fr: Élevé
- en: High

**critical**
- es: Crítico
- fr: Critique
- en: Critical

--------

## 4. DÉCLARATIONS FISCALES

### declaration_type_enum

**income_tax**
- es: Impuesto sobre la Renta
- fr: Impôt sur le Revenu
- en: Income Tax

**corporate_tax**
- es: Impuesto de Sociedades
- fr: Impôt sur les Sociétés
- en: Corporate Tax

**vat_declaration**
- es: Declaración de IVA
- fr: Déclaration TVA
- en: VAT Declaration

**social_contribution**
- es: Contribución Social
- fr: Cotisation Sociale
- en: Social Contribution

**property_tax**
- es: Impuesto Inmobiliario
- fr: Impôt Foncier
- en: Property Tax

**other_tax**
- es: Otros Impuestos
- fr: Autres Impôts
- en: Other Tax

**settlement_voucher**
- es: Impreso de Liquidación
- fr: Bordereau de Liquidation
- en: Settlement Voucher

**minimum_fiscal_contribution**
- es: Cuota Mínima Fiscal
- fr: Cotisation Minimale Fiscale
- en: Minimum Fiscal Contribution

**withheld_vat**
- es: IVA Destajo
- fr: TVA à la Source
- en: Withheld VAT

**actual_vat**
- es: IVA Real
- fr: TVA Réelle
- en: Actual VAT

**petroleum_products_tax**
- es: Impuesto sobre Productos Petroleros
- fr: Taxe sur les Produits Pétroliers
- en: Tax on Petroleum Products

**petroleum_products_tax_ivs**
- es: Impuesto sobre Productos Petroleros (IVS)
- fr: Taxe sur les Produits Pétroliers (IVS)
- en: Tax on Petroleum Products (IVS)

**wages_tax_oil_mining**
- es: Impuesto sobre Sueldos y Salarios Sector Petrolero y Minero
- fr: Impôt sur les Salaires du Secteur Pétrolier et Minier
- en: Tax on Wages and Salaries in the Oil and Mining Sector

**wages_tax_common_sector**
- es: Impuesto sobre Sueldos y Salarios Sector Común
- fr: Impôt sur les Salaires du Secteur Commun
- en: Tax on Wages and Salaries in the Common Sector

**common_voucher**
- es: Impreso Común
- fr: Bordereau Commun
- en: Common Voucher

**withholding_3pct_oil_mining_residents**
- es: Retención a la Fuente del 3% de los Residentes Petrolero y Minero
- fr: Retenue à la Source de 3% pour les Résidents du Secteur Pétrolier et Minier
- en: 3% Withholding Tax for Residents in the Oil and Mining Sector

**withholding_10pct_common_residents**
- es: Retención a la Fuente del 10% sobre la Renta de los Residentes Sector Común
- fr: Retenue à la Source de 10% sur le Revenu des Résidents du Secteur Commun
- en: 10% Withholding Tax on Income for Residents in the Common Sector

**withholding_5pct_oil_mining_residents**
- es: Retención a la Fuente del 5% sobre la Renta de los Residentes Petrolero y Minero
- fr: Retenue à la Source de 5% sur le Revenu des Résidents du Secteur Pétrolier et Minier
- en: 5% Withholding Tax on Income for Residents in the Oil and Mining Sector

**minimum_fiscal_oil_mining**
- es: Cuota Mínima Fiscal Petrolera y Minera
- fr: Cotisation Minimale Fiscale pour le Secteur Pétrolier et Minier
- en: Minimum Fiscal Contribution for the Oil and Mining Sector

**withholding_10pct_oil_mining_nonresidents**
- es: Retención a la Fuente del 10% sobre la Renta de los No Residentes Petrolero y Minero
- fr: Retenue à la Source de 10% sur le Revenu des Non-Résidents du Secteur Pétrolier et Minier
- en: 10% Withholding Tax on Income for Non-Residents in the Oil and Mining Sector

--------

### declaration_status_enum

**draft**
- es: Borrador
- fr: Brouillon
- en: Draft

**submitted**
- es: Enviado
- fr: Soumis
- en: Submitted

**processing**
- es: Procesando
- fr: En Cours de Traitement
- en: Processing

**accepted**
- es: Aceptado
- fr: Accepté
- en: Accepted

**rejected**
- es: Rechazado
- fr: Rejeté
- en: Rejected

**amended**
- es: Enmendado
- fr: Modifié
- en: Amended

--------

## 5. DOCUMENTS

### document_processing_mode_enum

**pending**
- es: Pendiente
- fr: En Attente
- en: Pending

**server_processing**
- es: Procesamiento del Servidor
- fr: Traitement Serveur
- en: Server Processing

**lite_processing**
- es: Procesamiento Ligero
- fr: Traitement Léger
- en: Lite Processing

**assisted_manual**
- es: Manual Asistido
- fr: Manuel Assisté
- en: Assisted Manual

--------

### document_ocr_status_enum

**pending**
- es: Pendiente
- fr: En Attente
- en: Pending

**processing**
- es: Procesando
- fr: En Cours de Traitement
- en: Processing

**completed**
- es: Completado
- fr: Terminé
- en: Completed

**failed**
- es: Fallido
- fr: Échec
- en: Failed

**skipped**
- es: Omitido
- fr: Ignoré
- en: Skipped

--------

### document_extraction_status_enum

**pending**
- es: Pendiente
- fr: En Attente
- en: Pending

**processing**
- es: Procesando
- fr: En Cours de Traitement
- en: Processing

**completed**
- es: Completado
- fr: Terminé
- en: Completed

**failed**
- es: Fallido
- fr: Échec
- en: Failed

**manual**
- es: Manual
- fr: Manuel
- en: Manual

--------

### document_validation_status_enum

**pending**
- es: Pendiente
- fr: En Attente
- en: Pending

**valid**
- es: Válido
- fr: Valide
- en: Valid

**invalid**
- es: Inválido
- fr: Invalide
- en: Invalid

**requires_review**
- es: Requiere Revisión
- fr: Nécessite Révision
- en: Requires Review

**user_corrected**
- es: Corregido por Usuario
- fr: Corrigé par Utilisateur
- en: User Corrected

--------

### document_access_level_enum

**private**
- es: Privado
- fr: Privé
- en: Private

**shared**
- es: Compartido
- fr: Partagé
- en: Shared

**public**
- es: Público
- fr: Public
- en: Public

**confidential**
- es: Confidencial
- fr: Confidentiel
- en: Confidential

--------

## TYPES DOCUMENTS MÉTIER

### Documents d'identité

**birth_certificate**
- es: Acta de Nacimiento
- fr: Acte de Naissance
- en: Birth Certificate

**passport**
- es: Pasaporte
- fr: Passeport
- en: Passport

**national_id**
- es: Cédula de Identidad Nacional
- fr: Carte d'Identité Nationale
- en: National ID Card

**driver_license**
- es: Licencia de Conducir
- fr: Permis de Conduire
- en: Driver's License

**residence_permit**
- es: Permiso de Residencia
- fr: Titre de Séjour
- en: Residence Permit

--------

### Documents financiers

**invoice**
- es: Factura
- fr: Facture
- en: Invoice

**receipt**
- es: Recibo
- fr: Reçu
- en: Receipt

**bank_statement**
- es: Estado de Cuenta Bancario
- fr: Relevé Bancaire
- en: Bank Statement

**tax_certificate**
- es: Certificado Fiscal
- fr: Certificat Fiscal
- en: Tax Certificate

**salary_slip**
- es: Nómina de Salario
- fr: Bulletin de Salaire
- en: Salary Slip

--------

### Documents d'entreprise

**business_license**
- es: Licencia Comercial
- fr: Licence Commerciale
- en: Business License

**incorporation_certificate**
- es: Certificado de Incorporación
- fr: Certificat d'Incorporation
- en: Incorporation Certificate

**tax_registration**
- es: Registro Fiscal
- fr: Enregistrement Fiscal
- en: Tax Registration

**company_statutes**
- es: Estatutos de la Empresa
- fr: Statuts de l'Entreprise
- en: Company Statutes

--------


--------

## RÉSUMÉ QUANTITATIF

### Types par catégorie
- **Types utilisateurs:** 2 enums (10 valeurs)
- **Services fiscaux:** 3 enums (18 valeurs)  
- **Workflow & paiements:** 5 enums (37 valeurs)
- **Déclarations:** 2 enums (26 valeurs) ← **MIS À JOUR**
- **Documents:** 5 enums (22 valeurs)
- **Types documents métier:** ~15 valeurs principales

### Total système
- **17 types ENUM PostgreSQL**
- **~128 valeurs ENUM** à traduire ← **MIS À JOUR (+16 nouveaux)**
- **3 langues** (espagnol, français, anglais)
- **~384 traductions totales** à maintenir ← **MIS À JOUR (+48 nouvelles)**

### Nouveautés v3.4
- **Système workflow agents** complet
- **3 nouveaux enums** dédiés agents ministériels
- **16 états workflow** pour gestion complète
- **14 nouveaux types de déclarations fiscales** ← **NOUVEAU**
- **Architecture i18n hybride** optimisée

### Architecture i18n hybride
- **Espagnol en base PostgreSQL** (performance 1-3ms)
- **Français/Anglais via fichiers i18n** (flexibilité)
- **Fonction get_enum_translation()** avec fallback automatique
- **Cache intelligent** pour optimisation

--------

## CHANGELOG v3.4 - DÉCLARATIONS FISCALES

### ✅ Ajouts declaration_type_enum

1. **settlement_voucher** - Impreso de Liquidación
2. **minimum_fiscal_contribution** - Cuota Mínima Fiscal
3. **withheld_vat** - IVA Destajo (TVA à la source)
4. **actual_vat** - IVA Real (TVA réelle)
5. **petroleum_products_tax** - Impuesto sobre Productos Petroleros
6. **petroleum_products_tax_ivs** - Impuesto sobre Productos Petroleros (IVS)
7. **wages_tax_oil_mining** - Impuesto sobre Sueldos y Salarios Sector Petrolero y Minero
8. **wages_tax_common_sector** - Impuesto sobre Sueldos y Salarios Sector Común
9. **common_voucher** - Impreso Común
10. **withholding_3pct_oil_mining_residents** - Retención 3% Residentes Petrolero y Minero
11. **withholding_10pct_common_residents** - Retención 10% Residentes Sector Común
12. **withholding_5pct_oil_mining_residents** - Retención 5% Residentes Petrolero y Minero
13. **minimum_fiscal_oil_mining** - Cuota Mínima Fiscal Petrolera y Minera
14. **withholding_10pct_oil_mining_nonresidents** - Retención 10% No Residentes Petrolero y Minero

### 🎯 Spécificités système fiscal Guinée Équatoriale

- **Secteurs spécialisés** : Distinction claire entre secteur pétrolier/minier et secteur commun
- **Retenues à la source multiples** : Différents taux selon statut résidence et secteur
- **Bordereaux spécialisés** : Liquidation et bordereaux communs
- **TVA complexe** : TVA destajo (retenue) vs TVA réelle
- **Cotisations minimales** : Générales et spécialisées secteur pétrolier/minier
