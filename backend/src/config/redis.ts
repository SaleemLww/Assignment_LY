import Redis from 'ioredis';
import { config } from './env';

// Redis client configuration
const redisConfig = {
  host: config.env.REDIS_HOST,
  port: config.env.REDIS_PORT,
  password: config.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Redis connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis: Connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Ready to accept commands');
});

redisClient.on('error', (err: Error) => {
  console.error('❌ Redis Error:', err.message);
});

redisClient.on('close', () => {
  console.log('⚠️  Redis: Connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

// Graceful shutdown
export const closeRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log('✅ Redis: Connection closed gracefully');
  } catch (error) {
    console.error('❌ Redis: Error closing connection:', error);
    redisClient.disconnect();
  }
};

// Health check function
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return false;
  }
};

export default redisClient;
