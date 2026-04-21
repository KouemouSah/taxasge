# Internationalization (i18n) Guide

## Overview

Facil supports three languages, reflecting the linguistic reality of Equatorial Guinea:

| Language | Code | Role |
|----------|------|------|
| Spanish | `es` | Primary language (official language of GE) |
| French | `fr` | Secondary language (official language of GE) |
| English | `en` | Tertiary language (international) |

Spanish is the default and source language. All database content is stored in Spanish, with translations managed through a dedicated system.

## Architecture

Translation happens at multiple levels:

```
+---------------------+     +----------------------+     +------------------+
| Frontend (next-intl)|     | Backend (DB-driven)  |     | Database          |
| messages/*.json     |     | translations table   |     | (Spanish source) |
+---------------------+     +----------------------+     +------------------+
| UI labels           |     | ENUM translations    |     | ministries.name  |
| Button text         |     | Form field labels    |     | sectors.name_es  |
| Navigation          |     | Error messages       |     | categories.name  |
| Validation msgs     |     | System messages      |     | fiscal_services  |
+---------------------+     +----------------------+     +------------------+
```

## Frontend Translations

### File Location

```
packages/web/messages/
  es.json    # Spanish (source of truth)
  fr.json    # French
  en.json    # English
```

### Framework: next-intl

Configuration in `packages/web/src/i18n/`:

```typescript
// config.ts - Supported locales
export const locales = ['es', 'fr', 'en'] as const;
export const defaultLocale = 'es';
```

### URL Structure

All routes are locale-prefixed:

```
/es/dashboard          # Spanish
/fr/dashboard          # French
/en/dashboard          # English
```

### Using Translations in Components

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('dashboard');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description', { count: 5 })}</p>
    </div>
  );
}
```

### JSON Structure

Translation files use nested keys:

```json
{
  "dashboard": {
    "title": "Panel de control",
    "description": "Tienes {count} solicitudes pendientes",
    "tabs": {
      "overview": "Resumen",
      "requests": "Solicitudes",
      "payments": "Pagos"
    }
  },
  "auth": {
    "login": "Iniciar sesion",
    "register": "Registrarse",
    "forgot_password": "Olvide mi contrasena"
  }
}
```

### Adding New Translation Keys

1. Add the key to `es.json` (source language) first
2. Add corresponding translations to `fr.json` and `en.json`
3. Use the key in your component via `useTranslations(namespace)`
4. Keys must match across all three files

## Backend Translations

### Database Tables

| Table | Purpose |
|-------|---------|
| `translations` | Unified translations for ENUMs, UI strings, Forms, and System messages |
| `entity_translations` | Optimized translations for entities (ministries, sectors, categories) -- 40% storage reduction |

### Translation Categories

| Category | Description | Example |
|----------|-------------|---------|
| `enum` | Database enum value labels | payment_status: "completed" -> "Completado" / "Termine" / "Completed" |
| `ui` | Backend-generated UI text | Error messages, success messages |
| `form` | Form field labels and placeholders | "Nombre completo" / "Nom complet" / "Full name" |
| `system` | System messages and notifications | Email subjects, SMS content |

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/translations/?category=enum&locale=fr` | Fetch translations by category and locale |
| `GET /api/v1/entity-translations/ministries?locale=fr` | Fetch ministry translations |
| `GET /api/v1/frontend-translations/sync` | Sync frontend JSON from DB |
| `POST /api/v1/translations/` | Create new translation (admin) |
| `PUT /api/v1/translations/{id}` | Update translation (admin) |
| `GET /api/v1/enums/{enum_name}/values` | Get enum values with translations |

### Language Detection

The backend detects the user's language from:

1. `Accept-Language` header (primary)
2. User profile `preferred_language` setting
3. Default: `es` (Spanish)

```python
# In middleware (language_middleware.py)
accept = request.headers.get("Accept-Language", "es")
lang = accept[:2] if accept[:2] in ("es", "fr", "en") else "es"
request.state.language = lang
```

### Error Message Translation

All error messages are auto-translated based on the detected language:

```python
from app.core.errors import TranslatedException, ErrorCode

raise TranslatedException(
    status_code=400,
    error_code=ErrorCode.INVALID_CREDENTIALS,
    lang=request.state.language
)
# Returns: "Credenciales invalidas" (es) / "Identifiants invalides" (fr) / "Invalid credentials" (en)
```

## Entity Translations

Government entities (ministries, sectors, categories) are stored in Spanish in their primary tables and translated via `entity_translations`:

```sql
-- Primary table (Spanish)
SELECT name FROM ministries WHERE id = 1;
-- "Ministerio de Hacienda y Presupuestos"

-- Translation
SELECT translated_name FROM entity_translations
WHERE entity_type = 'ministry' AND entity_id = 1 AND locale = 'fr';
-- "Ministere des Finances et du Budget"
```

## Fiscal Service Translations

The 873+ fiscal services have multilingual descriptions managed through:

1. **Base data** in `fiscal_services` table (Spanish)
2. **AI-enriched descriptions** via the Enrichment module (Gemini generates 600-char descriptions)
3. **Translations** via `entity_translations` for French and English

## Adding a New Language

To add a fourth language (e.g., Portuguese):

### Frontend

1. Add locale to `packages/web/src/i18n/config.ts`:
   ```typescript
   export const locales = ['es', 'fr', 'en', 'pt'] as const;
   ```
2. Create `packages/web/messages/pt.json` with all keys translated
3. Update Next.js middleware for the new locale

### Backend

1. Add the locale to the language detection middleware
2. Add translations to the `translations` table for the new locale
3. Add entity translations for the new locale
4. Update error message mappings in `app/core/errors.py`

## Translation Management Admin UI

Admin users can manage translations through:

- **Entity Translations**: `/admin/translations/entities` -- Manage ministry, sector, category translations
- **Frontend JSON Sync**: `/admin/translations/frontend` -- Sync JSON files from DB
- **ENUM Management**: `/admin/translations/enums` -- Add/modify enum value translations

## Best Practices

1. **Always add all three languages** when creating a new key
2. **Use namespaced keys** (e.g., `dashboard.title`, not just `title`)
3. **Use interpolation** for dynamic values: `{count} solicitudes` not string concatenation
4. **Keep translations short** -- UI space is limited, especially on mobile
5. **Test all three locales** after adding new translations
6. **Spanish is the source of truth** -- translate from Spanish, never from another translation
