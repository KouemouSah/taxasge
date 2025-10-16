/**
 * TaxasGE Mobile - Database Manager
 * Gestionnaire centralisé pour toutes les opérations SQLite
 */

import SQLite, { SQLiteDatabase, ResultSet, Transaction } from 'react-native-sqlite-storage';
import { DATABASE_NAME, DATABASE_VERSION, SCHEMA_PARTS, QUERIES, TABLE_NAMES } from './schema';

// Enable debug mode in development
SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

type TransactionCallback = (tx: Transaction) => Promise<any>;

class DatabaseManager {
  private db: SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize database
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initDatabase();
    return this.initPromise;
  }

  private async _initDatabase(): Promise<void> {
    try {
      console.log('[DB] Opening database:', DATABASE_NAME);

      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      console.log('[DB] Database opened successfully');

      // Execute schema parts sequentially to avoid SQLite limitations
      console.log('[DB] Executing schema in parts...');
      const parts = Object.entries(SCHEMA_PARTS);
      for (const [partName, partSQL] of parts) {
        console.log(`[DB] Executing schema part: ${partName}`);
        await this.executeSQL(partSQL);
      }

      console.log('[DB] Schema created successfully');

      // Verify version
      const version = await this.getMetadata('database_version');
      console.log('[DB] Database version:', version);

      console.log('[DB] Initialization complete');
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get database instance (ensures initialized)
   */
  private async getDB(): Promise<SQLiteDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Execute raw SQL
   */
  async executeSQL(sql: string, params: any[] = []): Promise<ResultSet[]> {
    const db = await this.getDB();
    const results: ResultSet[] = [];

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx: Transaction) => {
          // Split multiple statements
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          statements.forEach(statement => {
            tx.executeSql(
              statement,
              params,
              (_: Transaction, result: ResultSet) => {
                results.push(result);
              },
              (_: Transaction, error: any) => {
                console.error('[DB] SQL Error:', error, 'Statement:', statement);
                reject(error);
                return false;
              }
            );
          });
        },
        reject,
        () => resolve(results)
      );
    });
  }

  /**
   * Execute SELECT query
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      db.transaction((tx: Transaction) => {
        tx.executeSql(
          sql,
          params,
          (_: Transaction, result: ResultSet) => {
            const rows: T[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              rows.push(result.rows.item(i));
            }
            resolve(rows);
          },
          (_: Transaction, error: any) => {
            console.error('[DB] Query error:', error, 'SQL:', sql);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Execute INSERT/UPDATE/DELETE
   */
  async execute(sql: string, params: any[] = []): Promise<ResultSet> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      db.transaction((tx: Transaction) => {
        tx.executeSql(
          sql,
          params,
          (_: Transaction, result: ResultSet) => resolve(result),
          (_: Transaction, error: any) => {
            console.error('[DB] Execute error:', error, 'SQL:', sql);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Execute transaction with multiple operations
   */
  async transaction(callback: TransactionCallback): Promise<any> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      db.transaction(async (tx: Transaction) => {
        try {
          const result = await callback(tx);
          resolve(result);
        } catch (error) {
          console.error('[DB] Transaction error:', error);
          reject(error);
        }
      }, reject);
    });
  }

  /**
   * Insert single row
   */
  async insert(table: string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);

    return result.insertId || 0;
  }

  /**
   * Insert multiple rows (batch)
   */
  async insertBatch(table: string, items: Record<string, any>[]): Promise<void> {
    if (items.length === 0) return;

    console.log(`[DB] insertBatch: Starting batch insert of ${items.length} items into ${table}`);

    const keys = Object.keys(items[0]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    let insertCount = 0;
    try {
      await this.transaction(async (tx: Transaction) => {
        for (const item of items) {
          const values = keys.map(key => item[key]);
          await new Promise((resolve, reject) => {
            tx.executeSql(sql, values, () => {
              insertCount++;
              resolve(true);
            }, (_: Transaction, error: any) => {
              console.error(`[DB] Insert error for ${table}:`, error);
              console.error(`[DB] Failed item:`, JSON.stringify(item).substring(0, 200));
              reject(error);
              return false;
            });
          });
        }
      });
      console.log(`[DB] Successfully inserted ${insertCount} rows into ${table}`);
    } catch (error) {
      console.error(`[DB] insertBatch failed after ${insertCount} inserts:`, error);
      throw error;
    }
  }

  /**
   * Update rows
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = []
  ): Promise<number> {
    const sets = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${table} SET ${sets} WHERE ${where}`;
    const result = await this.execute(sql, values);

    return result.rowsAffected || 0;
  }

  /**
   * Delete rows
   */
  async delete(table: string, where: string, whereParams: any[] = []): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.execute(sql, whereParams);

    return result.rowsAffected || 0;
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<string | null> {
    const results = await this.query<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      [key]
    );
    return results[0]?.value || null;
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: string): Promise<void> {
    await this.execute(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))`,
      [key, value]
    );
  }

  /**
   * Clear all data (reset database)
   */
  async clearAllData(): Promise<void> {
    const tables = [
      TABLE_NAMES.FISCAL_SERVICES,
      TABLE_NAMES.CATEGORIES,
      TABLE_NAMES.SECTORS,
      TABLE_NAMES.MINISTRIES,
      TABLE_NAMES.USER_FAVORITES,
      TABLE_NAMES.CALCULATION_HISTORY,          // FIXED: was CALCULATIONS_HISTORY
      TABLE_NAMES.SERVICE_DOCUMENT_ASSIGNMENTS, // FIXED: was REQUIRED_DOCUMENTS
      TABLE_NAMES.SYNC_QUEUE,
      TABLE_NAMES.SEARCH_CACHE,
    ];

    await this.transaction(async (tx: Transaction) => {
      for (const table of tables) {
        await new Promise((resolve, reject) => {
          tx.executeSql(`DELETE FROM ${table}`, [], resolve, (_: Transaction, error: any) => {
            reject(error);
            return false;
          });
        });
      }
    });

    console.log('[DB] All data cleared');
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    const tables = [
      TABLE_NAMES.FISCAL_SERVICES,
      TABLE_NAMES.MINISTRIES,
      TABLE_NAMES.CATEGORIES,
      TABLE_NAMES.USER_FAVORITES,
      TABLE_NAMES.CALCULATION_HISTORY, // FIXED: was CALCULATIONS_HISTORY
    ];

    const stats: Record<string, number> = {};

    for (const table of tables) {
      const result = await this.query<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result[0]?.count || 0;
    }

    return stats;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[DB] Database closed');
    }
  }

  /**
   * Delete database file
   */
  async deleteDatabase(): Promise<void> {
    await this.close();
    await SQLite.deleteDatabase({ name: DATABASE_NAME, location: 'default' });
    console.log('[DB] Database deleted');
  }
}

// Export singleton instance
export const db = new DatabaseManager();

// Export for testing
export { DatabaseManager };
