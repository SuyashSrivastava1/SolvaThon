import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export function getDatabaseConfig(): { connectionString: string; isHyperdrive: boolean } {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cfCtx = getCloudflareContext();
    if (cfCtx?.env?.HYPERDRIVE?.connectionString) {
      return {
        connectionString: cleanDatabaseUrl(cfCtx.env.HYPERDRIVE.connectionString),
        isHyperdrive: true,
      };
    }
    if (cfCtx?.env?.DATABASE_URL) {
      process.env.DATABASE_URL = cfCtx.env.DATABASE_URL as string;
      return {
        connectionString: cleanDatabaseUrl(cfCtx.env.DATABASE_URL as string),
        isHyperdrive: false,
      };
    }
    if (cfCtx?.env?.DIRECT_URL) {
      process.env.DIRECT_URL = cfCtx.env.DIRECT_URL as string;
      return {
        connectionString: cleanDatabaseUrl(cfCtx.env.DIRECT_URL as string),
        isHyperdrive: false,
      };
    }
  } catch (e) {
    // getCloudflareContext is not available outside cloudflare worker request
  }

  const fallback = process.env.DATABASE_URL || process.env.DIRECT_URL || "";
  return {
    connectionString: cleanDatabaseUrl(fallback),
    isHyperdrive: false,
  };
}

export function getDatabaseUrl(): string {
  return getDatabaseConfig().connectionString;
}

function cleanDatabaseUrl(url: string): string {
  if (!url) return "";
  // Strip any sslmode parameter so pg-connection-string does not force rejectUnauthorized: true.
  return url.replace(/[?&]sslmode=[^&]+/g, "").replace(/\?$/, "");
}

function createPrismaClientFor(connectionString: string, isHyperdrive: boolean): PrismaClient {
  if (!connectionString) {
    console.error('DATABASE_URL or HYPERDRIVE not found in runtime environment.');
  }

  const pool = new Pool({
    connectionString: connectionString || undefined,
    // Hyperdrive connects locally over Cloudflare internal network and terminates SSL itself.
    // Setting ssl: false prevents pg from requesting SSL from Hyperdrive.
    ssl: isHyperdrive ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
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

let cachedClient: PrismaClient | null = null;
let cachedKey: string = '';

export function getPrismaClient(): PrismaClient {
  const { connectionString, isHyperdrive } = getDatabaseConfig();
  const currentKey = `${isHyperdrive ? 'hd:' : 'direct:'}${connectionString}`;

  if (cachedClient && cachedKey === currentKey) {
    return cachedClient;
  }

  const client = createPrismaClientFor(connectionString, isHyperdrive);
  cachedClient = client;
  cachedKey = currentKey;
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
