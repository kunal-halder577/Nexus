import Redis from "ioredis";
import { redisUrl } from "../constants.js";

const redisOptions = {
  // 1. Reconnection Strategy: Exponential backoff
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // 2. Clear conflict: Allow ioredis to buffer commands while reconnecting
  maxRetriesPerRequest: null,
  
  // 3. Timeouts: Don't wait forever to connect
  connectTimeout: 10000, 
  
  // 4. Keep-Alive: Prevent idle connection drops from load balancers
  keepAlive: 10000,

  autoResendUnfulfilledCommands: true,

  // 5. Secure TLS Configuration for production cloud instances
  ...(redisUrl?.startsWith('rediss://') ? {
    tls: {
      rejectUnauthorized: true, 
    }
  } : {})
};

const redis = new Redis(redisUrl || "redis://redis:6379", redisOptions);

// ─── Lifecycle Event Listeners ───────────────────────────────────────────────

redis.on('connect', () => {
  console.log('🔗 Redis connection established');
});

redis.on('ready', () => {
  console.log('✅ Redis is ready to receive commands');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('close', () => {
  console.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redis.on('end', () => {
  console.log('🛑 Redis connection ended permanently');
});

// Production-ready Graceful Shutdown
const handleShutdown = (signal) => {
  redis.quit().then(() => {
    console.log(`Redis client disconnected through app termination (${signal})`);
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default redis;