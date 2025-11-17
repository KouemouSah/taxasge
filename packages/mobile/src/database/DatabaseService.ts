/**
 * TaxasGE Mobile - Database Service
 * Re-export of DatabaseManager for consistency across the codebase
 *
 * This file exists to maintain compatibility with imports that expect
 * DatabaseService instead of DatabaseManager.
 */

import { DatabaseManager, db } from './DatabaseManager';

// Export class with getInstance pattern
export class DatabaseService {
  static getInstance() {
    return db;
  }
}

// Export singleton instance
export { db };

// Export DatabaseManager for compatibility
export { DatabaseManager };

// Default export
export default db;
