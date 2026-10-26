import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";
import { PrismaClient } from "@/generated/prisma/client";

// The MariaDB driver ignores MySQL's `ssl-mode` URL option (used by hosted MySQL such as Aiven)
// and would connect without TLS, which those servers reject. Translate it into driver SSL options.
// Set DATABASE_CA_CERT to the provider's CA certificate (PEM) to verify the server.
function connectionConfig(url: string): PoolConfig | string {
  const parsed = new URL(url);
  const sslMode = (parsed.searchParams.get("ssl-mode") ?? "").toUpperCase();
  if (!sslMode || sslMode === "DISABLED") return url;
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  return {
    host: decodeURIComponent(parsed.hostname),
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.slice(1)),
    ssl: ca ? { ca } : { rejectUnauthorized: sslMode.startsWith("VERIFY") },
  };
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  return new PrismaClient({ adapter: new PrismaMariaDb(connectionConfig(url)) });
}

// Reuse one client (and its connection pool) across hot reloads in development.
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
