# PHASE 2 - STRUCTURE i18n COMPLÈTE
## Fichiers JSON pour TOUS les ENUMs + Interface Utilisateur + Service Unifié

---

## 📁 STRUCTURE FICHIERS i18n COMPLÈTE

```
/i18n/
├── es/                 # Espagnol (langue de référence)
│   ├── entities.json   # Entités métier (codes business)
│   ├── enums.json      # Valeurs ENUMs système 
│   ├── interface.json  # Interface utilisateur
│   ├── documents.json  # Types documents métier
│   ├── errors.json     # Messages erreur
│   └── validation.json # Messages validation
├── fr/                 # Français
│   ├── entities.json
│   ├── enums.json
│   ├── interface.json
│   ├── documents.json
│   ├── errors.json
│   └── validation.json
└── en/                 # Anglais
    ├── entities.json
    ├── enums.json
    ├── interface.json
    ├── documents.json
    ├── errors.json
    └── validation.json
```

---

## 🔧 CONTENU FICHIERS JSON

### **1. /i18n/fr/entities.json** (Entités avec codes business)
```json
{
  "ministries": {
    "M-001": {
      "name": "Ministère des Affaires Étrangères",
      "description": "Gestion des relations diplomatiques et consulaires"
    },
    "M-002": {
      "name": "Ministère des Finances", 
      "description": "Gestion du budget et politique fiscale"
    }
  },
  "sectors": {
    "S-001": {
      "name": "Relations Diplomatiques",
      "description": "Secteur diplomatique et consulaire"
    }
  },
  "categories": {
    "C-001": {
      "name": "Services Consulaires",
      "description": "Services aux citoyens à l'étranger"
    }
  },
  "fiscal_services": {
    "T-001": {
      "name": "Légalisation de documents",
      "description": "Service de légalisation des documents officiels",
      "instructions": "1. Préparer les documents originaux\n2. Remplir le formulaire de demande\n3. Payer les frais requis"
    }
  }
}
```

### **2. /i18n/fr/enums.json** (Valeurs ENUMs système)
```json
{
  "user_role": {
    "citizen": "Citoyen",
    "business": "Entreprise", 
    "accountant": "Comptable",
    "admin": "Administrateur",
    "dgi_agent": "Agent DGI",
    "ministry_agent": "Agent ministériel"
  },
  "user_status": {
    "active": "Actif",
    "suspended": "Suspendu",
    "pending_verification": "En attente de vérification",
    "deactivated": "Désactivé"
  },
  "service_type": {
    "document_processing": "Traitement de documents",
    "license_permit": "Licences et permis",
    "residence_permit": "Carte de séjour",
    "registration_fee": "Frais d'inscription",
    "inspection_fee": "Frais d'inspection",
    "administrative_tax": "Taxe administrative",
    "customs_duty": "Droits de douane",
    "declaration_tax": "Taxe déclarative"
  },
  "service_status": {
    "active": "Actif",
    "inactive": "Inactif",
    "draft": "Brouillon",
    "deprecated": "Obsolète"
  },
  "calculation_method": {
    "fixed_expedition": "Montant fixe expédition",
    "fixed_renewal": "Montant fixe renouvellement",
    "fixed_both": "Montant fixe les deux",
    "percentage_based": "Basé sur pourcentage",
    "unit_based": "Par unité",
    "tiered_rates": "Tarification par tranches",
    "formula_based": "Basé sur formule"
  },
  "payment_workflow_status": {
    "submitted": "Soumis",
    "auto_processing": "Traitement automatique",
    "auto_approved": "Approuvé automatiquement",
    "pending_agent_review": "En attente révision agent",
    "locked_by_agent": "Verrouillé par agent",
    "agent_reviewing": "Révision en cours",
    "requires_documents": "Documents requis",
    "docs_resubmitted": "Documents re-soumis",
    "approved_by_agent": "Approuvé par agent",
    "rejected_by_agent": "Rejeté par agent",
    "escalated_supervisor": "Escaladé au superviseur",
    "supervisor_reviewing": "Révision superviseur",
    "completed": "Terminé",
    "cancelled_by_user": "Annulé par utilisateur",
    "cancelled_by_agent": "Annulé par agent",
    "expired": "Expiré"
  },
  "payment_status": {
    "pending": "En attente",
    "processing": "En cours de traitement",
    "completed": "Terminé",
    "failed": "Échec",
    "refunded": "Remboursé",
    "cancelled": "Annulé"
  },
  "payment_method": {
    "bank_transfer": "Virement bancaire",
    "card": "Carte bancaire",
    "mobile_money": "Mobile money",
    "cash": "Espèces",
    "bange_wallet": "Portefeuille Bange"
  },
  "agent_action_type": {
    "lock_for_review": "Verrouiller pour révision",
    "approve": "Approuver",
    "reject": "Rejeter",
    "request_documents": "Demander documents",
    "add_comment": "Ajouter commentaire",
    "escalate": "Escalader",
    "unlock_release": "Déverrouiller",
    "assign_to_colleague": "Réassigner"
  },
  "escalation_level": {
    "low": "Bas",
    "medium": "Moyen", 
    "high": "Élevé",
    "critical": "Critique"
  },
  "declaration_type": {
    "income_tax": "Impôt sur le revenu",
    "corporate_tax": "Impôt sur les sociétés",
    "vat_declaration": "Déclaration TVA",
    "social_contribution": "Cotisations sociales",
    "property_tax": "Impôt foncier",
    "other_tax": "Autres impôts"
  },
  "declaration_status": {
    "draft": "Brouillon",
    "submitted": "Soumis",
    "processing": "En cours de traitement",
    "accepted": "Accepté",
    "rejected": "Rejeté",
    "amended": "Modifié"
  },
  "document_processing_mode": {
    "pending": "En attente",
    "server_processing": "Traitement serveur",
    "lite_processing": "Traitement léger",
    "assisted_manual": "Manuel assisté"
  },
  "document_ocr_status": {
    "pending": "En attente",
    "processing": "En cours",
    "completed": "Terminé",
    "failed": "Échec",
    "skipped": "Ignoré"
  },
  "document_extraction_status": {
    "pending": "En attente",
    "processing": "En cours",
    "completed": "Terminé",
    "failed": "Échec",
    "manual": "Manuel"
  },
  "document_validation_status": {
    "pending": "En attente",
    "valid": "Valide",
    "invalid": "Invalide",
    "requires_review": "Révision requise",
    "user_corrected": "Corrigé par utilisateur"
  },
  "document_access_level": {
    "private": "Privé",
    "shared": "Partagé",
    "public": "Public",
    "confidential": "Confidentiel"
  },
  "document_type": {
    "birth_certificate": "Certificat de naissance",
    "death_certificate": "Certificat de décès",
    "marriage_certificate": "Certificat de mariage",
    "national_id": "Carte d'identité nationale",
    "passport": "Passeport",
    "driver_license": "Permis de conduire",
    "residence_permit": "Carte de séjour",
    "work_permit": "Permis de travail",
    "business_license": "Licence commerciale",
    "incorporation_certificate": "Certificat d'incorporation",
    "tax_certificate": "Certificat fiscal",
    "invoice": "Facture",
    "receipt": "Reçu",
    "bank_statement": "Relevé bancaire",
    "salary_certificate": "Certificat de salaire",
    "property_deed": "Acte de propriété",
    "lease_agreement": "Contrat de bail",
    "power_of_attorney": "Procuration",
    "academic_diploma": "Diplôme académique",
    "professional_certificate": "Certificat professionnel"
  },
  "document_subtype": {
    "original": "Original",
    "certified_copy": "Copie certifiée conforme",
    "simple_copy": "Copie simple",
    "apostilled": "Apostillé",
    "translated": "Traduit",
    "notarized": "Notarié",
    "legalized": "Légalisé"
  }
}
```

### **3. /i18n/fr/interface.json** (Interface utilisateur)
```json
{
  "navigation": {
    "dashboard": "Tableau de bord",
    "services": "Services",
    "payments": "Paiements",
    "documents": "Documents",
    "declarations": "Déclarations",
    "profile": "Profil",
    "settings": "Paramètres",
    "logout": "Déconnexion"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "welcome": "Bienvenue",
    "recent_payments": "Paiements récents",
    "pending_documents": "Documents en attente",
    "quick_actions": "Actions rapides",
    "statistics": "Statistiques"
  },
  "services": {
    "title": "Services fiscaux",
    "search_placeholder": "Rechercher un service...",
    "filter_by_ministry": "Filtrer par ministère",
    "filter_by_type": "Filtrer par type",
    "expedition_fee": "Frais d'expédition",
    "renewal_fee": "Frais de renouvellement",
    "calculate": "Calculer",
    "pay_now": "Payer maintenant",
    "add_to_favorites": "Ajouter aux favoris"
  },
  "payments": {
    "title": "Mes paiements",
    "payment_reference": "Référence paiement",
    "service_name": "Service",
    "amount": "Montant",
    "status": "Statut",
    "payment_date": "Date paiement",
    "download_receipt": "Télécharger reçu",
    "view_details": "Voir détails"
  },
  "agents": {
    "title": "Gestion agents",
    "dashboard": "Tableau de bord agents",
    "queue": "File d'attente",
    "my_assignments": "Mes affectations",
    "lock_payment": "Verrouiller paiement",
    "approve": "Approuver",
    "reject": "Rejeter",
    "request_docs": "Demander documents",
    "escalate": "Escalader",
    "add_comment": "Ajouter commentaire",
    "sla_warning": "Attention SLA",
    "sla_expired": "SLA expiré"
  },
  "forms": {
    "required_field": "Champ obligatoire",
    "optional_field": "Champ optionnel",
    "submit": "Soumettre",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "edit": "Modifier",
    "delete": "Supprimer",
    "upload": "Téléverser",
    "download": "Télécharger"
  },
  "common": {
    "yes": "Oui",
    "no": "Non",
    "ok": "OK",
    "close": "Fermer",
    "loading": "Chargement...",
    "search": "Rechercher",
    "filter": "Filtrer",
    "sort": "Trier",
    "export": "Exporter",
    "import": "Importer",
    "refresh": "Actualiser"
  }
}
```

### **4. /i18n/fr/documents.json** (Types documents métier)
```json
{
  "document_types": {
    "birth_certificate": "Certificat de naissance",
    "death_certificate": "Certificat de décès",
    "marriage_certificate": "Certificat de mariage",
    "national_id": "Carte d'identité nationale",
    "passport": "Passeport",
    "driver_license": "Permis de conduire",
    "residence_permit": "Carte de séjour",
    "work_permit": "Permis de travail",
    "business_license": "Licence commerciale",
    "incorporation_certificate": "Certificat d'incorporation",
    "tax_certificate": "Certificat fiscal",
    "invoice": "Facture",
    "receipt": "Reçu",
    "bank_statement": "Relevé bancaire",
    "salary_certificate": "Certificat de salaire",
    "property_deed": "Acte de propriété",
    "lease_agreement": "Contrat de bail",
    "power_of_attorney": "Procuration",
    "academic_diploma": "Diplôme académique",
    "professional_certificate": "Certificat professionnel"
  },
  "document_subtypes": {
    "original": "Original",
    "certified_copy": "Copie certifiée conforme",
    "simple_copy": "Copie simple",
    "apostilled": "Apostillé",
    "translated": "Traduit",
    "notarized": "Notarié",
    "legalized": "Légalisé"
  },
  "document_requirements": {
    "original_required": "Original requis",
    "copy_accepted": "Copie acceptée",
    "certified_copy": "Copie certifiée conforme",
    "notarized": "Notarié",
    "apostilled": "Apostillé",
    "translated": "Traduit",
    "recent": "Récent (moins de 3 mois)"
  }
}
```

### **5. /i18n/fr/errors.json** (Messages erreur)
```json
{
  "authentication": {
    "invalid_credentials": "Identifiants invalides",
    "account_locked": "Compte verrouillé",
    "session_expired": "Session expirée",
    "access_denied": "Accès refusé"
  },
  "validation": {
    "required_field": "Ce champ est obligatoire",
    "invalid_email": "Adresse email invalide",
    "invalid_phone": "Numéro de téléphone invalide",
    "password_too_weak": "Mot de passe trop faible",
    "file_too_large": "Fichier trop volumineux",
    "invalid_file_type": "Type de fichier invalide"
  },
  "payment": {
    "insufficient_funds": "Fonds insuffisants",
    "payment_failed": "Échec du paiement",
    "invalid_amount": "Montant invalide",
    "service_unavailable": "Service indisponible"
  },
  "system": {
    "server_error": "Erreur serveur",
    "network_error": "Erreur réseau",
    "timeout": "Délai d'attente dépassé",
    "maintenance": "Maintenance en cours"
  }
}
```

### **6. /i18n/fr/validation.json** (Messages validation)
```json
{
  "success": {
    "payment_completed": "Paiement effectué avec succès",
    "document_uploaded": "Document téléversé avec succès",
    "profile_updated": "Profil mis à jour",
    "settings_saved": "Paramètres enregistrés"
  },
  "warnings": {
    "unsaved_changes": "Modifications non enregistrées",
    "session_expiring": "Session expirant bientôt",
    "incomplete_profile": "Profil incomplet"
  },
  "confirmations": {
    "delete_document": "Confirmer la suppression du document ?",
    "cancel_payment": "Confirmer l'annulation du paiement ?",
    "logout": "Confirmer la déconnexion ?"
  }
}
```

---

## 🚀 SERVICE TRADUCTION UNIFIÉ

### **TypeScript/JavaScript Implementation**

```typescript
interface TranslationConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  cacheTimeout: number;
  supportedLanguages: string[];
}

interface TranslationCache {
  [language: string]: {
    [namespace: string]: Record<string, any>;
  };
}

class UnifiedTranslationService {
  private config: TranslationConfig;
  private cache: TranslationCache = {};
  private dbPool: any; // Connection DB

  constructor(config: TranslationConfig, dbPool: any) {
    this.config = config;
    this.dbPool = dbPool;
  }

  /**
   * Obtenir traduction entité métier (DB + i18n)
   */
  async getEntityTranslation(
    entityType: 'ministry' | 'sector' | 'category' | 'fiscal_service',
    entityCode: string,
    field: 'name' | 'description' | 'instructions',
    language: string = this.config.defaultLanguage
  ): Promise<string> {
    
    if (language === 'es') {
      // Source: Base de données (espagnol)
      const query = `SELECT ${field}_es FROM ${this.getTableName(entityType)} WHERE ${this.getCodeColumn(entityType)} = $1`;
      const result = await this.dbPool.query(query, [entityCode]);
      return result.rows[0]?.[`${field}_es`] || entityCode;
    } else {
      // Source: Fichiers i18n (autres langues)
      const namespace = 'entities';
      const key = `${entityType}s.${entityCode}.${field}`;
      const translation = await this.getFromCache(language, namespace, key);
      
      // Fallback vers espagnol si traduction manquante
      if (!translation) {
        return this.getEntityTranslation(entityType, entityCode, field, 'es');
      }
      
      return translation;
    }
  }

  /**
   * Obtenir traduction ENUM (i18n uniquement)
   */
  async getEnumTranslation(
    enumType: string,
    enumValue: string,
    language: string = this.config.defaultLanguage
  ): Promise<string> {
    
    const namespace = 'enums';
    const key = `${enumType}.${enumValue}`;
    const translation = await this.getFromCache(language, namespace, key);
    
    // Fallback vers langue par défaut
    if (!translation && language !== this.config.fallbackLanguage) {
      return this.getEnumTranslation(enumType, enumValue, this.config.fallbackLanguage);
    }
    
    return translation || enumValue;
  }

  /**
   * Obtenir traduction interface (i18n uniquement)
   */
  async getUITranslation(
    key: string,
    language: string = this.config.defaultLanguage,
    namespace: string = 'interface'
  ): Promise<string> {
    
    const translation = await this.getFromCache(language, namespace, key);
    
    // Fallback vers langue par défaut
    if (!translation && language !== this.config.fallbackLanguage) {
      return this.getUITranslation(key, this.config.fallbackLanguage, namespace);
    }
    
    return translation || key;
  }

  /**
   * Obtenir traduction depuis cache avec chargement automatique
   */
  private async getFromCache(
    language: string,
    namespace: string,
    key: string
  ): Promise<string | null> {
    
    // Vérifier cache
    if (!this.cache[language] || !this.cache[language][namespace]) {
      await this.loadNamespace(language, namespace);
    }
    
    // Naviguer dans l'objet avec notation pointée
    const keys = key.split('.');
    let value = this.cache[language][namespace];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  /**
   * Charger namespace depuis fichiers i18n
   */
  private async loadNamespace(language: string, namespace: string): Promise<void> {
    try {
      const filePath = `/i18n/${language}/${namespace}.json`;
      const fileContent = await this.loadJSONFile(filePath);
      
      if (!this.cache[language]) {
        this.cache[language] = {};
      }
      
      this.cache[language][namespace] = fileContent;
      
      // Expiration cache
      setTimeout(() => {
        if (this.cache[language] && this.cache[language][namespace]) {
          delete this.cache[language][namespace];
        }
      }, this.config.cacheTimeout);
      
    } catch (error) {
      console.error(`Failed to load ${language}/${namespace}:`, error);
      this.cache[language] = this.cache[language] || {};
      this.cache[language][namespace] = {};
    }
  }

  /**
   * Charger fichier JSON (implémentation selon environnement)
   */
  private async loadJSONFile(filePath: string): Promise<Record<string, any>> {
    // Node.js
    if (typeof require !== 'undefined') {
      const fs = require('fs').promises;
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    }
    
    // Browser
    if (typeof fetch !== 'undefined') {
      const response = await fetch(filePath);
      return response.json();
    }
    
    throw new Error('No JSON loading method available');
  }

  /**
   * Helpers pour mapping entités
   */
  private getTableName(entityType: string): string {
    const mapping = {
      'ministry': 'ministries',
      'sector': 'sectors', 
      'category': 'categories',
      'fiscal_service': 'fiscal_services'
    };
    return mapping[entityType];
  }

  private getCodeColumn(entityType: string): string {
    const mapping = {
      'ministry': 'ministry_code',
      'sector': 'sector_code',
      'category': 'category_code', 
      'fiscal_service': 'service_code'
    };
    return mapping[entityType];
  }

  /**
   * Invalider cache (pour rechargement)
   */
  invalidateCache(language?: string, namespace?: string): void {
    if (language && namespace) {
      if (this.cache[language]) {
        delete this.cache[language][namespace];
      }
    } else if (language) {
      delete this.cache[language];
    } else {
      this.cache = {};
    }
  }

  /**
   * Obtenir résumé cache (debugging)
   */
  getCacheStats(): Record<string, any> {
    const stats = {};
    for (const [lang, namespaces] of Object.entries(this.cache)) {
      stats[lang] = Object.keys(namespaces);
    }
    return stats;
  }
}

// Configuration exemple
const translationConfig: TranslationConfig = {
  defaultLanguage: 'es',
  fallbackLanguage: 'es',
  cacheTimeout: 300000, // 5 minutes
  supportedLanguages: ['es', 'fr', 'en']
};

// Export singleton
export const translationService = new UnifiedTranslationService(
  translationConfig,
  dbPool // Votre pool de connexions DB
);
```

### **Utilisation Pratique**

```typescript
// Composant React exemple - Documents
const DocumentCard = ({ document, userLanguage }) => {
  const [documentName, setDocumentName] = useState('');

  useEffect(() => {
    const loadDocumentName = async () => {
      // Type document (ENUM via i18n)
      const typeName = await translationService.getEnumTranslation(
        'document_types', 
        document.document_type, 
        userLanguage
      );
      
      // Sous-type document (ENUM via i18n) 
      const subtypeName = document.document_subtype 
        ? await translationService.getEnumTranslation(
            'document_subtypes', 
            document.document_subtype, 
            userLanguage
          )
        : '';
      
      // Nom affiché = Type + (Sous-type)
      const displayName = subtypeName 
        ? `${typeName} (${subtypeName})`
        : typeName;
      
      setDocumentName(displayName);
    };
    
    loadDocumentName();
  }, [document, userLanguage]);

  return (
    <div className="document-card">
      <h3>{documentName}</h3>
      <p>Fichier: {document.original_filename}</p>
      <p>Taille: {formatFileSize(document.file_size_bytes)}</p>
    </div>
  );
};

// Composant service (existant)
const ServiceCard = ({ serviceCode, userLanguage }) => {
  const [serviceName, setServiceName] = useState('');
  const [payButtonText, setPayButtonText] = useState('');

  useEffect(() => {
    const loadTranslations = async () => {
      // Nom service (DB ES + i18n FR/EN)
      const name = await translationService.getEntityTranslation(
        'fiscal_service', 
        serviceCode, 
        'name', 
        userLanguage
      );
      
      // Label interface (i18n uniquement)
      const payText = await translationService.getUITranslation(
        'services.pay_now', 
        userLanguage
      );
      
      setServiceName(name);
      setPayButtonText(payText);
    };
    
    loadTranslations();
  }, [serviceCode, userLanguage]);

  return (
    <div className="service-card">
      <h3>{serviceName}</h3>
      <button>{payButtonText}</button>
    </div>
  );
};
```

---

## ✅ RÉSUMÉ PHASE 2

**Structure i18n complète créée :**
- ✅ 6 types fichiers JSON par langue
- ✅ Tous les ENUMs système couverts
- ✅ Interface utilisateur complète
- ✅ Service traduction unifié
- ✅ Cache intelligent avec fallback
- ✅ Support TypeScript/JavaScript

**Prêt pour Phase 3 (Interface Admin) lors du développement backend !**

**Et oui, vous avez raison :** La Phase 3 (Interface Admin) doit être implémentée pendant le développement backend car elle nécessite :
- API endpoints pour gestion traductions
- Interface web pour administration
- Synchronisation DB ↔ fichiers i18n
- Validation et workflow approbation

Cette phase fait partie intégrante du développement applicatif !
