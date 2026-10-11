import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;

  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cfCtx = getCloudflareContext();
    if (cfCtx?.env?.DATABASE_URL) {
      process.env.DATABASE_URL = cfCtx.env.DATABASE_URL as string;
      return cfCtx.env.DATABASE_URL as string;
    }
    if (cfCtx?.env?.DIRECT_URL) {
      process.env.DIRECT_URL = cfCtx.env.DIRECT_URL as string;
      return cfCtx.env.DIRECT_URL as string;
    }
  } catch (e) {
    // getCloudflareContext is not available outside cloudflare worker request
  }

  return "";
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();

  if (connectionString) {
    try {
      const pool = globalThis.pgPoolGlobal ?? new Pool({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      });

      if (process.env.NODE_ENV !== 'production') {
        globalThis.pgPoolGlobal = pool;
      }

      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('Failed to initialize PrismaPg adapter, falling back to standard PrismaClient:', e);
    }
  }

  return new PrismaClient();
}

let cachedPrisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (globalThis.prismaGlobal) return globalThis.prismaGlobal;
  if (cachedPrisma) return cachedPrisma;

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = client;
  } else {
    cachedPrisma = client;
  }
  return client;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default prisma;
