/**
 * Teacher Timetable Extraction System
 * 
 * @author Saleem Ahmad
 * @email saleem.ahmad@rediffmail.com
 * @created October 2025
 * 
 * @license MIT License (Non-Commercial Use Only)
 * 
 * Copyright (c) 2025 Saleem Ahmad
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to use
 * the Software for educational, learning, and personal purposes only, subject
 * to the following conditions:
 * 
 * 1. The above copyright notice and this permission notice shall be included in
 *    all copies or substantial portions of the Software.
 * 
 * 2. COMMERCIAL USE RESTRICTION: The Software may NOT be used for commercial
 *    purposes, including but not limited to selling, licensing, or incorporating
 *    into commercial products or services, without explicit written permission
 *    from the author.
 * 
 * 3. LEARNING YOGI ASSIGNMENT: This Software was created specifically for the
 *    Learning Yogi (LY) assignment purpose and should be used as a reference
 *    or learning material only.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * For commercial use inquiries, please contact: saleem.ahmad@rediffmail.com
 */


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
