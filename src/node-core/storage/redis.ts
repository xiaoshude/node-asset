import { defaultLocalCache } from './cache';
import * as Redis from 'ioredis';
import * as IORedis from 'ioredis';
import { REDIS_DB_HOST, REDIS_DB_PORT, REDIS_DB_PWD } from '../config/env';
const localCacheExp = 3 * 60; // s
/**
 * 调用该函数，获取一个 redis client。
 * 通常一个应用，使用一个单例的 client 即可，
 * 建议用法：直接挂载 koa app 上。
 *
app.context.redis = redis();
app.context.close = async () => {
  app.context.redis.disconnect();
};
这样，每个请求生成的 context，都继承这个 context，都能访问到这个单例
 *
 * @returns
 */
export const redis = () => {
  // 这里为了类型没有问题，做个强转类型，但是如果用了 redis 而没有提供环境变量
  // 依然会运行时报错
  if (!REDIS_DB_HOST) return {} as unknown as IORedis.Redis;

  const connectUrl = `redis://:${REDIS_DB_PWD}@${REDIS_DB_HOST}:${REDIS_DB_PORT}/4`;

  return new Redis(connectUrl);
};

export const defaultRedisClient = redis();

// 这里不能使用 lodash 的 throttle，因为他不会因为参数的不同，执行延迟调用
export const getWithCache = async (key: string) => {
  const localCacheKey = `_redis_key_${key}`;
  if (defaultLocalCache.exists(localCacheKey)) return defaultLocalCache.get(localCacheKey);

  const result = await defaultRedisClient.get(key);
  defaultLocalCache.setex(localCacheKey, localCacheExp, result);

  return result;
};

const defaultExpiredSeconds = 7 * 24 * 60 * 60;
export const setWithCache = async (key: string, value: string | number, seconds = defaultExpiredSeconds) => {
  // 要设置失效，防止 redis 内存撑爆
  await defaultRedisClient.setex(key, seconds, value);
  const localCacheKey = `_redis_key_${key}`;
  defaultLocalCache.setex(localCacheKey, localCacheExp, value);
};


