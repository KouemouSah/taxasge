# TaxasGE Mobile - Base de Données SQLite

## 📋 Vue d'ensemble

Système de base de données SQLite optimisé pour le mode **offline-first** avec synchronisation bidirectionnelle vers Supabase.

## 🏗️ Architecture

```
src/database/
├── schema.ts              # Définition schema SQL + constantes
├── DatabaseManager.ts     # Gestionnaire CRUD SQLite
├── SyncService.ts         # Synchronisation Supabase <-> SQLite
├── services/              # Services d'accès aux données
│   ├── FiscalServicesService.ts
│   └── FavoritesService.ts
├── index.ts               # Exports centralisés
└── README.md              # Cette documentation
```

## 📊 Tables Principales

### Tables Référence (données fiscales)
- `ministries` - Ministères (14 entrées)
- `sectors` - Secteurs par ministère (18 entrées)
- `categories` - Catégories par secteur (105+ entrées)
- `fiscal_services` - Services fiscaux (600+ entrées)
- `required_documents` - Documents requis par service

### Tables Utilisateur
- `user_favorites` - Favoris utilisateur (sync Supabase)
- `calculations_history` - Historique calculs (sync Supabase)

### Tables Cache & Sync
- `sync_queue` - Queue de synchronisation différée
- `sync_metadata` - Métadonnées de sync (timestamps)
- `search_cache` - Cache des recherches populaires

### Full-Text Search
- `fiscal_services_fts` - Index FTS5 pour recherche rapide

## 🚀 Utilisation

### 1. Initialisation

```typescript
import {initDatabase, performInitialSync} from '@/database';

// Au démarrage de l'app
await initDatabase();

// Premier sync des données
await performInitialSync(userId);
```

### 2. Recherche de Services

```typescript
import {fiscalServicesService} from '@/database';

// Recherche full-text
const results = await fiscalServicesService.search('permis conduire', 20);

// Services populaires
const popular = await fiscalServicesService.getPopular(10);

// Filtres avancés
const filtered = await fiscalServicesService.getFiltered({
  ministryId: 'MIN001',
  serviceType: 'license',
  maxAmount: 50000,
  onlineOnly: true,
}, 50);

// Service par ID
const service = await fiscalServicesService.getById('FS001');
```

### 3. Gestion des Favoris

```typescript
import {favoritesService} from '@/database';

// Ajouter favori
await favoritesService.addFavorite(
  userId,
  serviceId,
  'Ma note personnelle',
  ['urgent', 'important']
);

// Vérifier si favori
const isFav = await favoritesService.isFavorite(userId, serviceId);

// Liste favoris
const favorites = await favoritesService.getUserFavorites(userId);

// Supprimer favori
await favoritesService.removeFavorite(userId, serviceId);
```

### 4. Synchronisation

```typescript
import {syncService} from '@/database';

// Sync complète (données référence + utilisateur)
const result = await syncService.fullSync(userId);

// Sync uniquement favoris
await syncService.syncFavorites(userId);

// Sync uniquement calculs
await syncService.syncCalculationsHistory(userId);

// Vérifier connexion
const online = await syncService.isOnline();
```

### 5. Opérations CRUD Directes

```typescript
import {db} from '@/database';

// Query simple
const results = await db.query<MyType>(
  'SELECT * FROM table WHERE id = ?',
  [id]
);

// Insert
const insertId = await db.insert('table', {
  field1: 'value1',
  field2: 'value2',
});

// Update
const rowsAffected = await db.update(
  'table',
  {field1: 'newValue'},
  'id = ?',
  [id]
);

// Delete
await db.delete('table', 'id = ?', [id]);

// Transaction
await db.transaction(async (tx) => {
  // Multiple operations
  await db.insert('table1', data1);
  await db.update('table2', data2, 'id = ?', [id]);
});
```

### 6. Utilitaires

```typescript
import {getDatabaseStats, resetDatabase} from '@/database';

// Statistiques
const stats = await getDatabaseStats();
console.log(stats);
// {
//   fiscal_services: 547,
//   ministries: 14,
//   user_favorites: 5,
//   ...
// }

// Reset complet (DEV ONLY)
await resetDatabase();
```

## 🔍 Recherche Full-Text (FTS5)

La table `fiscal_services_fts` utilise SQLite FTS5 pour des recherches ultra-rapides:

```typescript
// Recherche simple
await fiscalServicesService.search('permis');

// Recherche avec opérateurs
await fiscalServicesService.search('permis OR licence');

// Les recherches sont automatiquement indexées et optimisées
```

**Champs indexés:**
- `code` - Code service
- `name_es`, `name_fr`, `name_en` - Noms multilingues
- `description_es` - Description
- `category_name`, `ministry_name` - Hiérarchie

## 🔄 Stratégie de Synchronisation

### Mode Offline-First

1. **Toutes les lectures** → SQLite locale (instantané)
2. **Toutes les écritures** → SQLite + Queue sync
3. **Connexion détectée** → Sync automatique queue
4. **Sync périodique** → Toutes les 6h (configurable)

### Queue de Synchronisation

Les opérations utilisateur (favoris, calculs) sont:
1. Enregistrées immédiatement en local (UX instantanée)
2. Marquées `synced = 0`
3. Ajoutées à la `sync_queue`
4. Synchronisées dès que possible
5. Marquées `synced = 1` après succès

### Gestion des Conflits

- **Données référence** : Server wins (écrasement local)
- **Données utilisateur** : Last-write-wins avec timestamp
- **Retry automatique** : 5 tentatives max avec backoff exponentiel

## 📈 Performance

### Optimisations Implémentées

✅ **Indexes stratégiques** sur toutes les FK et filtres fréquents
✅ **FTS5** pour recherche plein texte ultra-rapide
✅ **Vues matérialisées** pour requêtes complexes courantes
✅ **Batch inserts** pour sync massive (1000+ rows/sec)
✅ **Transactions** pour garantir l'intégrité ACID
✅ **Cache recherches** pour queries répétitives

### Benchmarks Attendus

- Recherche FTS: **< 50ms** (10K services)
- Query simple: **< 10ms**
- Insert favoris: **< 20ms**
- Sync complète: **< 5sec** (première fois)
- Sync incrémentale: **< 1sec**

## 🧪 Tests

```typescript
import {db, fiscalServicesService} from '@/database';

// Test connexion
await db.init();
console.log('✅ Database connected');

// Test recherche
const results = await fiscalServicesService.search('permis', 5);
console.log(`✅ Found ${results.length} services`);

// Test stats
const stats = await db.getStats();
console.log('✅ Database stats:', stats);
```

## 🔧 Maintenance

### Reset Database (Dev)

```typescript
import {resetDatabase, performInitialSync} from '@/database';

await resetDatabase();
await performInitialSync(userId);
```

### Migrations (Futures Versions)

Les migrations seront gérées via `database_version` dans `sync_metadata`:

```typescript
const currentVersion = await db.getMetadata('database_version');
if (currentVersion < '2.0.0') {
  // Run migration scripts
  await db.executeSQL(MIGRATION_2_0_0_SQL);
  await db.setMetadata('database_version', '2.0.0');
}
```

## 🐛 Debugging

```typescript
// Enable SQLite debug logs
import SQLite from 'react-native-sqlite-storage';
SQLite.DEBUG(true);

// Logs apparaissent dans:
// - Metro bundler console
// - adb logcat (Android)
// - Xcode console (iOS)
```

## 📝 Notes Importantes

⚠️ **Ne jamais faire de `DROP TABLE` en production** - Risque perte de données non synchronisées
⚠️ **Toujours wrapper les opérations critiques** dans des transactions
⚠️ **Vérifier `isOnline()` avant sync** pour éviter erreurs réseau
⚠️ **Tester les migrations** sur copie de DB avant déploiement

## 📚 Références

- [React Native SQLite Storage](https://github.com/andpor/react-native-sqlite-storage)
- [SQLite FTS5 Documentation](https://www.sqlite.org/fts5.html)
- [Supabase Client JS](https://supabase.com/docs/reference/javascript)

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-10-01
