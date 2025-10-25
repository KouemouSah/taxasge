# 🚀 Traductions TaxasGE - Quick Start Guide

**Version**: 2.1 | **Date**: 2025-01-12 | **Status**: ✅ PRÊT

---

## 📊 En bref

- **500+ clés** × **3 langues** (ES/FR/EN) = **~1,500 traductions**
- **100% couverture**: ENUMs, UI, Formulaires, Messages, Périodes, Workflow
- **2 tables**: `translations` (unifiée) + `entity_translations` (entités métier)
- **Installation**: **15 minutes**

---

## ⚡ Installation (4 étapes)

```bash
# Étape 1: Schéma principal (5 min)
psql -U postgres -d taxasge -f data/schema_taxage2.sql

# Étape 2: Table translations unifiée (2 min)
psql -U postgres -d taxasge -f data/migrations/005_create_unified_translations_table.sql

# Étape 3: Supprimer table redondante (1 min)
psql -U postgres -d taxasge -f data/migrations/007_cleanup_redundant_translations.sql

# Étape 4: Charger traductions (5 min)
psql -U postgres -d taxasge -f data/seed/seed_all_translations_v2.1.sql
```

---

## ✅ Validation rapide

```sql
-- Test 1: enum_translations supprimée?
SELECT table_name FROM information_schema.tables
WHERE table_name = 'enum_translations';
-- Attendu: 0 rows ✅

-- Test 2: Traductions chargées?
SELECT COUNT(*) FROM translations;
-- Attendu: ~500 ✅

-- Test 3: Traduction ENUM fonctionne?
SELECT get_translation('enum', 'payment_status.pending', 'fr');
-- Attendu: "En Attente" ✅

-- Test 4: Traduction UI fonctionne?
SELECT get_translation('ui.button', 'save', 'es');
-- Attendu: "Guardar" ✅

-- Test 5: Fallback fonctionne?
SELECT get_translation('ui.button', 'unknown_key_xyz', 'fr');
-- Attendu: "unknown_key_xyz" ✅
```

---

## 🎓 Utilisation PostgreSQL

```sql
-- Traduction ENUM
SELECT get_translation('enum', 'payment_status.pending', 'fr');
-- → "En Attente"

-- Traduction bouton
SELECT get_translation('ui.button', 'save', 'es');
-- → "Guardar"

-- Traduction formulaire
SELECT get_translation('form.label', 'nif', 'en');
-- → "TIN (Tax ID No.)"

-- Traduction message
SELECT get_translation('system.message', 'success_save', 'fr');
-- → "Enregistré avec succès"

-- Traduire dans une requête
SELECT
    p.id,
    p.status,
    get_translation('enum', 'payment_status.' || p.status, 'fr') as status_label
FROM payments p;
```

---

## 🎨 Utilisation Frontend (React/Next.js)

### Installation i18next

```bash
npm install i18next react-i18next i18next-http-backend

# Copier fichiers JSON
cp data/i18n/*.json public/locales/
# OU
cp data/i18n/*.json src/locales/
```

### Configuration i18next

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: 'es',                    // Langue par défaut
    fallbackLng: 'es',
    supportedLngs: ['es', 'fr', 'en'],
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
  });

export default i18n;
```

### Usage dans composants

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('menu.dashboard')}</h1>
      {/* ES: "Panel de Control" */}
      {/* FR: "Tableau de Bord" */}
      {/* EN: "Dashboard" */}

      <button>{t('button.save')}</button>
      {/* ES: "Guardar" */}
      {/* FR: "Enregistrer" */}
      {/* EN: "Save" */}

      <label>{t('form.nif')}</label>
      {/* ES/FR: "N.I.F." */}
      {/* EN: "TIN (Tax ID No.)" */}

      {/* Changer langue */}
      <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
      <button onClick={() => i18n.changeLanguage('es')}>ES</button>
    </div>
  );
}
```

### Hook personnalisé pour ENUMs

```typescript
// hooks/useEnumTranslation.ts
import { useTranslation } from 'react-i18next';

export function useEnumTranslation(enumType: string) {
  const { t } = useTranslation();

  return (enumValue: string) => {
    return t(`enum.${enumType}.${enumValue}`);
  };
}

// Usage
function PaymentStatus({ status }: { status: string }) {
  const translateStatus = useEnumTranslation('payment_status');

  return (
    <span className="status">
      {translateStatus(status)}
      {/* "pending" → "Pendiente" (es) / "En Attente" (fr) / "Pending" (en) */}
    </span>
  );
}
```

---

## 📁 Fichiers disponibles

| Fichier | Description |
|---------|-------------|
| `data/migrations/005_create_unified_translations_table.sql` | Création table `translations` |
| `data/migrations/007_cleanup_redundant_translations.sql` | Suppression table `enum_translations` |
| `data/seed/seed_all_translations_v2.1.sql` | 1,500+ traductions ES/FR/EN |
| `data/i18n/es.json` | Traductions Espagnol (13 KB) |
| `data/i18n/fr.json` | Traductions Français (13 KB) |
| `data/i18n/en.json` | Traductions Anglais (12 KB) |
| `data/i18n/README.md` | Guide complet i18next |
| `INSTALLATION_TRADUCTIONS.md` | Guide installation détaillé |
| `TRADUCTIONS_SUMMARY.md` | Résumé exécutif |
| `.github/docs-internal/RAPPORT_TRADUCTIONS_v2.1.md` | Rapport technique complet (45 KB) |

---

## 🏗️ Architecture finale

```
┌─────────────────────────────────────────────────┐
│       SYSTÈME DE TRADUCTIONS (v2.1)             │
├─────────────────────────────────────────────────┤
│                                                 │
│  TABLE 1: translations (PRINCIPALE)             │
│  ├─ Usage: ENUMs + UI + Formulaires +          │
│  │         Messages + Périodes + TOUT          │
│  ├─ Format: 1 row = 1 clé × 3 langues         │
│  ├─ Fonction: get_translation(cat, key, lang)  │
│  └─ Rows: ~500                                  │
│                                                 │
│  TABLE 2: entity_translations (SÉPARÉE)         │
│  ├─ Usage: Entités métier SEULEMENT            │
│  │         (ministries, services, documents)   │
│  ├─ Format: 1 row par entité × langue          │
│  ├─ Fonction: get_entity_translation(...)      │
│  └─ Rows: ~1,800 (après seed entités)          │
│                                                 │
│  ❌ SUPPRIMÉ: enum_translations (redondante)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📚 Documentation complète

1. **Ce fichier**: Quick Start (lecture: 5 min)
2. **INSTALLATION_TRADUCTIONS.md**: Guide installation détaillé (lecture: 10 min)
3. **TRADUCTIONS_SUMMARY.md**: Résumé exécutif (lecture: 15 min)
4. **data/i18n/README.md**: Guide utilisation i18next (lecture: 20 min)
5. **RAPPORT_TRADUCTIONS_v2.1.md**: Rapport technique complet (lecture: 60 min)

---

## 🎯 Résultat

✅ **Architecture propre**: 2 tables (zéro redondance)
✅ **Couverture complète**: 500+ clés, 1,500+ traductions
✅ **Performance optimale**: Indexes GIN, fallback automatique
✅ **Prêt production**: Tests validés, documentation complète

---

**Version**: 2.1.0
**Date**: 2025-01-12
**Status**: ✅ PRODUCTION READY
