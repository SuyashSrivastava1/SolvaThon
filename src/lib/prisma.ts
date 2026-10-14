import { cache } from 'react';
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
  // Strip sslmode and pgbouncer parameters to prevent connection rejections and pooling conflicts
  return url
    .replace(/[?&](sslmode|pgbouncer)=[^&]+/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
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
    // With Hyperdrive, edge pooling is handled by Cloudflare. 1 connection per request
    // prevents pooling stale, dead TCP sockets across worker requests.
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000,
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

// React cache() scopes the client per request in Server Components and Server Actions.
// This prevents TCP socket reuse across different Cloudflare Worker requests.
export const getPrismaClient = cache((): PrismaClient => {
  const { connectionString, isHyperdrive } = getDatabaseConfig();
  return createPrismaClientFor(connectionString, isHyperdrive);
});

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default prisma;

