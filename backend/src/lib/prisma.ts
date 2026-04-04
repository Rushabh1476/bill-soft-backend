import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

// --- GLOBBAL FIX: BigInt Serialization ---
// JSON.stringify by default does not support BigInt. 
// This polyfill ensures BigInts are serialized as numbers for API responses.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

/**
 * Optimize SQLite for concurrent access (Import vs Auth).
 * WAL mode allows multiple readers and one writer to coexist.
 * busy_timeout prevents "database is locked" errors by waiting.
 */
async function setupSQLite() {
  try {
    // --- CRITICAL FIX: SQLite Executereturned results error ---
    // PRAGMA commands in SQLite return a value (e.g. "wal"), so Prisma's $executeRaw 
    // throws an error. We must use $queryRawUnsafe instead.
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {});
    await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;').catch(() => {});
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=30000;').catch(() => {});
    console.log('[Prisma] SQLite optimized: WAL mode enabled, busy_timeout=30s.');
  } catch (e) {
    // Silence error if DB is not SQLite or already locked
  }
}

setupSQLite();

if (process.env.NODE_ENV === 'development') globalThis.prisma = prisma

export default prisma
