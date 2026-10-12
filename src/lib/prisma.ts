import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export function getDatabaseUrl(): string {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cfCtx = getCloudflareContext();
    if (cfCtx?.env?.HYPERDRIVE?.connectionString) {
      console.log('✓ Using Cloudflare Hyperdrive connection');
      return cfCtx.env.HYPERDRIVE.connectionString;
    }
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

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;

  return "";
}

function cleanDatabaseUrl(url: string): string {
  if (!url) return "";
  // Strip any sslmode parameter so pg-connection-string does not force rejectUnauthorized: true.
  // SSL is enforced via the Pool config with rejectUnauthorized: false.
  return url.replace(/[?&]sslmode=[^&]+/g, "").replace(/\?$/, "");
}

function createPrismaClient(): PrismaClient {
  const rawUrl = getDatabaseUrl();
  const connectionString = cleanDatabaseUrl(rawUrl);

  if (!connectionString) {
    console.error('DATABASE_URL or DIRECT_URL not found in runtime environment.');
  }

  const pool = new Pool({
    connectionString: connectionString || undefined,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 1000,
  });

  pool.on('error', (err) => {
    console.warn('Prisma pg pool client error:', err?.message || err);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ['error', 'warn']
  });
}

export function getPrismaClient(): PrismaClient {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }
  const client = createPrismaClient();
  globalThis.prismaGlobal = client;
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
