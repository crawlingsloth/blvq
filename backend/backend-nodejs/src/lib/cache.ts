import { db } from './database.js';

export class PostgresCache {
  async get<T = any>(key: string): Promise<T | null> {
    const value = await db.getCacheValue(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await db.setCacheValue(key, serialized, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await db.deleteCacheValue(key);
  }

  async clear(): Promise<void> {
    // Clean up all expired entries
    await db.cleanExpiredCache();
  }
}

export const cache = new PostgresCache();
