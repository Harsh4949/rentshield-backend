import Redis from 'ioredis';
import { config } from './index';

let redisInstance: any;

if (config.redis.enabled) {
  redisInstance = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
  });

  redisInstance.on('error', (err: any) => {
    console.warn(`[Redis] Connection warning: ${err.message}`);
  });
} else {
  console.log('[Redis] Redis is disabled by configuration.');
  // Mock Redis to prevent app crashes when it's disabled
  redisInstance = new Proxy({}, {
    get: (_target, prop) => {
      // Event emitter 'on' method
      if (prop === 'on' || prop === 'once') {
        return () => redisInstance;
      }
      // Quit/disconnect
      if (prop === 'quit' || prop === 'disconnect') {
        return () => Promise.resolve();
      }
      // Status property
      if (prop === 'status') {
        return 'ready';
      }
      // All other methods return a resolved promise
      return (...args: any[]) => {
        // Handle specific return types for common methods if needed
        if (prop === 'keys') return Promise.resolve([]);
        if (prop === 'get') return Promise.resolve(null);
        if (prop === 'exists') return Promise.resolve(0);
        return Promise.resolve(true);
      };
    }
  });
}

export const redis = redisInstance;

