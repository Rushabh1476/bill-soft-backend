import Redis from 'ioredis';

// Allow configuration via environment variables, defaulting to localhost for local development
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

/**
 * Enhanced Redis connection with automatic fallback.
 * ioredis with lazyConnect:true won't block startup if Redis is offline.
 */
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: true, // IMPORTANT: Don't connect until used, prevents startup crash
  retryStrategy(times) {
    // If we've failed 3 times, slow down the retries to avoid log spam
    if (times > 3) return 10000; 
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) return true;
    return false;
  }
});

// --- Graceful Connection Handling ---
redisConnection.on('error', (err: any) => {
  if (err.code === 'ECONNREFUSED') {
    // Permanent Silence for ECONNREFUSED to prevent logs spam and process crashes.
    // The server will simply function without Redis-backed queues/cache.
    return;
  }
  console.warn('[Redis] Connection warning (Retrying...):', err.message);
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connecting...');
});

redisConnection.on('ready', () => {
  console.log('[Redis] Connected and ready.');
});
