import type { Config } from "../config.js";
import type { Database } from "../db/connection.js";
import type { RedisClient } from "../lib/redis.js";
import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    config: Config;
    db: Database;
    redis: RedisClient | null;
  }

  interface FastifyRequest {
    adminAuth?: AccessTokenPayload;
  }
}
