import { Status } from '@my-calibre-server/api-interfaces';
import { Injectable, Logger } from '@nestjs/common';
import { CacheKey, CacheService } from '../cache/cache.service';
import { CalibreDb1Service } from '../database/calibre-db1.service';
import { MyCalibreDbService } from '../database/my-calibre-db.service';

@Injectable()
export class HealthService {
  readonly logger = new Logger(HealthService.name);

  // Cache pour éviter de surcharger le système
  private healthCache: { status: Status; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 secondes
  private readonly CHECK_TIMEOUT = 5000; // 5 secondes max par vérification

  constructor(private _cacheService: CacheService, private _calibreDb: CalibreDb1Service, private _myCalibreDb: MyCalibreDbService) {}

  /**
   * Wraps a promise with a timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(defaultValue), timeoutMs);
    });
    // Clear the timer as soon as the check answers (it would otherwise stay armed for timeoutMs)
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async getHealthSattus(): Promise<Status> {
    const startTime = Date.now();

    try {
      // Vérifier le cache
      const now = Date.now();
      if (this.healthCache && now - this.healthCache.timestamp < this.CACHE_TTL) {
        this.logger.debug(`Health check returned from cache (${now - this.healthCache.timestamp}ms old)`);
        return this.healthCache.status;
      }

      // Effectuer les vérifications essentielles avec timeout
      // On vérifie uniquement l'accès à la DB et l'existence du cache principal
      const results = await Promise.allSettled([
        this.withTimeout(this._calibreDb.getDbDate(), this.CHECK_TIMEOUT, null),
        // Suppression de COUNT qui fait une requête SQL gourmande
        // this.withTimeout(this._cacheService.getCacheNumber(CacheKey.COUNT), this.CHECK_TIMEOUT, 0),
        this.withTimeout(this._cacheService.getCacheDate(CacheKey.BOOKS), this.CHECK_TIMEOUT, null),
        // On simplifie en ne vérifiant que BOOKS au lieu de tous les caches
        // this.withTimeout(this._cacheService.getCacheDate(CacheKey.NEW_BOOKS), this.CHECK_TIMEOUT, null),
        // this.withTimeout(this._cacheService.getCacheDate(CacheKey.SERIES), this.CHECK_TIMEOUT, null),
        // this.withTimeout(this._cacheService.getCacheDate(CacheKey.AUTHORS), this.CHECK_TIMEOUT, null),
        // this.withTimeout(this._cacheService.getCacheDate(CacheKey.TAGS), this.CHECK_TIMEOUT, null),
      ]);

      const ret = new Status();
      // Mongo only holds the users: report it without failing the whole check
      ret.mongoStatus = this._myCalibreDb.getConnectionStatus();
      results.forEach((r, index) => {
        this.logger.debug(JSON.stringify(r));
        if (r.status === 'fulfilled' && r.value !== null) {
          switch (index) {
            case 0:
              ret.calibreDate = r.value as Date;
              break;
            case 1:
              ret.cacheBooks = r.value as Date;
              break;
          }
        } else {
          switch (index) {
            case 0:
              if (r.status === 'rejected') {
                ret.calibreStatus = `KO : ${r.reason}`;
              } else if (r.value === null) {
                ret.calibreStatus = 'KO : Timeout or unavailable';
              }
              break;
            case 1:
              if (r.status === 'rejected') {
                ret.cacheStatus = `KO : ${r.reason}`;
              } else if (r.value === null) {
                ret.cacheStatus = 'KO : Timeout or unavailable';
              }
              break;
          }
        }
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Health check completed in ${duration}ms`);

      // Mettre en cache le résultat
      this.healthCache = {
        status: ret,
        timestamp: Date.now(),
      };

      return ret;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Health check failed after ${duration}ms`, error);
      throw error;
    }
  }
}
