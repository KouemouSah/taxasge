# 🌍 TaxasGE I18N Structure

Structure de traductions pour TaxasGE (Espagnol, Français, Anglais)

## 📁 Structure

```
i18n/
├── es/               # Espagnol (langue principale)
│   ├── enums.json    # Traductions ENUMs PostgreSQL (103 keys)
│   ├── entities.json # Traductions Entités (ministries, services, etc.) (662 keys)
│   └── common.json   # Traductions communes UI (~450 keys)
├── fr/               # Français
│   ├── enums.json    # (6.50 KB)
│   ├── entities.json # (40.62 KB)
│   └── common.json   # (16.28 KB)
├── en/               # Anglais
│   ├── enums.json    # (6.16 KB)
│   ├── entities.json # (36.57 KB)
│   └── common.json   # (14.76 KB)
└── README.md         # Documentation
```

**Total**: ~1215 keys × 3 langues = **3645 traductions**

## 🔄 Workflow Traductions

### 1. Source de vérité : `data/enums.md`

Fichier markdown contenant toutes les traductions ENUM :

```markdown
### user_role_enum

**citizen**
- es: Ciudadano
- fr: Citoyen
- en: Citizen
```

### 2. Génération automatique

```bash
# Étape 1 : Parser enums.md → JSON
node scripts/parse-enums-md.mjs

# Étape 2 : Générer SQL seed
node scripts/generate-enum-translations-sql.mjs

# Étape 3 : Sync DB → Frontend
node scripts/sync-db-to-i18n.mjs
```

### 3. Import en base de données

```bash
# Importer traductions dans Supabase
psql -f data/seed/seed_enum_translations.sql
```

## 📊 Architecture I18N Hybride

### Entités principales (ministries, sectors, categories, services)
- **ES** : Colonnes `name_es`, `description_es` (source DB)
- **FR/EN** : Table `translation_status` (soft reference)

```sql
SELECT
  fs.name_es,
  ts_fr.content as name_fr,
  ts_en.content as name_en
FROM fiscal_services fs
LEFT JOIN translation_status ts_fr
  ON ts_fr.entity_code = fs.service_code
  AND ts_fr.field_name = 'name'
  AND ts_fr.language_code = 'fr'
LEFT JOIN translation_status ts_en
  ON ts_en.entity_code = fs.service_code
  AND ts_en.field_name = 'name'
  AND ts_en.language_code = 'en';
```

### ENUMs PostgreSQL
- **Table** : `enum_translations`
- **Stratégie** : Contexte explicite (pas de déduplication)
- **Clé** : `(enum_type, enum_value, language_code)`

```sql
SELECT translation
FROM enum_translations
WHERE enum_type = 'user_role_enum'
  AND enum_value = 'citizen'
  AND language_code = 'fr';
-- Résultat: "Citoyen"
```

## 💻 Usage Frontend

### Import traductions

```typescript
import esEnums from './i18n/es/enums.json';
import frEnums from './i18n/fr/enums.json';
import enEnums from './i18n/en/enums.json';

// Exemple: Next.js i18n
const i18nEnums = {
  es: esEnums,
  fr: frEnums,
  en: enEnums
};
```

### Accès traductions

```typescript
// Récupérer traduction ENUM
const currentLang = 'fr';
const role = i18nEnums[currentLang]['user_role_enum.citizen'];
// → "Citoyen"

const status = i18nEnums['es']['payment_status_enum.pending'];
// → "Pendiente"
```

### Exemple React Component Complet

```tsx
import { useTranslation } from 'next-i18next';
import esEnums from './i18n/es/enums.json';
import frEnums from './i18n/fr/enums.json';
import enEnums from './i18n/en/enums.json';
import esEntities from './i18n/es/entities.json';
import frEntities from './i18n/fr/entities.json';
import enEntities from './i18n/en/entities.json';
import esCommon from './i18n/es/common.json';
import frCommon from './i18n/fr/common.json';
import enCommon from './i18n/en/common.json';

const i18n = {
  es: { enums: esEnums, entities: esEntities, common: esCommon },
  fr: { enums: frEnums, entities: frEntities, common: frCommon },
  en: { enums: enEnums, entities: enEntities, common: enCommon }
};

function ServiceCard({ serviceCode, role }: { serviceCode: string, role: string }) {
  const { i18n: { language } } = useTranslation();
  const t = i18n[language];

  return (
    <div>
      <h3>{t.entities[`services.${serviceCode}`]}</h3>
      <span className="badge">{t.enums[`user_role_enum.${role}`]}</span>
      <button>{t.common['common.view']}</button>
    </div>
  );
}
```

## 🔧 Maintenance

### Ajouter une traduction ENUM

1. Modifier `data/enums.md`
2. Régénérer JSON + SQL + i18n :
   ```bash
   npm run i18n:sync
   ```
3. Importer en base de données

### Script package.json

```json
{
  "scripts": {
    "i18n:sync": "node scripts/parse-enums-md.mjs && node scripts/generate-enum-translations-sql.mjs && node scripts/sync-db-to-i18n.mjs"
  }
}
```

## 📈 Statistiques

- **ENUMs** : 15 types
- **Valeurs** : 103 valeurs uniques
- **Traductions** : 309 entrées (103 × 3 langues)
- **Taille** : ~6.5 KB par langue

## ✅ Validation

```bash
# Vérifier cohérence
node scripts/parse-enums-md.mjs

# Output attendu :
# ✓ 15 ENUMs
# ✓ 103 valeurs
# ✓ 309 traductions (attendu: 309)
```

## 🚨 Principes

- ✅ **YAGNI** : Pas de déduplication prématurée
- ✅ **KISS** : Mapping 1:1 simple
- ✅ **Contexte explicite** : Chaque ENUM garde ses traductions
- ✅ **Soft reference** : Pas de FK DB (flexibilité)
- ✅ **Source unique** : `enums.md` → DB + Frontend
