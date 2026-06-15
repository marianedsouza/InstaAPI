import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redis from 'redis';

@Injectable()
export class CacheService {
  private client: redis.RedisClient;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
      this.client = redis.createClient({
        url: redisUrl,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}
