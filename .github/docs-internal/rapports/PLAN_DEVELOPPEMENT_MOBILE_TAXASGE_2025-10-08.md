# 📱 PLAN DE DÉVELOPPEMENT MOBILE TAXASGE
## Plan Complet: Features, Navigation, UI, Base de Données, Tests & Validation

---

**Auteur:** Kouemou Sah Jean Emac
**Date:** 2025-10-08
**Version:** 1.0.0
**Statut:** 📋 PLAN DÉTAILLÉ - PRÊT POUR EXÉCUTION
**Base:** React Native 0.80.0 (Migration complétée)

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Problèmes Critiques Identifiés

**Analyse rigoureuse du schéma SQLite vs Supabase révèle:**

1. ❌ **Système de paiement ABSENT** (0% implémenté)
   - Pas de table `service_payments`
   - Pas de table `declaration_payments`
   - Impact: Impossible de payer ou voir l'historique de paiements offline

2. ❌ **Déclarations fiscales ABSENTES** (0% implémenté)
   - Pas de table `tax_declarations`
   - Impact: Impossible de travailler sur déclarations offline

3. ❌ **Données entreprises ABSENTES** (0% implémenté)
   - Pas de table `companies`
   - Pas de table `user_company_roles`
   - Impact: Fonctionnalités business users non fonctionnelles

4. ⚠️ **Table fiscal_services INCOMPLÈTE** (30% des champs manquants)
   - Manque: formules de calcul, pénalités, références légales
   - Impact: Calculs simplifiés, pas de calculs avancés offline

5. ⚠️ **Table calculations_history INCOMPLÈTE** (40% des champs manquants)
   - Manque: paramètres d'entrée, détails de calcul
   - Impact: Historique incomplet, pas de recalcul possible

### Objectifs du Plan

✅ **Combler les lacunes critiques du schéma SQLite**
✅ **Implémenter les fonctionnalités manquantes**
✅ **Créer une UI/UX complète et professionnelle**
✅ **Mettre en place navigation et architecture robuste**
✅ **Tests complets et validation rigoureuse**
✅ **Application production-ready**

### Durée Estimée Totale

**16-20 semaines** (4-5 mois)

---

## 📊 ARCHITECTURE GLOBALE

### Stack Technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | React Native 0.80.0 | ✅ Déjà migré |
| **UI Library** | React Native Paper | Material Design, accessible |
| **Navigation** | React Navigation 6.x | Standard RN, performant |
| **State Management** | Redux Toolkit 2.5.0 | ✅ Déjà configuré, React 19 compatible |
| **Forms** | React Hook Form + Yup | Performance, validation |
| **Database** | SQLite (react-native-sqlite-storage) | ✅ Déjà configuré |
| **Sync** | Supabase 2.38.0 | ✅ Déjà configuré |
| **i18n** | i18next 23.6.0 | ✅ Déjà configuré (ES/FR/EN) |
| **Analytics** | Firebase Analytics (optionnel) | Tracking utilisation |
| **Testing** | Jest + React Native Testing Library | Tests unitaires |
| **E2E** | Detox | Tests end-to-end |

### Architecture Offline-First

```
┌─────────────────────────────────────────────────┐
│                  MOBILE APP                      │
├─────────────────────────────────────────────────┤
│  UI Layer (React Native Components)             │
│  ├─ Screens (Home, Services, Calc, Profile)     │
│  ├─ Navigation (Stack, Tab, Drawer)             │
│  └─ Components (Cards, Forms, Lists)            │
├─────────────────────────────────────────────────┤
│  Business Logic Layer                           │
│  ├─ Redux Store (Global State)                  │
│  ├─ Custom Hooks (useServices, useCalculator)   │
│  └─ Services (API, Calculations, Sync)          │
├─────────────────────────────────────────────────┤
│  Data Layer                                      │
│  ├─ SQLite (Offline Storage) ← PRIORITÉ         │
│  ├─ Sync Queue (Pending Operations)             │
│  └─ Cache (Search, Images)                      │
├─────────────────────────────────────────────────┤
│  Sync Layer                                      │
│  ├─ Supabase Client                              │
│  ├─ Sync Manager (Bidirectional)                │
│  └─ Conflict Resolution                          │
└─────────────────────────────────────────────────┘
                     ↕ HTTPS
┌─────────────────────────────────────────────────┐
│              SUPABASE BACKEND                    │
│  ├─ PostgreSQL (17 tables)                      │
│  ├─ Auth & RLS                                   │
│  ├─ Storage (Documents)                          │
│  └─ Edge Functions                               │
└─────────────────────────────────────────────────┘
```

---

## 📋 PLAN DE DÉVELOPPEMENT - 8 PHASES

### Vue d'Ensemble des Phases

| Phase | Nom | Durée | Priorité | KPI Validation |
|-------|-----|-------|----------|----------------|
| **Phase 1** | Migration Schéma SQLite | 2 semaines | 🔴 CRITIQUE | 100% tables créées, migration réussie |
| **Phase 2** | Services Core & Sync | 3 semaines | 🔴 CRITIQUE | Sync bidirectionnel fonctionnel |
| **Phase 3** | Navigation & Architecture UI | 2 semaines | 🟠 HAUTE | Navigation complète, 5 écrans principaux |
| **Phase 4** | Features Métier (Calculs, Paiements, Chatbot AI) | 5 semaines | 🔴 CRITIQUE | Calculs, paiements et chatbot fonctionnels |
| **Phase 5** | Features Avancées (Déclarations, Entreprises) | 3 semaines | 🟠 HAUTE | Déclarations et gestion entreprises OK |
| **Phase 6** | UI/UX Polish & Accessibilité | 2 semaines | 🟡 MOYENNE | UI professionnelle, accessibilité AA |
| **Phase 7** | Tests Complets | 2 semaines | 🔴 CRITIQUE | Coverage >80%, E2E passants |
| **Phase 8** | Validation & Production | 2 semaines | 🔴 CRITIQUE | App production-ready, déployée |

**Total: 21 semaines (5.25 mois)**

---

## 🗄️ PHASE 1: MIGRATION SCHÉMA SQLITE (2 SEMAINES)

### Objectif
Combler TOUTES les lacunes critiques du schéma SQLite pour atteindre la parité avec Supabase

### Tâches Détaillées

#### **1.1 Créer Nouvelles Tables (5 jours)**

**Priority 1: Tables Paiements**
```sql
-- service_payments.sql
CREATE TABLE IF NOT EXISTS service_payments (
  id TEXT PRIMARY KEY,
  payment_reference TEXT NOT NULL UNIQUE,
  fiscal_service_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  company_id TEXT,
  payment_type TEXT CHECK(payment_type IN ('expedition', 'renewal')),
  base_amount REAL NOT NULL,
  penalties REAL DEFAULT 0,
  discounts REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money', 'bange')),
  currency TEXT DEFAULT 'XAF',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  paid_at TEXT,
  receipt_number TEXT UNIQUE,
  receipt_url TEXT,
  bange_transaction_id TEXT UNIQUE,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  sync_timestamp TEXT,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id) ON DELETE CASCADE,
  UNIQUE(user_id, payment_reference)
);

CREATE INDEX IF NOT EXISTS idx_service_payments_user ON service_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_service ON service_payments(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_service_payments_status ON service_payments(status);
CREATE INDEX IF NOT EXISTS idx_service_payments_synced ON service_payments(synced);
CREATE INDEX IF NOT EXISTS idx_service_payments_date ON service_payments(created_at DESC);

-- declaration_payments.sql
CREATE TABLE IF NOT EXISTS declaration_payments (
  id TEXT PRIMARY KEY,
  payment_reference TEXT NOT NULL UNIQUE,
  declaration_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tax_amount REAL NOT NULL,
  penalties REAL DEFAULT 0,
  interest REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  currency TEXT DEFAULT 'XAF',
  bange_transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  paid_at TEXT,
  receipt_number TEXT UNIQUE,
  receipt_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (declaration_id) REFERENCES tax_declarations(id),
  UNIQUE(user_id, payment_reference)
);

CREATE INDEX IF NOT EXISTS idx_declaration_payments_user ON declaration_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_declaration_payments_declaration ON declaration_payments(declaration_id);
CREATE INDEX IF NOT EXISTS idx_declaration_payments_status ON declaration_payments(status);
CREATE INDEX IF NOT EXISTS idx_declaration_payments_synced ON declaration_payments(synced);
```

**Priority 2: Tables Déclarations Fiscales**
```sql
-- tax_declarations.sql
CREATE TABLE IF NOT EXISTS tax_declarations (
  id TEXT PRIMARY KEY,
  declaration_number TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  company_id TEXT,
  declaration_type TEXT NOT NULL CHECK(declaration_type IN ('monthly_vat', 'quarterly_vat', 'annual_income', 'withholding', 'property', 'other')),
  fiscal_year INTEGER NOT NULL,
  fiscal_period TEXT, -- "2025-Q1", "2025-01", etc.
  declaration_deadline TEXT NOT NULL,
  declared_data TEXT, -- JSON: all form fields
  taxable_base REAL DEFAULT 0,
  calculated_tax REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  credits REAL DEFAULT 0,
  net_tax_due REAL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'processing', 'accepted', 'rejected', 'amended')),
  submitted_at TEXT,
  accepted_at TEXT,
  rejection_reason TEXT,
  amendment_of TEXT, -- ID of original declaration if amended
  attachments TEXT, -- JSON array of document IDs
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  UNIQUE(user_id, declaration_number)
);

CREATE INDEX IF NOT EXISTS idx_tax_declarations_user ON tax_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_company ON tax_declarations(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_type ON tax_declarations(declaration_type);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_status ON tax_declarations(status);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_year ON tax_declarations(fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_deadline ON tax_declarations(declaration_deadline);
CREATE INDEX IF NOT EXISTS idx_tax_declarations_synced ON tax_declarations(synced);
```

**Priority 3: Tables Entreprises**
```sql
-- companies.sql
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  tax_id TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  primary_sector_id TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  employee_count INTEGER,
  annual_revenue REAL,
  registration_date TEXT,
  is_active INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  verified_at TEXT,
  metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (primary_sector_id) REFERENCES sectors(id)
);

CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(primary_sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- user_company_roles.sql
CREATE TABLE IF NOT EXISTS user_company_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'accountant', 'employee', 'viewer')),
  permissions TEXT, -- JSON array
  is_active INTEGER DEFAULT 1,
  assigned_at TEXT DEFAULT (datetime('now')),
  assigned_by TEXT,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_company_roles_user ON user_company_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_company ON user_company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_active ON user_company_roles(is_active);
```

**Priority 4: Table Langues**
```sql
-- languages.sql
CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY,
  name_native TEXT NOT NULL,
  name_english TEXT NOT NULL,
  iso_639_1 TEXT UNIQUE,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Insert default languages
INSERT OR IGNORE INTO languages (code, name_native, name_english, iso_639_1, is_default, display_order) VALUES
  ('es', 'Español', 'Spanish', 'es', 1, 1),
  ('fr', 'Français', 'French', 'fr', 0, 2),
  ('en', 'English', 'English', 'en', 0, 3);
```

**Priority 5: Table Documents (Metadata Only)**
```sql
-- documents.sql
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fiscal_service_id TEXT,
  service_payment_id TEXT,
  declaration_id TEXT,
  company_id TEXT,
  document_number TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_subtype TEXT,
  status TEXT DEFAULT 'uploaded' CHECK(status IN ('uploaded', 'processing', 'verified', 'rejected')),
  ocr_status TEXT CHECK(ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data TEXT, -- JSON (light metadata only)
  validation_status TEXT CHECK(validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors TEXT, -- JSON array
  retention_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (fiscal_service_id) REFERENCES fiscal_services(id),
  FOREIGN KEY (service_payment_id) REFERENCES service_payments(id),
  FOREIGN KEY (declaration_id) REFERENCES tax_declarations(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_service ON documents(fiscal_service_id);
CREATE INDEX IF NOT EXISTS idx_documents_payment ON documents(service_payment_id);
CREATE INDEX IF NOT EXISTS idx_documents_declaration ON documents(declaration_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
```

#### **1.2 Étendre Tables Existantes (3 jours)**

**fiscal_services - Ajouter champs critiques:**
```sql
-- fiscal_services_extensions.sql
ALTER TABLE fiscal_services ADD COLUMN service_code TEXT;
ALTER TABLE fiscal_services ADD COLUMN calculation_method TEXT CHECK(calculation_method IN ('fixed', 'formula', 'percentage', 'tiered'));
ALTER TABLE fiscal_services ADD COLUMN tasa_expedicion REAL DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN expedition_formula TEXT;
ALTER TABLE fiscal_services ADD COLUMN expedition_unit_measure TEXT;
ALTER TABLE fiscal_services ADD COLUMN tasa_renovacion REAL DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN renewal_formula TEXT;
ALTER TABLE fiscal_services ADD COLUMN renewal_unit_measure TEXT;
ALTER TABLE fiscal_services ADD COLUMN calculation_config TEXT; -- JSON
ALTER TABLE fiscal_services ADD COLUMN rate_tiers TEXT; -- JSON array
ALTER TABLE fiscal_services ADD COLUMN base_percentage REAL;
ALTER TABLE fiscal_services ADD COLUMN percentage_of TEXT;
ALTER TABLE fiscal_services ADD COLUMN validity_period_months INTEGER;
ALTER TABLE fiscal_services ADD COLUMN renewal_frequency_months INTEGER;
ALTER TABLE fiscal_services ADD COLUMN grace_period_days INTEGER DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN late_penalty_percentage REAL;
ALTER TABLE fiscal_services ADD COLUMN late_penalty_fixed REAL;
ALTER TABLE fiscal_services ADD COLUMN penalty_calculation_rules TEXT; -- JSON
ALTER TABLE fiscal_services ADD COLUMN eligibility_criteria TEXT; -- JSON
ALTER TABLE fiscal_services ADD COLUMN required_documents_ids TEXT; -- JSON array
ALTER TABLE fiscal_services ADD COLUMN exemption_conditions TEXT; -- JSON
ALTER TABLE fiscal_services ADD COLUMN legal_reference TEXT;
ALTER TABLE fiscal_services ADD COLUMN regulatory_articles TEXT; -- JSON array
ALTER TABLE fiscal_services ADD COLUMN tariff_effective_from TEXT;
ALTER TABLE fiscal_services ADD COLUMN tariff_effective_to TEXT;
ALTER TABLE fiscal_services ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deprecated'));
ALTER TABLE fiscal_services ADD COLUMN priority INTEGER DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN complexity_level INTEGER DEFAULT 1 CHECK(complexity_level >= 1 AND complexity_level <= 5);
ALTER TABLE fiscal_services ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN calculation_count INTEGER DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN payment_count INTEGER DEFAULT 0;
ALTER TABLE fiscal_services ADD COLUMN favorite_count INTEGER DEFAULT 0;

-- Create unique index on service_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_services_service_code ON fiscal_services(service_code);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_calculation_method ON fiscal_services(calculation_method);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_status ON fiscal_services(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_services_complexity ON fiscal_services(complexity_level);
```

**calculations_history - Compléter structure:**
```sql
-- calculations_history_extensions.sql
ALTER TABLE calculations_history ADD COLUMN calculation_type TEXT CHECK(calculation_type IN ('expedition', 'renewal'));
ALTER TABLE calculations_history ADD COLUMN input_parameters TEXT; -- JSON
ALTER TABLE calculations_history ADD COLUMN calculation_details TEXT; -- JSON (complete breakdown)
ALTER TABLE calculations_history ADD COLUMN saved_for_later INTEGER DEFAULT 0;
ALTER TABLE calculations_history ADD COLUMN company_id TEXT;
ALTER TABLE calculations_history ADD COLUMN notes TEXT;

-- Rename payment_type to match Supabase if needed
-- UPDATE calculations_history SET calculation_type = payment_type WHERE calculation_type IS NULL;
```

**categories - Ajouter ministry_id:**
```sql
ALTER TABLE categories ADD COLUMN ministry_id TEXT;
ALTER TABLE categories ADD COLUMN service_type TEXT;
CREATE INDEX IF NOT EXISTS idx_categories_ministry ON categories(ministry_id);
```

#### **1.3 Créer Script de Migration (2 jours)**

**Fichier: `src/database/migrations/001_complete_schema.ts`**
```typescript
import { db } from '../DatabaseManager';

export async function runMigration001(): Promise<void> {
  console.log('[Migration 001] Starting complete schema migration...');

  try {
    await db.transaction(async (tx) => {
      // 1. Create new tables
      await createServicePaymentsTable(tx);
      await createDeclarationPaymentsTable(tx);
      await createTaxDeclarationsTable(tx);
      await createCompaniesTable(tx);
      await createUserCompanyRolesTable(tx);
      await createLanguagesTable(tx);
      await createDocumentsTable(tx);

      // 2. Extend existing tables
      await extendFiscalServicesTable(tx);
      await extendCalculationsHistoryTable(tx);
      await extendCategoriesTable(tx);

      // 3. Update metadata
      await tx.executeSql(
        `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
         VALUES ('schema_version', '2.0.0', datetime('now'))`
      );
    });

    console.log('[Migration 001] Migration completed successfully!');
  } catch (error) {
    console.error('[Migration 001] Migration failed:', error);
    throw error;
  }
}
```

### KPIs Phase 1

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Tables créées** | 7 nouvelles tables | `SELECT name FROM sqlite_master WHERE type='table'` |
| **Champs étendus** | 30+ champs ajoutés à fiscal_services | `PRAGMA table_info(fiscal_services)` |
| **Migration réussie** | 0 erreurs | Script migration exécuté sans erreur |
| **Indexes créés** | 25+ indexes | `SELECT COUNT(*) FROM sqlite_master WHERE type='index'` |
| **Tests schéma** | 100% tables testées | Jest tests passent |

**Seuil Validation:** 5/5 KPIs validés

---

## 🔄 PHASE 2: SERVICES CORE & SYNC (3 SEMAINES)

### Objectif
Créer les services TypeScript pour gérer TOUTES les nouvelles tables + sync bidirectionnel

### Tâches Détaillées

#### **2.1 Services Database (1 semaine)**

**Structure des services:**
```
src/database/services/
├── FiscalServiceService.ts      # CRUD fiscal services (étendu)
├── PaymentService.ts             # NEW: Service payments
├── DeclarationService.ts         # NEW: Tax declarations
├── DeclarationPaymentService.ts  # NEW: Declaration payments
├── CompanyService.ts             # NEW: Companies
├── UserCompanyRoleService.ts     # NEW: User-company roles
├── DocumentService.ts            # NEW: Documents metadata
├── CalculationService.ts         # EXTEND: Full calculation logic
├── FavoriteService.ts            # KEEP: User favorites
├── SyncService.ts                # EXTEND: Bidirectional sync
└── index.ts                      # Barrel export
```

**Exemple: PaymentService.ts (critique)**
```typescript
// src/database/services/PaymentService.ts
import { db } from '../DatabaseManager';
import { TABLE_NAMES } from '../schema';

export interface ServicePayment {
  id: string;
  payment_reference: string;
  fiscal_service_id: string;
  user_id: string;
  company_id?: string;
  payment_type: 'expedition' | 'renewal';
  base_amount: number;
  penalties: number;
  discounts: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'bange';
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paid_at?: string;
  receipt_number?: string;
  receipt_url?: string;
  bange_transaction_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  synced: number;
  sync_timestamp?: string;
}

export class PaymentService {
  /**
   * Create new payment record
   */
  static async createPayment(payment: Omit<ServicePayment, 'id' | 'created_at' | 'updated_at' | 'synced'>): Promise<string> {
    const id = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentData = {
      id,
      ...payment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: 0,
    };

    await db.insert(TABLE_NAMES.SERVICE_PAYMENTS, paymentData);

    // Add to sync queue
    await db.insert(TABLE_NAMES.SYNC_QUEUE, {
      table_name: TABLE_NAMES.SERVICE_PAYMENTS,
      record_id: id,
      operation: 'INSERT',
      data: JSON.stringify(paymentData),
    });

    return id;
  }

  /**
   * Get user payment history
   */
  static async getUserPayments(userId: string, limit: number = 50): Promise<ServicePayment[]> {
    return db.query<ServicePayment>(
      `SELECT sp.*, fs.name_es as service_name
       FROM service_payments sp
       LEFT JOIN fiscal_services fs ON sp.fiscal_service_id = fs.id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  }

  /**
   * Update payment status (after Bange callback)
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: ServicePayment['status'],
    bangeTransactionId?: string,
    receiptNumber?: string,
    receiptUrl?: string
  ): Promise<void> {
    await db.update(
      TABLE_NAMES.SERVICE_PAYMENTS,
      {
        status,
        bange_transaction_id: bangeTransactionId,
        receipt_number: receiptNumber,
        receipt_url: receiptUrl,
        paid_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        synced: 0,
      },
      'id = ?',
      [paymentId]
    );

    // Add update to sync queue
    await db.insert(TABLE_NAMES.SYNC_QUEUE, {
      table_name: TABLE_NAMES.SERVICE_PAYMENTS,
      record_id: paymentId,
      operation: 'UPDATE',
      data: JSON.stringify({ status, bange_transaction_id: bangeTransactionId }),
    });
  }

  /**
   * Get pending payments (for retry)
   */
  static async getPendingPayments(userId: string): Promise<ServicePayment[]> {
    return db.query<ServicePayment>(
      `SELECT * FROM service_payments
       WHERE user_id = ? AND status IN ('pending', 'processing')
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Calculate payment statistics
   */
  static async getPaymentStats(userId: string): Promise<{
    total_payments: number;
    total_amount: number;
    pending_amount: number;
    completed_count: number;
  }> {
    const result = await db.query<any>(
      `SELECT
        COUNT(*) as total_payments,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
       FROM service_payments
       WHERE user_id = ?`,
      [userId]
    );
    return result[0];
  }
}
```

**Similaire pour tous les autres services...**

#### **2.2 Sync Manager Complet (1 semaine)**

**Fichier: `src/services/SyncManager.ts` (étendu)**
```typescript
import { supabase } from './supabase';
import { db } from '../database/DatabaseManager';
import { TABLE_NAMES } from '../database/schema';

export type SyncDirection = 'download' | 'upload' | 'bidirectional';
export type SyncPriority = 'high' | 'medium' | 'low';

interface SyncConfig {
  tableName: string;
  supabaseTable: string;
  direction: SyncDirection;
  priority: SyncPriority;
  batchSize: number;
  conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'ask_user';
}

const SYNC_CONFIGS: SyncConfig[] = [
  // Reference data (server → client only)
  { tableName: TABLE_NAMES.LANGUAGES, supabaseTable: 'languages', direction: 'download', priority: 'high', batchSize: 100, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.MINISTRIES, supabaseTable: 'ministries', direction: 'download', priority: 'high', batchSize: 100, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.SECTORS, supabaseTable: 'sectors', direction: 'download', priority: 'high', batchSize: 200, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.CATEGORIES, supabaseTable: 'categories', direction: 'download', priority: 'high', batchSize: 200, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.FISCAL_SERVICES, supabaseTable: 'fiscal_services', direction: 'download', priority: 'high', batchSize: 500, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.REQUIRED_DOCUMENTS, supabaseTable: 'required_documents', direction: 'download', priority: 'medium', batchSize: 500, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.SERVICE_PROCEDURES, supabaseTable: 'service_procedures', direction: 'download', priority: 'medium', batchSize: 500, conflictResolution: 'server_wins' },
  { tableName: TABLE_NAMES.SERVICE_KEYWORDS, supabaseTable: 'service_keywords', direction: 'download', priority: 'medium', batchSize: 1000, conflictResolution: 'server_wins' },

  // User data (bidirectional sync)
  { tableName: TABLE_NAMES.USER_FAVORITES, supabaseTable: 'user_favorites', direction: 'bidirectional', priority: 'high', batchSize: 100, conflictResolution: 'merge' },
  { tableName: TABLE_NAMES.CALCULATIONS_HISTORY, supabaseTable: 'calculation_history', direction: 'bidirectional', priority: 'high', batchSize: 200, conflictResolution: 'client_wins' },
  { tableName: 'service_payments', supabaseTable: 'service_payments', direction: 'bidirectional', priority: 'high', batchSize: 100, conflictResolution: 'server_wins' },
  { tableName: 'tax_declarations', supabaseTable: 'tax_declarations', direction: 'bidirectional', priority: 'high', batchSize: 50, conflictResolution: 'merge' },
  { tableName: 'declaration_payments', supabaseTable: 'declaration_payments', direction: 'bidirectional', priority: 'high', batchSize: 100, conflictResolution: 'server_wins' },
  { tableName: 'companies', supabaseTable: 'companies', direction: 'download', priority: 'medium', batchSize: 50, conflictResolution: 'server_wins' },
  { tableName: 'documents', supabaseTable: 'documents', direction: 'bidirectional', priority: 'low', batchSize: 50, conflictResolution: 'server_wins' },
];

export class SyncManager {
  private isSyncing: boolean = false;

  /**
   * Full sync: Download reference data + upload user changes
   */
  async performFullSync(userId: string): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const results: SyncResult = {
      success: true,
      tables_synced: 0,
      records_downloaded: 0,
      records_uploaded: 0,
      errors: [],
      started_at: new Date().toISOString(),
      completed_at: '',
    };

    try {
      // Phase 1: Download reference data (high priority first)
      const downloadConfigs = SYNC_CONFIGS
        .filter(c => c.direction === 'download' || c.direction === 'bidirectional')
        .sort((a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority));

      for (const config of downloadConfigs) {
        const downloaded = await this.syncDownload(config, userId);
        results.records_downloaded += downloaded;
        results.tables_synced++;
      }

      // Phase 2: Upload user data
      const uploadConfigs = SYNC_CONFIGS.filter(c => c.direction === 'upload' || c.direction === 'bidirectional');

      for (const config of uploadConfigs) {
        const uploaded = await this.syncUpload(config, userId);
        results.records_uploaded += uploaded;
      }

      // Phase 3: Process sync queue (failed operations)
      const queueProcessed = await this.processSyncQueue(userId);
      results.records_uploaded += queueProcessed;

      results.completed_at = new Date().toISOString();

      // Update last sync timestamp
      await db.setMetadata('last_full_sync', results.completed_at);

      return results;
    } catch (error: any) {
      results.success = false;
      results.errors.push(error.message);
      return results;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Download data from Supabase to SQLite
   */
  private async syncDownload(config: SyncConfig, userId: string): Promise<number> {
    let totalDownloaded = 0;
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from(config.supabaseTable)
        .select('*')
        .range(offset, offset + config.batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      // Insert/update in SQLite
      await db.insertBatch(config.tableName, data);

      totalDownloaded += data.length;
      offset += config.batchSize;

      if (data.length < config.batchSize) break; // Last batch
    }

    console.log(`[Sync] Downloaded ${totalDownloaded} records from ${config.supabaseTable}`);
    return totalDownloaded;
  }

  /**
   * Upload local changes to Supabase
   */
  private async syncUpload(config: SyncConfig, userId: string): Promise<number> {
    // Get unsynced records
    const unsyncedRecords = await db.query(
      `SELECT * FROM ${config.tableName} WHERE synced = 0 AND user_id = ? LIMIT ${config.batchSize}`,
      [userId]
    );

    if (unsyncedRecords.length === 0) return 0;

    // Upload to Supabase
    const { error } = await supabase
      .from(config.supabaseTable)
      .upsert(unsyncedRecords, { onConflict: 'id' });

    if (error) throw error;

    // Mark as synced
    const ids = unsyncedRecords.map(r => r.id);
    await db.execute(
      `UPDATE ${config.tableName} SET synced = 1, sync_timestamp = datetime('now') WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    console.log(`[Sync] Uploaded ${unsyncedRecords.length} records to ${config.supabaseTable}`);
    return unsyncedRecords.length;
  }

  /**
   * Process pending sync queue (retry failed operations)
   */
  private async processSyncQueue(userId: string): Promise<number> {
    const queue = await db.query(
      `SELECT * FROM ${TABLE_NAMES.SYNC_QUEUE} WHERE retry_count < 5 ORDER BY created_at ASC LIMIT 50`
    );

    let processed = 0;

    for (const item of queue) {
      try {
        const data = JSON.parse(item.data);

        if (item.operation === 'INSERT') {
          await supabase.from(item.table_name).insert(data);
        } else if (item.operation === 'UPDATE') {
          await supabase.from(item.table_name).update(data).eq('id', item.record_id);
        } else if (item.operation === 'DELETE') {
          await supabase.from(item.table_name).delete().eq('id', item.record_id);
        }

        // Remove from queue on success
        await db.delete(TABLE_NAMES.SYNC_QUEUE, 'id = ?', [item.id]);
        processed++;
      } catch (error: any) {
        // Increment retry count
        await db.update(
          TABLE_NAMES.SYNC_QUEUE,
          { retry_count: item.retry_count + 1, last_error: error.message },
          'id = ?',
          [item.id]
        );
      }
    }

    return processed;
  }

  private priorityValue(priority: SyncPriority): number {
    return priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  }
}

interface SyncResult {
  success: boolean;
  tables_synced: number;
  records_downloaded: number;
  records_uploaded: number;
  errors: string[];
  started_at: string;
  completed_at: string;
}
```

#### **2.3 Custom Hooks (0.5 semaine)**

**Créer hooks React pour toutes les opérations:**
```typescript
// src/hooks/usePayments.ts
export function usePayments(userId: string) {
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PaymentService.getUserPayments(userId);
      setPayments(data);
    } catch (error) {
      console.error('[usePayments] Load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createPayment = useCallback(async (paymentData: Partial<ServicePayment>) => {
    const id = await PaymentService.createPayment(paymentData);
    await loadPayments(); // Refresh list
    return id;
  }, [loadPayments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return { payments, loading, createPayment, refresh: loadPayments };
}

// Similar hooks:
// - useDeclarations()
// - useCompanies()
// - useDocuments()
// - useCalculations()
```

### KPIs Phase 2

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Services créés** | 10+ service classes | Fichiers dans `src/database/services/` |
| **Sync bidirectionnel** | Upload + download fonctionnel | Test manuel + automatisé |
| **Hooks créés** | 8+ custom hooks | Test avec composants |
| **Tests unitaires** | >80% coverage services | Jest coverage report |
| **Performance sync** | < 30s pour full sync | Chronomètre |

**Seuil:** 5/5 KPIs validés

---

## 🧭 PHASE 3: NAVIGATION & ARCHITECTURE UI (2 SEMAINES)

### Objectif
Créer structure de navigation complète + architecture UI professionnelle

### Navigation Architecture

```
App
├─ AuthNavigator (Stack)
│  ├─ LoginScreen
│  ├─ RegisterScreen
│  ├─ ForgotPasswordScreen
│  └─ OnboardingScreen
│
└─ MainNavigator (Drawer)
   ├─ HomeTab (BottomTabs)
   │  ├─ HomeScreen
   │  ├─ ServicesStack
   │  │  ├─ ServicesListScreen
   │  │  ├─ ServiceDetailScreen
   │  │  ├─ ServiceCalculatorScreen
   │  │  └─ ServicePaymentScreen
   │  ├─ DeclarationsStack
   │  │  ├─ DeclarationsListScreen
   │  │  ├─ DeclarationFormScreen
   │  │  ├─ DeclarationReviewScreen
   │  │  └─ DeclarationPaymentScreen
   │  ├─ FavoritesScreen
   │  └─ ProfileStack
   │     ├─ ProfileScreen
   │     ├─ SettingsScreen
   │     ├─ PaymentHistoryScreen
   │     ├─ CalculationHistoryScreen
   │     └─ AboutScreen
   │
   ├─ CompanyNavigator (Stack) [Si user a role entreprise]
   │  ├─ CompanyDashboardScreen
   │  ├─ CompanyDeclarationsScreen
   │  ├─ CompanyPaymentsScreen
   │  ├─ CompanyDocumentsScreen
   │  └─ CompanyTeamScreen
   │
   └─ SearchScreen (Modal)
```

### Écrans Principaux (15+ écrans)

#### **Groupe 1: Authentication (4 écrans)**
1. **OnboardingScreen** - Introduction app (3 slides)
2. **LoginScreen** - Connexion email/password
3. **RegisterScreen** - Inscription utilisateur
4. **ForgotPasswordScreen** - Réinitialisation mot de passe

#### **Groupe 2: Home & Services (6 écrans)**
5. **HomeScreen** - Dashboard principal
   - Services populaires
   - Déclarations récentes
   - Quick actions
   - Statistiques utilisateur

6. **ServicesListScreen** - Liste tous services fiscaux
   - Recherche/filtres
   - Catégories
   - Tri

7. **ServiceDetailScreen** - Détail service
   - Description complète
   - Documents requis
   - Procédure étape par étape
   - Délais et prix
   - Bouton calculer

8. **ServiceCalculatorScreen** - Calculateur
   - Formulaire dynamique selon service
   - Calcul temps réel
   - Détails du calcul
   - Bouton payer

9. **ServicePaymentScreen** - Paiement service
   - Récapitulatif
   - Sélection méthode paiement
   - Intégration Bange
   - Confirmation

10. **SearchScreen** - Recherche globale
    - Full-text search
    - Historique recherches
    - Suggestions

#### **Groupe 3: Declarations (4 écrans)**
11. **DeclarationsListScreen** - Liste déclarations
    - Drafts
    - Submitted
    - Deadlines

12. **DeclarationFormScreen** - Formulaire déclaration
    - Formulaire dynamique par type
    - Sauvegarde auto (draft)
    - Validation

13. **DeclarationReviewScreen** - Révision déclaration
    - Récapitulatif
    - PDF preview
    - Bouton soumettre

14. **DeclarationPaymentScreen** - Paiement déclaration
    - Montant calculé
    - Pénalités si applicable
    - Méthodes paiement

#### **Groupe 4: Profile & Settings (6 écrans)**
15. **FavoritesScreen** - Services favoris

16. **ProfileScreen** - Profil utilisateur
    - Infos personnelles
    - Statistiques
    - Badges/achievements

17. **SettingsScreen** - Paramètres
    - Langue
    - Notifications
    - Sécurité
    - Sync

18. **PaymentHistoryScreen** - Historique paiements
    - Liste tous paiements
    - Filtres
    - Reçus

19. **CalculationHistoryScreen** - Historique calculs
    - Liste calculs
    - Recalculer
    - Sauvegarder

20. **AboutScreen** - À propos
    - Version app
    - Crédits
    - Conditions d'utilisation

#### **Groupe 5: Company (5 écrans) [Optionnel]**
21. **CompanyDashboardScreen** - Dashboard entreprise
22. **CompanyDeclarationsScreen** - Déclarations entreprise
23. **CompanyPaymentsScreen** - Paiements entreprise
24. **CompanyDocumentsScreen** - Documents entreprise
25. **CompanyTeamScreen** - Gestion équipe

### Components Library (30+ composants)

**Atomic Design:**
```
src/components/
├── atoms/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Text.tsx
│   ├── Badge.tsx
│   ├── Icon.tsx
│   ├── Loader.tsx
│   ├── Avatar.tsx
│   └── Checkbox.tsx
│
├── molecules/
│   ├── ServiceCard.tsx
│   ├── DeclarationCard.tsx
│   ├── PaymentCard.tsx
│   ├── StatCard.tsx
│   ├── SearchBar.tsx
│   ├── FilterChips.tsx
│   ├── PriceDisplay.tsx
│   ├── StatusBadge.tsx
│   └── EmptyState.tsx
│
├── organisms/
│   ├── ServiceList.tsx
│   ├── DeclarationForm.tsx
│   ├── PaymentForm.tsx
│   ├── CalculatorForm.tsx
│   ├── Header.tsx
│   ├── Drawer.tsx
│   ├── BottomSheet.tsx
│   └── Modal.tsx
│
└── templates/
    ├── ScreenLayout.tsx
    ├── FormLayout.tsx
    ├── ListLayout.tsx
    └── DetailsLayout.tsx
```

### Design System

**Theme:**
```typescript
// src/theme/index.ts
export const theme = {
  colors: {
    primary: '#1E40AF', // Blue (GE flag colors)
    secondary: '#DC2626', // Red (GE flag colors)
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    disabled: '#9CA3AF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal' },
    small: { fontSize: 12, fontWeight: 'normal' },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};
```

### KPIs Phase 3

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Écrans créés** | 20+ écrans | Count screens |
| **Navigation complète** | Tous flows navigables | Test manuel |
| **Composants créés** | 30+ composants | Count components |
| **Design system** | Thème appliqué partout | Visual inspection |
| **Responsive** | Fonctionne phone + tablet | Test devices |

**Seuil:** 5/5 KPIs validés

---

## 💼 PHASE 4: FEATURES MÉTIER - CALCULS, PAIEMENTS & CHATBOT AI (5 SEMAINES)

### Objectif
Implémenter TOUTES les fonctionnalités métier critiques incluant le chatbot AI offline

### 4.1 Calculateur Avancé (2 semaines)

**Moteur de calcul universel:**
```typescript
// src/services/CalculationEngine.ts
export class CalculationEngine {
  /**
   * Calculate fiscal service amount using advanced formulas
   */
  static calculate(
    service: FiscalService,
    inputs: CalculationInputs
  ): CalculationResult {
    const method = service.calculation_method;

    switch (method) {
      case 'fixed':
        return this.calculateFixed(service, inputs);

      case 'formula':
        return this.calculateFormula(service, inputs);

      case 'percentage':
        return this.calculatePercentage(service, inputs);

      case 'tiered':
        return this.calculateTiered(service, inputs);

      default:
        throw new Error(`Unknown calculation method: ${method}`);
    }
  }

  /**
   * Fixed amount calculation
   */
  private static calculateFixed(service: FiscalService, inputs: CalculationInputs): CalculationResult {
    const baseAmount = inputs.calculation_type === 'expedition'
      ? service.tasa_expedicion
      : service.tasa_renovacion;

    return {
      base_amount: baseAmount,
      subtotal: baseAmount,
      penalties: 0,
      discounts: 0,
      total: baseAmount,
      breakdown: [
        { label: 'Base amount', amount: baseAmount }
      ],
      formula_used: 'fixed',
      calculation_details: { method: 'fixed', inputs },
    };
  }

  /**
   * Formula-based calculation (evaluate JavaScript formula)
   */
  private static calculateFormula(service: FiscalService, inputs: CalculationInputs): CalculationResult {
    const formula = inputs.calculation_type === 'expedition'
      ? service.expedition_formula
      : service.renewal_formula;

    if (!formula) {
      throw new Error('Formula not defined for this service');
    }

    // Parse formula and evaluate
    // Example formula: "base * 0.15 + (employees > 10 ? 50000 : 0)"
    const calculatedAmount = this.evaluateFormula(formula, inputs);

    return {
      base_amount: calculatedAmount,
      subtotal: calculatedAmount,
      penalties: 0,
      discounts: 0,
      total: calculatedAmount,
      breakdown: this.parseFormulaBreakdown(formula, inputs, calculatedAmount),
      formula_used: formula,
      calculation_details: { method: 'formula', formula, inputs },
    };
  }

  /**
   * Percentage-based calculation
   */
  private static calculatePercentage(service: FiscalService, inputs: CalculationInputs): CalculationResult {
    const percentage = service.base_percentage || 0;
    const baseValue = inputs[service.percentage_of as keyof CalculationInputs] as number || 0;
    const calculatedAmount = (baseValue * percentage) / 100;

    return {
      base_amount: calculatedAmount,
      subtotal: calculatedAmount,
      penalties: 0,
      discounts: 0,
      total: calculatedAmount,
      breakdown: [
        { label: `Base (${service.percentage_of})`, amount: baseValue },
        { label: `Tax (${percentage}%)`, amount: calculatedAmount },
      ],
      formula_used: `${service.percentage_of} * ${percentage}%`,
      calculation_details: { method: 'percentage', percentage, baseValue },
    };
  }

  /**
   * Tiered/progressive calculation
   */
  private static calculateTiered(service: FiscalService, inputs: CalculationInputs): CalculationResult {
    const tiers = JSON.parse(service.rate_tiers || '[]');
    const baseValue = inputs.taxable_base || 0;

    let totalTax = 0;
    const breakdown: Array<{ label: string; amount: number }> = [];

    for (const tier of tiers) {
      if (baseValue > tier.min_value) {
        const tierBase = Math.min(
          baseValue - tier.min_value,
          tier.max_value ? tier.max_value - tier.min_value : Infinity
        );
        const tierTax = (tierBase * tier.rate) / 100;
        totalTax += tierTax;

        breakdown.push({
          label: `Tier ${tier.tier_number}: ${tier.min_value}-${tier.max_value || '∞'} @ ${tier.rate}%`,
          amount: tierTax,
        });
      }
    }

    return {
      base_amount: baseValue,
      subtotal: totalTax,
      penalties: 0,
      discounts: 0,
      total: totalTax,
      breakdown,
      formula_used: 'tiered',
      calculation_details: { method: 'tiered', tiers, baseValue },
    };
  }

  /**
   * Calculate late penalties
   */
  static calculatePenalties(
    service: FiscalService,
    baseAmount: number,
    daysLate: number
  ): number {
    if (daysLate <= 0) return 0;

    const rules = JSON.parse(service.penalty_calculation_rules || '{}');

    let penalty = 0;

    // Fixed penalty
    if (service.late_penalty_fixed) {
      penalty += service.late_penalty_fixed;
    }

    // Percentage penalty
    if (service.late_penalty_percentage) {
      penalty += (baseAmount * service.late_penalty_percentage) / 100;
    }

    // Progressive daily penalty (if in rules)
    if (rules.daily_rate) {
      penalty += baseAmount * (rules.daily_rate / 100) * daysLate;
    }

    return penalty;
  }

  /**
   * Safe formula evaluation (sandboxed)
   */
  private static evaluateFormula(formula: string, inputs: Record<string, any>): number {
    // Simple eval with allowed variables only
    // TODO: Use a proper math expression parser (mathjs) for security
    const context = { ...inputs, Math };
    const fn = new Function(...Object.keys(context), `return ${formula}`);
    return fn(...Object.values(context));
  }

  private static parseFormulaBreakdown(
    formula: string,
    inputs: Record<string, any>,
    result: number
  ): Array<{ label: string; amount: number }> {
    // Parse formula to create breakdown
    // Simplified version
    return [
      { label: 'Calculated amount', amount: result },
    ];
  }
}

interface CalculationInputs {
  calculation_type: 'expedition' | 'renewal';
  taxable_base?: number;
  employees?: number;
  annual_revenue?: number;
  property_value?: number;
  vehicle_value?: number;
  [key: string]: any;
}

interface CalculationResult {
  base_amount: number;
  subtotal: number;
  penalties: number;
  discounts: number;
  total: number;
  breakdown: Array<{ label: string; amount: number }>;
  formula_used: string;
  calculation_details: Record<string, any>;
}
```

**Composant CalculatorScreen:**
```typescript
// Formulaire dynamique qui s'adapte au service
// Validation inputs
// Calcul temps réel
// Affichage détails calcul
// Bouton sauvegarder calcul
// Bouton procéder au paiement
```

### 4.2 Système de Paiement (2 semaines)

**Intégration Bange (Mobile Money GE):**
```typescript
// src/services/BangePaymentService.ts
export class BangePaymentService {
  /**
   * Initialize payment with Bange
   */
  static async initiatePayment(
    paymentData: {
      amount: number;
      service_id: string;
      user_id: string;
      description: string;
    }
  ): Promise<{
    payment_url: string;
    payment_reference: string;
    qr_code?: string;
  }> {
    // Call Bange API to initiate payment
    const response = await fetch('https://api.bange.gq/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BANGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: 'XAF',
        description: paymentData.description,
        callback_url: 'taxasge://payment-callback',
        metadata: {
          service_id: paymentData.service_id,
          user_id: paymentData.user_id,
        },
      }),
    });

    const data = await response.json();

    return {
      payment_url: data.payment_url,
      payment_reference: data.reference,
      qr_code: data.qr_code,
    };
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(paymentReference: string): Promise<PaymentStatus> {
    const response = await fetch(`https://api.bange.gq/v1/payments/${paymentReference}/status`, {
      headers: {
        'Authorization': `Bearer ${BANGE_API_KEY}`,
      },
    });

    const data = await response.json();

    return {
      status: data.status, // 'pending', 'completed', 'failed'
      transaction_id: data.transaction_id,
      receipt_url: data.receipt_url,
    };
  }

  /**
   * Handle payment callback (deep link)
   */
  static handlePaymentCallback(url: string): { reference: string; status: string } {
    // Parse deep link: taxasge://payment-callback?reference=XXX&status=success
    const params = new URLSearchParams(url.split('?')[1]);
    return {
      reference: params.get('reference') || '',
      status: params.get('status') || '',
    };
  }
}
```

**Flow paiement complet:**
1. User clique "Payer" sur calculateur
2. Création record `service_payments` (status: pending)
3. Appel Bange API → Obtenir payment_url
4. Ouvrir WebView ou app Bange
5. User paye via Mobile Money
6. Callback reçu (deep link)
7. Vérifier statut via API
8. Update record `service_payments` (status: completed)
9. Sync vers Supabase
10. Afficher reçu

### 4.3 Chatbot AI Offline (1 semaine)

**Architecture Chatbot:**

Le chatbot utilise un modèle TensorFlow Lite embarqué pour fonctionner **100% offline** sans connexion internet.

**Assets ML Existants:**
```
src/assets/ml/
├── taxasge_model.tflite      # Modèle TF Lite (classification d'intentions)
├── taxasge_model_best.h5     # Modèle original Keras (backup)
├── tokenizer.json             # Tokenizer (267 KB)
└── intents.json               # Intentions supportées
```

**Intentions Supportées (7 catégories):**
1. `greeting` - Salutations
2. `thanks` - Remerciements
3. `get_general_info` - Informations générales sur service
4. `get_price` - Prix d'un service
5. `get_renewal_price` - Prix de renouvellement
6. `get_procedure` - Procédure étape par étape
7. `get_documents` - Documents requis

**Service Chatbot:**
```typescript
// src/services/ChatbotService.ts
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  intent?: string;
  confidence?: number;
  service_id?: string;
}

interface Intent {
  name: string;
  patterns: string[];
  responses: string[];
  context?: string;
  requires_service?: boolean;
}

export class ChatbotService {
  private static model: tf.LayersModel | null = null;
  private static tokenizer: any = null;
  private static intents: Record<string, number> = {};
  private static isInitialized: boolean = false;
  private static maxSequenceLength: number = 20;

  /**
   * Initialize TensorFlow Lite model and tokenizer
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[Chatbot] Initializing TF Lite model...');

    try {
      // Initialize TensorFlow.js for React Native
      await tf.ready();

      // Load model
      const modelJson = require('../assets/ml/taxasge_model.tflite');
      this.model = await tf.loadLayersModel(bundleResourceIO(modelJson));

      // Load tokenizer
      const tokenizerData = require('../assets/ml/tokenizer.json');
      this.tokenizer = tokenizerData;

      // Load intents mapping
      const intentsData = require('../assets/ml/intents.json');
      this.intents = intentsData;

      this.isInitialized = true;
      console.log('[Chatbot] Initialization complete!');
    } catch (error) {
      console.error('[Chatbot] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process user message and get bot response
   */
  static async chat(
    userMessage: string,
    context?: {
      current_service?: string;
      user_id?: string;
      conversation_history?: ChatMessage[];
    }
  ): Promise<ChatMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. Tokenize and pad input
    const inputSequence = this.tokenizeMessage(userMessage);

    // 2. Predict intent
    const prediction = await this.predictIntent(inputSequence);

    // 3. Get response based on intent
    const response = await this.getResponseForIntent(
      prediction.intent,
      prediction.confidence,
      context
    );

    return {
      id: `bot_${Date.now()}`,
      text: response,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      intent: prediction.intent,
      confidence: prediction.confidence,
    };
  }

  /**
   * Tokenize user message
   */
  private static tokenizeMessage(message: string): number[] {
    const words = message.toLowerCase().trim().split(/\s+/);
    const sequence: number[] = [];

    for (const word of words) {
      const tokenId = this.tokenizer.word_index[word];
      if (tokenId) {
        sequence.push(tokenId);
      }
    }

    // Pad sequence to maxSequenceLength
    while (sequence.length < this.maxSequenceLength) {
      sequence.push(0); // Padding
    }

    return sequence.slice(0, this.maxSequenceLength);
  }

  /**
   * Predict intent using TF model
   */
  private static async predictIntent(inputSequence: number[]): Promise<{
    intent: string;
    confidence: number;
  }> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Convert to tensor
    const inputTensor = tf.tensor2d([inputSequence], [1, this.maxSequenceLength]);

    // Predict
    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const probabilities = await prediction.data();

    // Get highest probability intent
    let maxProb = 0;
    let maxIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    // Map index to intent name
    const intentName = Object.keys(this.intents).find(
      key => this.intents[key] === maxIndex
    ) || 'unknown';

    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();

    return {
      intent: intentName,
      confidence: maxProb,
    };
  }

  /**
   * Get response for predicted intent
   */
  private static async getResponseForIntent(
    intent: string,
    confidence: number,
    context?: any
  ): Promise<string> {
    // Low confidence fallback
    if (confidence < 0.5) {
      return "Désolé, je n'ai pas bien compris. Pouvez-vous reformuler votre question?";
    }

    switch (intent) {
      case 'greeting':
        return this.getGreetingResponse();

      case 'thanks':
        return "De rien! N'hésitez pas si vous avez d'autres questions.";

      case 'get_general_info':
        return await this.getServiceInfo(context?.current_service);

      case 'get_price':
        return await this.getServicePrice(context?.current_service, 'expedition');

      case 'get_renewal_price':
        return await this.getServicePrice(context?.current_service, 'renewal');

      case 'get_procedure':
        return await this.getServiceProcedure(context?.current_service);

      case 'get_documents':
        return await this.getRequiredDocuments(context?.current_service);

      default:
        return "Je peux vous aider avec:\n• Informations sur les services\n• Prix et tarifs\n• Procédures à suivre\n• Documents requis\n\nQue voulez-vous savoir?";
    }
  }

  /**
   * Get greeting response (random variation)
   */
  private static getGreetingResponse(): string {
    const greetings = [
      "Bonjour! Je suis votre assistant fiscal TaxasGE. Comment puis-je vous aider?",
      "Salut! Posez-moi des questions sur les services fiscaux en Guinée Équatoriale.",
      "Bienvenue! Je suis là pour vous aider avec vos démarches fiscales.",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get service general information from database
   */
  private static async getServiceInfo(serviceId?: string): Promise<string> {
    if (!serviceId) {
      return "De quel service fiscal voulez-vous des informations? Vous pouvez chercher un service ou me donner son nom.";
    }

    // Query database
    const service = await db.query(
      `SELECT name_es, description_es, service_type, processing_time_days
       FROM fiscal_services WHERE id = ? OR code = ?`,
      [serviceId, serviceId]
    );

    if (service.length === 0) {
      return "Service non trouvé. Pouvez-vous préciser le nom du service?";
    }

    const s = service[0];
    return `📋 **${s.name_es}**\n\n${s.description_es}\n\n⏱ Délai: ${s.processing_time_days} jours\n📂 Type: ${s.service_type}`;
  }

  /**
   * Get service price
   */
  private static async getServicePrice(
    serviceId?: string,
    type: 'expedition' | 'renewal' = 'expedition'
  ): Promise<string> {
    if (!serviceId) {
      return "De quel service voulez-vous connaître le prix?";
    }

    const service = await db.query(
      `SELECT name_es, expedition_amount, renewal_amount, currency,
              calculation_method, tasa_expedicion, tasa_renovacion
       FROM fiscal_services WHERE id = ? OR code = ?`,
      [serviceId, serviceId]
    );

    if (service.length === 0) {
      return "Service non trouvé.";
    }

    const s = service[0];
    const amount = type === 'expedition'
      ? (s.tasa_expedicion || s.expedition_amount)
      : (s.tasa_renovacion || s.renewal_amount);

    if (s.calculation_method === 'formula') {
      return `💰 **${s.name_es}** (${type === 'expedition' ? 'Expédition' : 'Renouvellement'})\n\nLe prix dépend d'une formule de calcul. Utilisez le calculateur pour obtenir le montant exact.`;
    }

    if (s.calculation_method === 'tiered') {
      return `💰 **${s.name_es}** (${type === 'expedition' ? 'Expédition' : 'Renouvellement'})\n\nLe prix est progressif selon le montant. Utilisez le calculateur pour obtenir le montant exact.`;
    }

    return `💰 **${s.name_es}** (${type === 'expedition' ? 'Expédition' : 'Renouvellement'})\n\nPrix: ${amount.toLocaleString()} ${s.currency}`;
  }

  /**
   * Get service procedure
   */
  private static async getServiceProcedure(serviceId?: string): Promise<string> {
    if (!serviceId) {
      return "Pour quel service voulez-vous connaître la procédure?";
    }

    const procedures = await db.query(
      `SELECT step_number, title_es, description_es, estimated_duration_minutes
       FROM service_procedures
       WHERE fiscal_service_id = ?
       ORDER BY step_number ASC`,
      [serviceId]
    );

    if (procedures.length === 0) {
      return "Aucune procédure détaillée disponible pour ce service.";
    }

    let response = "📝 **Procédure étape par étape:**\n\n";
    for (const proc of procedures) {
      response += `${proc.step_number}. ${proc.title_es}\n`;
      if (proc.description_es) {
        response += `   ${proc.description_es}\n`;
      }
      if (proc.estimated_duration_minutes) {
        response += `   ⏱ ${proc.estimated_duration_minutes} min\n`;
      }
      response += '\n';
    }

    return response;
  }

  /**
   * Get required documents
   */
  private static async getRequiredDocuments(serviceId?: string): Promise<string> {
    if (!serviceId) {
      return "Pour quel service voulez-vous connaître les documents requis?";
    }

    const documents = await db.query(
      `SELECT document_name_es, is_mandatory, document_type
       FROM required_documents
       WHERE fiscal_service_id = ?
       ORDER BY is_mandatory DESC, order_index ASC`,
      [serviceId]
    );

    if (documents.length === 0) {
      return "Aucun document spécifique requis pour ce service.";
    }

    let response = "📄 **Documents requis:**\n\n";
    for (const doc of documents) {
      const mandatory = doc.is_mandatory ? '✅' : '⭕';
      response += `${mandatory} ${doc.document_name_es}\n`;
    }

    return response;
  }

  /**
   * Save conversation to database (optional)
   */
  static async saveConversation(
    userId: string,
    messages: ChatMessage[]
  ): Promise<void> {
    // Store in calculations_history or separate chat_history table
    const conversationData = {
      user_id: userId,
      messages: JSON.stringify(messages),
      created_at: new Date().toISOString(),
    };

    // Optional: save to local DB for analytics
    console.log('[Chatbot] Conversation saved:', conversationData);
  }
}
```

**Composant ChatScreen:**
```typescript
// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatbotService, ChatMessage } from '../services/ChatbotService';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize chatbot on mount
    initializeChatbot();
  }, []);

  const initializeChatbot = async () => {
    try {
      await ChatbotService.initialize();
      // Send welcome message
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        text: 'Bonjour! Je suis votre assistant fiscal TaxasGE. Posez-moi des questions sur les services fiscaux.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    } catch (error) {
      console.error('[Chat] Initialization failed:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Get bot response
    try {
      const botResponse = await ChatbotService.chat(inputText, {
        conversation_history: messages,
      });

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('[Chat] Error:', error);
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        text: 'Désolé, une erreur est survenue. Réessayez.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={{
      flexDirection: item.sender === 'user' ? 'row-reverse' : 'row',
      marginVertical: 8,
      marginHorizontal: 16,
    }}>
      <View style={{
        backgroundColor: item.sender === 'user' ? '#1E40AF' : '#F3F4F6',
        borderRadius: 16,
        padding: 12,
        maxWidth: '75%',
      }}>
        <Text style={{
          color: item.sender === 'user' ? '#FFFFFF' : '#111827',
        }}>
          {item.text}
        </Text>
        {item.confidence && (
          <Text style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>
            Confiance: {(item.confidence * 100).toFixed(0)}%
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <View style={{ padding: 16 }}>
          <Text>Assistant is typing...</Text>
        </View>
      )}

      <View style={{
        flexDirection: 'row',
        padding: 8,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
      }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          placeholder="Posez votre question..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{
            backgroundColor: '#1E40AF',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF' }}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
```

**Features Chatbot:**
- ✅ **100% Offline** - Modèle TensorFlow Lite embarqué
- ✅ **7 Intentions** - Salutations, prix, procédures, documents, etc.
- ✅ **Multilingue** - Espagnol (primaire), Français, Anglais
- ✅ **Context-aware** - Se souvient du service en cours
- ✅ **Intégration DB** - Répond avec données réelles
- ✅ **Rapide** - Inférence < 100ms
- ✅ **Léger** - Modèle ~2 MB

**Améliorations Futures (Phase 5+):**
- Fine-tuning avec plus de données conversationnelles
- Support de plus d'intentions (15-20)
- Génération de réponses (GPT-like) au lieu de templates
- Voice input (Speech-to-text)
- Suggestions intelligentes

### KPIs Phase 4

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Calculs formules** | 4 méthodes implémentées | Test chaque méthode |
| **Pénalités** | Calcul auto pénalités retard | Test avec dates |
| **Paiement Bange** | Flow complet fonctionnel | Test e2e paiement |
| **Chatbot AI** | 7 intentions fonctionnelles, offline | Test conversations |
| **Performance chatbot** | Réponse < 500ms | Chronomètre |
| **Historique** | Calculs et paiements sauvegardés | Vérifier DB |
| **Offline** | Calculs et chatbot offline OK | Mode avion |

**Seuil:** 7/7 KPIs validés

---

## 📄 PHASE 5: FEATURES AVANCÉES - DÉCLARATIONS & ENTREPRISES (3 SEMAINES)

### 5.1 Déclarations Fiscales (2 semaines)

**Types de déclarations supportés:**
1. TVA mensuelle/trimestrielle
2. Impôt sur le revenu annuel
3. Retenue à la source
4. Taxe foncière
5. Autres déclarations

**Formulaires dynamiques:**
```typescript
// Chaque type de déclaration a son propre formulaire
// Exemple: TVA mensuelle
const VATMonthlyForm = {
  declaration_type: 'monthly_vat',
  fields: [
    { name: 'fiscal_period', type: 'month', required: true, label: 'Période fiscale' },
    { name: 'taxable_sales', type: 'currency', required: true, label: 'Ventes taxables' },
    { name: 'vat_collected', type: 'currency', required: true, label: 'TVA collectée' },
    { name: 'taxable_purchases', type: 'currency', required: true, label: 'Achats taxables' },
    { name: 'vat_paid', type: 'currency', required: true, label: 'TVA payée' },
    { name: 'vat_due', type: 'currency', calculated: true, formula: 'vat_collected - vat_paid' },
  ],
  validations: {
    vat_collected: 'must_equal_taxable_sales_times_vat_rate',
    vat_due: 'must_be_positive_or_zero',
  },
  sections: [
    { title: 'Ventes', fields: ['taxable_sales', 'vat_collected'] },
    { title: 'Achats', fields: ['taxable_purchases', 'vat_paid'] },
    { title: 'Résultat', fields: ['vat_due'] },
  ],
};
```

**Features déclarations:**
- ✅ Sauvegarde auto (drafts)
- ✅ Validation avant soumission
- ✅ Génération PDF
- ✅ Signature électronique (si requis)
- ✅ Soumission vers Supabase
- ✅ Suivi statut (acceptée/rejetée)
- ✅ Amendement (si rejetée)
- ✅ Paiement associé

### 5.2 Gestion Entreprises (1 semaine)

**Features entreprises:**
1. **Profile entreprise**
   - Infos légales
   - Secteur d'activité
   - Coordonnées

2. **Gestion équipe**
   - Inviter membres
   - Rôles (owner, admin, accountant, viewer)
   - Permissions

3. **Déclarations entreprise**
   - Lier déclaration à entreprise
   - Historique déclarations entreprise

4. **Paiements entreprise**
   - Historique paiements entreprise
   - Rapports financiers

### KPIs Phase 5

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Types déclarations** | 5 types implémentés | Test chaque type |
| **Sauvegarde draft** | Auto-save toutes les 30s | Test timer |
| **Validation** | Erreurs affichées | Test formulaire invalide |
| **PDF génération** | PDF créé | Test génération |
| **Gestion équipe** | Invitations fonctionnent | Test invite |

**Seuil:** 5/5 KPIs validés

---

## 🎨 PHASE 6: UI/UX POLISH & ACCESSIBILITÉ (2 SEMAINES)

### Objectif
Application professionnelle, accessible, performante

### Tâches

#### 6.1 UI Polish (1 semaine)
- Animations fluides (React Native Reanimated)
- Skeleton loaders
- Error states designs
- Empty states designs
- Pull-to-refresh
- Infinite scroll
- Image optimization
- Dark mode (optionnel)

#### 6.2 Accessibilité (0.5 semaine)
- Screen reader support
- Labels accessibles
- Contraste AA (WCAG 2.1)
- Touch targets ≥ 44x44
- Focus management
- Keyboard navigation (Android TV si applicable)

#### 6.3 Performance (0.5 semaine)
- Lazy loading écrans
- Memo components
- Optimize re-renders
- Image caching
- Database query optimization
- FlatList optimization

### KPIs Phase 6

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Animations** | 60fps constant | Flipper profiler |
| **Accessibilité** | Score AA | Axe DevTools |
| **Performance** | TTI < 3s | React DevTools |
| **Responsive** | Phone + tablet | Test devices |
| **Polish** | UI professionnelle | User testing |

**Seuil:** 5/5 KPIs validés

---

## 🧪 PHASE 7: TESTS COMPLETS (2 SEMAINES)

### 7.1 Tests Unitaires (1 semaine)

**Coverage cible: >80%**

```
src/__tests__/
├── database/
│   ├── DatabaseManager.test.ts
│   ├── PaymentService.test.ts
│   ├── DeclarationService.test.ts
│   └── SyncService.test.ts
│
├── services/
│   ├── CalculationEngine.test.ts
│   ├── BangePaymentService.test.ts
│   └── SyncManager.test.ts
│
├── hooks/
│   ├── usePayments.test.ts
│   ├── useDeclarations.test.ts
│   └── useCalculations.test.ts
│
└── components/
    ├── ServiceCard.test.tsx
    ├── DeclarationForm.test.tsx
    └── CalculatorForm.test.tsx
```

### 7.2 Tests d'Intégration (0.5 semaine)

**Scenarios critiques:**
1. Full sync workflow
2. Calculation → Payment → Receipt
3. Declaration draft → Submit → Payment
4. Offline → Online sync

### 7.3 Tests E2E (0.5 semaine)

**Detox tests:**
```typescript
// e2e/flows/payment.e2e.ts
describe('Payment Flow', () => {
  it('should complete full payment flow', async () => {
    await element(by.id('home-screen')).tap();
    await element(by.id('services-tab')).tap();
    await element(by.id('service-card-0')).tap();
    await element(by.id('calculate-button')).tap();
    // Fill calculator form
    await element(by.id('input-base-amount')).typeText('100000');
    await element(by.id('calculate-button')).tap();
    // Verify calculation
    await expect(element(by.id('total-amount'))).toHaveText('115000 XAF');
    await element(by.id('pay-button')).tap();
    // Payment screen
    await element(by.id('payment-method-bange')).tap();
    await element(by.id('confirm-payment-button')).tap();
    // Verify payment initiated
    await expect(element(by.id('payment-status'))).toHaveText('pending');
  });
});
```

### KPIs Phase 7

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Unit test coverage** | >80% | Jest coverage |
| **Integration tests** | 10+ scénarios | Test report |
| **E2E tests** | 5+ flows | Detox report |
| **Bug fixes** | 0 bugs critiques | Bug tracker |
| **Performance tests** | <3s TTI | Lighthouse |

**Seuil:** 5/5 KPIs validés

---

## 🚀 PHASE 8: VALIDATION & PRODUCTION (2 SEMAINES)

### 8.1 User Acceptance Testing (1 semaine)

**Beta testing:**
- 10+ utilisateurs beta
- Feedback formulaire
- Bug reporting
- Feature requests

### 8.2 Production Readiness (1 semaine)

**Checklist:**
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation complète
- [ ] API keys production
- [ ] Error tracking (Sentry)
- [ ] Analytics configured
- [ ] App signed (Android/iOS)
- [ ] Store assets (screenshots, description)
- [ ] Privacy policy
- [ ] Terms of service

### 8.3 Deployment

**Android:**
1. Build release APK/AAB
2. Sign with release keystore
3. Upload Google Play Console
4. Internal testing track
5. Beta testing track
6. Production rollout (staged 10% → 50% → 100%)

**iOS:**
1. Build archive
2. Upload TestFlight
3. Beta testing
4. Submit App Store review
5. Production release

### KPIs Phase 8

| KPI | Critère Succès | Méthode Validation |
|-----|----------------|-------------------|
| **Beta feedback** | >8/10 satisfaction | Survey |
| **Crash rate** | <1% | Firebase Crashlytics |
| **Store approval** | Approved | App Store/Play Store |
| **Documentation** | 100% complète | Checklist |
| **Production** | App live | Store link |

**Seuil:** 5/5 KPIs validés

---

## 📊 RÉSUMÉ GLOBAL

### Timeline Complète

```
Semaine 1-2:   Phase 1 - Migration Schéma SQLite
Semaine 3-5:   Phase 2 - Services Core & Sync
Semaine 6-7:   Phase 3 - Navigation & Architecture UI
Semaine 8-11:  Phase 4 - Features Métier (Calculs, Paiements)
Semaine 12-14: Phase 5 - Features Avancées (Déclarations, Entreprises)
Semaine 15-16: Phase 6 - UI/UX Polish & Accessibilité
Semaine 17-18: Phase 7 - Tests Complets
Semaine 19-20: Phase 8 - Validation & Production
```

**Durée totale: 20 semaines (5 mois)**

### Budget Temps

| Phase | Durée | % Total |
|-------|-------|---------|
| Phase 1 | 2 sem | 10% |
| Phase 2 | 3 sem | 15% |
| Phase 3 | 2 sem | 10% |
| Phase 4 | 4 sem | 20% |
| Phase 5 | 3 sem | 15% |
| Phase 6 | 2 sem | 10% |
| Phase 7 | 2 sem | 10% |
| Phase 8 | 2 sem | 10% |

### Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Intégration Bange bloquée | Moyenne | Élevé | Prévoir mock payment pour tests |
| Performance SQLite sur gros volumes | Faible | Moyen | Indexes optimisés, pagination |
| Formules de calcul complexes | Moyenne | Moyen | Utiliser mathjs library |
| Sync conflicts | Moyenne | Moyen | Conflict resolution stratégies |
| Store rejection | Faible | Élevé | Review guidelines avant soumission |

### Dépendances Critiques

**Techniques:**
- ✅ React Native 0.80.0 (migré)
- ✅ SQLite (configuré)
- ✅ Supabase (configuré)
- ⏳ Bange API (à intégrer)
- ⏳ react-native-pdf (génération PDF)
- ⏳ mathjs (formules calcul)

**Métier:**
- ⏳ Accès API Bange production
- ⏳ Données fiscales complètes dans Supabase
- ⏳ Formules de calcul validées par expert fiscal

---

## ✅ VALIDATION PLAN

### Critères de Succès Globaux

**Technique:**
- ✅ Application fonctionne offline 100%
- ✅ Sync bidirectionnel fiable
- ✅ 0 crash en production
- ✅ Performance: TTI < 3s, 60fps
- ✅ Tests: >80% coverage

**Fonctionnel:**
- ✅ Calculs exacts (validés par expert)
- ✅ Paiements fonctionnels (Bange intégré)
- ✅ Déclarations soumises avec succès
- ✅ Gestion entreprises opérationnelle
- ✅ 25+ écrans fonctionnels

**Qualité:**
- ✅ UI professionnelle
- ✅ Accessibilité AA
- ✅ Multilingue (ES/FR/EN)
- ✅ Documentation complète
- ✅ User satisfaction >8/10

### Next Steps Immédiats

1. **Valider ce plan** avec équipe/stakeholders
2. **Prioriser** si budget/temps limité
3. **Démarrer Phase 1** (migration schéma)
4. **Setup CI/CD** pour automatiser tests
5. **Créer Jira/Trello** pour tracking

---

**Plan créé le:** 2025-10-08
**Auteur:** Kouemou Sah Jean Emac
**Statut:** ✅ PRÊT POUR EXÉCUTION
**Version:** 1.0.0

---

*Ce plan est basé sur une analyse critique et rigoureuse des lacunes du schéma SQLite actuel vs Supabase. Chaque phase a été conçue pour combler ces lacunes de manière systématique et produire une application mobile production-ready.*
