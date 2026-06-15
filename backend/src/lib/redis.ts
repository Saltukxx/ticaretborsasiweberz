import { Redis } from "ioredis";

export type RedisClient = Redis;

export async function connectRedis(url: string): Promise<RedisClient> {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  await client.ping();
  return client;
}
