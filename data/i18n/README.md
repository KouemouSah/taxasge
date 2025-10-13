# Système de Traductions TaxasGE v2.1

## Vue d'ensemble

Ce dossier contient tous les fichiers de traductions pour l'application TaxasGE (Guinée Équatoriale) en **3 langues**:
- **ES** (Espagnol) - Langue par défaut de la Guinée Équatoriale
- **FR** (Français) - Langue officielle de la Guinée Équatoriale
- **EN** (Anglais) - Langue internationale

## Structure des fichiers

```
data/i18n/
├── es.json          # Traductions Espagnol (13 KB)
├── fr.json          # Traductions Français (13 KB)
├── en.json          # Traductions Anglais (12 KB)
├── schema.json      # JSON Schema pour validation
└── README.md        # Ce fichier
```

## Format des fichiers JSON

Chaque fichier JSON suit la même structure hiérarchique:

```json
{
  "meta": {
    "locale": "es",
    "language": "Español",
    "version": "2.1.0"
  },
  "enum": {
    "user_role": { ... },
    "payment_status": { ... }
  },
  "menu": { ... },
  "button": { ... },
  "form": { ... },
  "message": { ... },
  "fiscal": { ... },
  "bank": { ... }
}
```

## Catégories de traductions

| Catégorie | Description | Exemple clés |
|-----------|-------------|--------------|
| **enum** | Valeurs des énumérations PostgreSQL | `user_role.citizen`, `payment_status.pending` |
| **menu** | Navigation et menus | `dashboard`, `fiscal_services`, `declarations` |
| **button** | Boutons et actions | `save`, `submit`, `cancel`, `approve` |
| **form** | Labels de formulaires | `nif`, `full_name`, `email`, `fiscal_year` |
| **message** | Messages système | `success_save`, `error_generic`, `warning_unsaved_changes` |
| **fiscal** | Périodes fiscales | `months.01`, `quarters.q1`, `periods.annual` |
| **bank** | Noms des banques | `bange`, `bgfi`, `cceibank`, `sgbge`, `ecobank` |
| **dashboard** | Labels dashboard | `total_services`, `pending_payments` |
| **table** | Headers tableaux | `id`, `name`, `status`, `actions` |
| **pagination** | Pagination | `page`, `of`, `per_page`, `first`, `last` |
| **filter** | Filtres | `filter_by`, `sort_by`, `date_range` |
| **validation** | Messages validation | `min_length`, `max_value`, `invalid_date` |
| **agent** | Dashboard agents | `queue_title`, `priority_critical`, `sla_breached` |

## Utilisation dans React/Next.js

### 1. Installation de la librairie i18n

```bash
npm install i18next react-i18next i18next-http-backend
```

### 2. Configuration i18next (i18n.ts)

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Import fichiers JSON
import es from './i18n/es.json';
import fr from './i18n/fr.json';
import en from './i18n/en.json';

i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: 'es', // Langue par défaut
    fallbackLng: 'es', // Fallback si traduction manquante
    interpolation: {
      escapeValue: false // React échappe déjà
    }
  });

export default i18next;
```

### 3. Utilisation dans les composants

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  // Traduction simple
  const title = t('menu.dashboard'); // "Panel de Control" (es)

  // Traduction avec namespace
  const userRole = t('enum.user_role.citizen'); // "Ciudadano" (es)

  // Traduction avec interpolation
  const minLength = t('validation.min_length', { min: 8 }); // "Mínimo 8 caracteres"

  // Changer de langue
  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div>
      <h1>{title}</h1>
      <p>{userRole}</p>
      <button onClick={() => switchLanguage('fr')}>FR</button>
      <button onClick={() => switchLanguage('en')}>EN</button>
    </div>
  );
}
```

### 4. Exemple d'utilisation pour ENUMs

```typescript
// Afficher statut paiement traduit
function PaymentStatus({ status }: { status: string }) {
  const { t } = useTranslation();

  return (
    <span className="status">
      {t(`enum.payment_status.${status}`)}
    </span>
  );
}

// Usage:
<PaymentStatus status="pending" /> // "Pendiente" (es), "En Attente" (fr), "Pending" (en)
```

### 5. Hook personnalisé pour les ENUMs

```typescript
// hooks/useEnumTranslation.ts
import { useTranslation } from 'react-i18next';

export function useEnumTranslation(enumType: string) {
  const { t } = useTranslation();

  return (enumValue: string) => {
    return t(`enum.${enumType}.${enumValue}`);
  };
}

// Usage:
function DeclarationTypeSelect() {
  const translateDeclarationType = useEnumTranslation('declaration_type');

  return (
    <select>
      <option value="income_tax">{translateDeclarationType('income_tax')}</option>
      <option value="vat_declaration">{translateDeclarationType('vat_declaration')}</option>
    </select>
  );
}
```

## Utilisation dans PostgreSQL

### 1. Charger les traductions en base

```bash
# Charger la migration de création de table
psql -U postgres -d taxasge -f data/migrations/005_create_unified_translations_table.sql

# Charger les traductions
psql -U postgres -d taxasge -f data/seed/seed_all_translations_v2.1.sql
```

### 2. Récupérer une traduction dans SQL

```sql
-- Récupération simple (avec fallback automatique)
SELECT get_translation('ui.button', 'save', 'fr');
-- Résultat: "Enregistrer"

-- Récupération ENUM traduit
SELECT get_translation('enum', 'payment_status.pending', 'es');
-- Résultat: "Pendiente"

-- Récupération avec contexte
SELECT get_translation('form.label', 'nif', 'en', 'common');
-- Résultat: "TIN (Tax ID No.)"
```

### 3. Utiliser dans une requête JOIN

```sql
-- Afficher statut de paiement traduit
SELECT
    p.id,
    p.amount,
    p.status as status_code,
    get_translation('enum', 'payment_status.' || p.status, 'fr') as status_label
FROM payments p
LIMIT 10;
```

### 4. MATERIALIZED VIEW pour export

```sql
-- Rafraîchir la vue d'export
REFRESH MATERIALIZED VIEW translations_export;

-- Exporter vers JSON (pour frontend)
COPY (
    SELECT jsonb_object_agg(key_code, translations) as data
    FROM translations_export
    WHERE category = 'enum'
) TO '/tmp/enum_translations.json';
```

## Statistiques

| Langue | Traductions | Taille fichier |
|--------|------------|----------------|
| ES     | 500+       | ~13 KB         |
| FR     | 500+       | ~13 KB         |
| EN     | 500+       | ~12 KB         |

**Total**: ~1500+ traductions complètes

## Couverture

- ✅ **ENUMs** (16 types): 100% traduits
- ✅ **UI Navigation**: 100% traduite
- ✅ **Boutons & Actions**: 100% traduits
- ✅ **Labels Formulaires**: 100% traduits
- ✅ **Messages Système**: 100% traduits
- ✅ **Périodes Fiscales**: 100% traduites
- ✅ **Banques**: 100% traduites
- ✅ **Dashboard Agents**: 100% traduit

## Maintenance

### Ajouter une nouvelle traduction

1. **Ajouter en SQL** (data/seed/seed_all_translations_v2.1.sql):
```sql
INSERT INTO translations (category, key_code, context, es, fr, en) VALUES
('ui.label', 'new_label', 'context', 'Nuevo Label', 'Nouveau Label', 'New Label');
```

2. **Ajouter dans les fichiers JSON** (data/i18n/es.json, fr.json, en.json):
```json
{
  "ui_label": {
    "new_label": "Nuevo Label"  // es.json
  }
}
```

3. **Recharger en base**:
```bash
psql -U postgres -d taxasge -f data/seed/seed_all_translations_v2.1.sql
```

### Validation automatique

Créer un script de validation TypeScript:

```typescript
// scripts/validate-translations.ts
import es from '../data/i18n/es.json';
import fr from '../data/i18n/fr.json';
import en from '../data/i18n/en.json';

function validateTranslations() {
  const esKeys = JSON.stringify(Object.keys(es));
  const frKeys = JSON.stringify(Object.keys(fr));
  const enKeys = JSON.stringify(Object.keys(en));

  if (esKeys !== frKeys || esKeys !== enKeys) {
    console.error('❌ Les clés de traductions ne correspondent pas!');
    process.exit(1);
  }

  console.log('✅ Toutes les traductions sont synchronisées');
}

validateTranslations();
```

## Support

Pour toute question sur le système de traductions, contacter:
- **Développeur**: KOUEMOU SAH Jean Emac
- **Version**: 2.1.0
- **Date**: 2025-01-12
