/**
 * TaxasGE Mobile - Data Cache Service
 * Global cache service for preloading and storing frequently accessed data
 * Reduces latency by caching service details, ministries, and categories
 * Date: 2025-11-18
 */

import { DatabaseService } from '../database/DatabaseService';
import { FiscalService, Ministry } from '../database/services/FiscalServicesService';
import { ServiceCompleteDetails, serviceDetailsService } from '../database/services/ServiceDetailsService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class DataCacheService {
  private serviceDetailsCache: Map<string, CacheEntry<ServiceCompleteDetails>> = new Map();
  private ministriesCache: CacheEntry<Ministry[]> | null = null;
  private popularServicesCache: CacheEntry<FiscalService[]> | null = null;
  private isPreloading = false;
  private preloadComplete = false;

  // Cache durations
  private readonly SERVICE_DETAILS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MINISTRIES_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly POPULAR_SERVICES_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Preload essential data at app startup
   * Loads ministries and popular services in parallel
   */
  async preloadEssentialData(): Promise<void> {
    if (this.isPreloading || this.preloadComplete) {
      console.log('[DataCache] Preload already in progress or completed');
      return;
    }

    this.isPreloading = true;
    const startTime = Date.now();

    try {
      console.log('[DataCache] 🚀 Starting essential data preload...');
      const db = DatabaseService.getInstance();

      // Load ministries and popular services in parallel
      const [ministries, popularServices] = await Promise.all([
        db.query<Ministry>(
          `SELECT
            m.id,
            m.name_es,
            m.name_fr,
            m.name_en,
            m.description_es,
            m.description_fr,
            m.description_en,
            m.contact_email,
            m.website_url,
            m.address_es,
            m.address_fr,
            m.address_en,
            COUNT(DISTINCT fs.id) as service_count
          FROM ministries m
          LEFT JOIN fiscal_services fs ON fs.ministry_id = m.id AND fs.status = 'active'
          WHERE m.status = 'active'
          GROUP BY m.id
          ORDER BY service_count DESC`,
          []
        ),
        db.query<FiscalService>(
          `SELECT * FROM v_fiscal_services_complete
           WHERE status = 'active'
           ORDER BY view_count DESC, favorite_count DESC
           LIMIT 20`,
          []
        ),
      ]);

      // Cache the results
      this.ministriesCache = {
        data: ministries,
        timestamp: Date.now(),
        expiresIn: this.MINISTRIES_CACHE_DURATION,
      };

      this.popularServicesCache = {
        data: popularServices,
        timestamp: Date.now(),
        expiresIn: this.POPULAR_SERVICES_CACHE_DURATION,
      };

      // Preload details for top 5 most popular services in background
      this.preloadTopServiceDetails(popularServices.slice(0, 5));

      this.preloadComplete = true;
      console.log(`[DataCache] ✅ Preload complete in ${Date.now() - startTime}ms`);
      console.log(`[DataCache] Cached ${ministries.length} ministries, ${popularServices.length} popular services`);
    } catch (error) {
      console.error('[DataCache] Error during preload:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload service details for top services in background
   */
  private async preloadTopServiceDetails(services: FiscalService[]): Promise<void> {
    console.log(`[DataCache] 📥 Preloading details for ${services.length} top services...`);

    // Load all service details in parallel
    const promises = services.map(service =>
      this.getServiceDetails(service.id).catch(err => {
        console.warn(`[DataCache] Failed to preload service ${service.id}:`, err);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('[DataCache] ✅ Top services details preloaded');
  }

  /**
   * Get service details from cache or load from database
   */
  async getServiceDetails(serviceId: string): Promise<ServiceCompleteDetails> {
    // Check if cached and not expired
    const cached = this.serviceDetailsCache.get(serviceId);
    if (cached && !this.isCacheExpired(cached)) {
      console.log(`[DataCache] ⚡ Service details cache HIT for ${serviceId}`);
      return cached.data;
    }

    console.log(`[DataCache] 💾 Service details cache MISS for ${serviceId}, loading...`);

    // Load from database
    const details = await serviceDetailsService.getCompleteDetails(serviceId);

    // Cache the results
    this.serviceDetailsCache.set(serviceId, {
      data: details,
      timestamp: Date.now(),
      expiresIn: this.SERVICE_DETAILS_CACHE_DURATION,
    });

    return details;
  }

  /**
   * Get ministries from cache or load from database
   */
  async getMinistries(): Promise<Ministry[]> {
    // Check if cached and not expired
    if (this.ministriesCache && !this.isCacheExpired(this.ministriesCache)) {
      console.log('[DataCache] ⚡ Ministries cache HIT');
      return this.ministriesCache.data;
    }

    console.log('[DataCache] 💾 Ministries cache MISS, loading...');
    const db = DatabaseService.getInstance();

    const ministries = await db.query<Ministry>(
      `SELECT
        m.id,
        m.name_es,
        m.name_fr,
        m.name_en,
        COUNT(DISTINCT fs.id) as service_count
      FROM ministries m
      LEFT JOIN fiscal_services fs ON fs.ministry_id = m.id AND fs.status = 'active'
      WHERE m.status = 'active'
      GROUP BY m.id
      ORDER BY service_count DESC`,
      []
    );

    // Cache the results
    this.ministriesCache = {
      data: ministries,
      timestamp: Date.now(),
      expiresIn: this.MINISTRIES_CACHE_DURATION,
    };

    return ministries;
  }

  /**
   * Get popular services from cache or load from database
   */
  async getPopularServices(limit: number = 20): Promise<FiscalService[]> {
    // Check if cached and not expired
    if (this.popularServicesCache && !this.isCacheExpired(this.popularServicesCache)) {
      console.log('[DataCache] ⚡ Popular services cache HIT');
      return this.popularServicesCache.data.slice(0, limit);
    }

    console.log('[DataCache] 💾 Popular services cache MISS, loading...');
    const db = DatabaseService.getInstance();

    const services = await db.query<FiscalService>(
      `SELECT * FROM v_fiscal_services_complete
       WHERE status = 'active'
       ORDER BY view_count DESC, favorite_count DESC
       LIMIT ?`,
      [limit]
    );

    // Cache the results
    this.popularServicesCache = {
      data: services,
      timestamp: Date.now(),
      expiresIn: this.POPULAR_SERVICES_CACHE_DURATION,
    };

    return services;
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.expiresIn;
  }

  /**
   * Invalidate service details cache for a specific service
   */
  invalidateServiceDetails(serviceId: string): void {
    this.serviceDetailsCache.delete(serviceId);
    console.log(`[DataCache] Invalidated cache for service ${serviceId}`);
  }

  /**
   * Invalidate all ministries cache
   */
  invalidateMinistries(): void {
    this.ministriesCache = null;
    console.log('[DataCache] Invalidated ministries cache');
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.serviceDetailsCache.clear();
    this.ministriesCache = null;
    this.popularServicesCache = null;
    this.preloadComplete = false;
    console.log('[DataCache] All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    serviceDetailsCount: number;
    hasMinistries: boolean;
    hasPopularServices: boolean;
    preloadComplete: boolean;
  } {
    return {
      serviceDetailsCount: this.serviceDetailsCache.size,
      hasMinistries: this.ministriesCache !== null,
      hasPopularServices: this.popularServicesCache !== null,
      preloadComplete: this.preloadComplete,
    };
  }
}

// Export singleton instance
export const dataCacheService = new DataCacheService();
export default dataCacheService;
