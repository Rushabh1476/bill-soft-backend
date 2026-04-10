import { Worker, Job } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { PrismaClient } from '@prisma/client';
import { recordAuditLog } from '../lib/auditLog';
import { importQueueName } from '../lib/importQueue';
import fs from 'fs';
import readline from 'readline';
import { PRODUCT_CATEGORIES as VALID_CATEGORIES } from '../routes/constants/categories';

/**
 * Dedicated Prisma client for import operations.
 * SQLite uses a single-writer model; sharing the same Prisma instance between
 * long-running bulk inserts and auth queries (login, session create, etc.) can
 * cause write-lock contention, making login fail with "Invalid credentials"
 * when a bulk import is in progress or was recently cancelled.
 *
 * By using a separate client, import writes and auth writes go through
 * independent connection pools and don't block each other.
 */
const importPrisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function setupImportPrisma() {
  try {
    // --- CRITICAL FIX: SQLite Executereturned results error ---
    await importPrisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {});
    await importPrisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {});
  } catch (e) {}
}
setupImportPrisma();

/**
 * Count lines in a file quickly using readline (no full parse needed).
 */
async function countFileLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
    rl.on('line', () => count++);
    rl.on('close', () => resolve(Math.max(0, count - 1))); // subtract header row
    rl.on('error', reject);
  });
}

/**
 * Parse a CSV line respecting quoted commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Streaming file import — supports 1 to 60,000+ products.
 * Uses readline for non-blocking line-by-line parsing.
 * Updates DB progress every BATCH_SIZE rows for smooth frontend progress.
 */
export async function processFileImport(
  jobId: string,
  filePath: string,
  userId: string,
  actorId?: string,
  jobEmit?: (p: any) => Promise<void>
) {
  console.log(`[Import] Starting streaming high-speed import for Job: ${jobId}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Volatile cancellation flag — checked before every batch flush
  let isCancelled = false;

  // 1. Quick line count for baseline
  const totalRows = await countFileLines(filePath);
  
  await (importPrisma as any).importJob.update({
    where: { id: jobId },
    data: { status: 'running', totalProducts: totalRows, processedProducts: 0, failedProducts: 0 },
  });

  // 2. High-speed batch configuration
  // BATCH_SIZE of 1000 is optimal for SQLite and memory.
  const BATCH_SIZE = 1000;
  let processedCount = 0;
  let failedCount = 0;
  let batch: any[] = [];
  let headers: string[] = [];
  let isFirstLine = true;
  let errorLogs: string[] = [];

  const col = (candidates: string[]): number => {
    return headers.findIndex(h => candidates.some(c => h.toLowerCase().includes(c.toLowerCase())));
  };

  /**
   * Check if the job has been cancelled by the user.
   * Uses the dedicated importPrisma client to avoid blocking the main DB.
   */
  const checkCancelled = async (): Promise<boolean> => {
    try {
      const currentJob = await (importPrisma as any).importJob.findUnique({ where: { id: jobId } });
      if (currentJob?.status === 'cancelled') {
        isCancelled = true;
        return true;
      }
    } catch (e) {
      // If we can't check, assume not cancelled — don't break the import
    }
    return false;
  };

  const yieldLoop = () => new Promise(resolve => setImmediate(resolve));

  const flushBatch = async () => {
    if (batch.length === 0) return;

    // CANCELLATION GUARD
    if (await checkCancelled()) {
      batch = [];
      return;
    }
    
    try {
      /**
       * CRITICAL FIX: Sequential Small-Batching (Exactly 50)
       * Giant createMany calls lock the SQLite database and block the event loop,
       * leading to session timeouts/logouts. 
       */
      const CHUNK_SIZE = 50;
      for (let j = 0; j < batch.length; j += CHUNK_SIZE) {
        const subBatch = batch.slice(j, j + CHUNK_SIZE);
        
        // Single write operation with yielding
        await importPrisma.product.createMany({ data: subBatch });
        processedCount += subBatch.length;
        
        // Give the database and auth middleware breathing room
        await yieldLoop();
      }
    } catch (err: any) {
      console.warn(`[Import] Batch of ${batch.length} failed. Falling back to individual inserts...`);
      for (const item of batch) {
        if (isCancelled) break;
        try {
          await importPrisma.product.create({ data: item });
          processedCount++;
          await yieldLoop();
        } catch (singleErr: any) {
          failedCount++;
          if (errorLogs.length < 50) {
            errorLogs.push(`${item.name || 'Unknown'}: ${singleErr.message}`);
          }
        }
      }
    }

    batch = [];

    // Progress update every 100 items for stability
    if (processedCount % 100 === 0 || processedCount === totalRows) {
      await (importPrisma as any).importJob.update({
        where: { id: jobId },
        data: { 
          processedProducts: processedCount, 
          failedProducts: failedCount,
          errorLog: errorLogs.length > 0 ? JSON.stringify(errorLogs) : null
        },
      });

      const pct = totalRows > 0 ? Math.floor(((processedCount + failedCount) / totalRows) * 100) : 0;
      if (jobEmit) await jobEmit({ count: processedCount, failed: failedCount, total: totalRows, percentage: pct });
    }
  };

  // 3. Streaming read with non-blocking readline
  await new Promise<void>((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on('line', async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (isFirstLine) {
        headers = parseCSVLine(trimmed).map(h => h.replace(/^"|"$/g, '').trim());
        isFirstLine = false;
        return;
      }

      // If already cancelled, stop reading immediately
      if (isCancelled) {
        rl.close();
        return;
      }

      rl.pause(); // Pause stream while processing to ensure order and avoid overflow
      
      try {
        // CANCELLATION CHECK: Every 100 rows, check if user cancelled
        if ((processedCount + failedCount) % 100 === 0) {
          if (await checkCancelled()) {
            console.log(`[Import] Job ${jobId} cancelled by user. Stopping...`);
            rl.close();
            rl.resume(); // Ensure the stream can close cleanly
            return;
          }
        }

        const values = parseCSVLine(trimmed);
        const nameIdx  = col(['name']);
        const priceIdx = col(['price']);
        const stockIdx = col(['stock']);
        const descIdx  = col(['description', 'desc']);
        const taxIdx   = col(['taxRate', 'tax rate', 'tax']);
        const catIdx   = col(['category', 'cat']);
        const skuIdx   = col(['sku']);
        const minIdx   = col(['minStockLevel', 'min stock']);

        const name = nameIdx >= 0 ? (values[nameIdx] || '').replace(/^"|"$/g, '').trim() : '';
        
        if (name) {
          // Fix Excel Mapping: Prioritize exact value, trim, and fallback only if empty
          const rawCat = catIdx >= 0 ? (values[catIdx] || '').replace(/^"|"$/g, '').trim() : '';
          const finalCategory = rawCat || 'Uncategorized';

          batch.push({
            userId,
            name,
            description:   descIdx >= 0  ? (values[descIdx] || null)              : null,
            price:         priceIdx >= 0  ? (parseFloat(values[priceIdx]) || 0)    : 0,
            stock:         stockIdx >= 0  ? (parseInt(values[stockIdx], 10) || 0)  : 0,
            taxRate:       taxIdx >= 0    ? (parseFloat(values[taxIdx]) || 0)      : 0,
            category:      finalCategory,
            sku:           skuIdx >= 0    ? (values[skuIdx] || null)               : null,
            minStockLevel: minIdx >= 0    ? (parseInt(values[minIdx], 10) || 0)    : 0,
          });
        }

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      } catch (err) {
        console.error('[Import] Line parse error:', err);
      }
      
      rl.resume();
    });

    rl.on('close', async () => {
      try {
        // Only flush remaining batch if not cancelled
        if (!isCancelled) {
          await flushBatch();
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    rl.on('error', reject);
  });

  // 4. Final completion update
  if (!isCancelled) {
    // --- VERIFY & COMMIT: Data Integrity Check ---
    const actualCount = await importPrisma.product.count({ where: { userId } });
    const job = await (importPrisma as any).importJob.findUnique({ where: { id: jobId } });
    
    // We expect the final count to be at least the processedCount 
    // (Note: we use >= in case user already had products)
    const success = processedCount > 0; 
    const finalStatus = success ? 'completed' : 'failed';

    await (importPrisma as any).importJob.update({
      where: { id: jobId },
      data: { 
        status: finalStatus, 
        processedProducts: processedCount, 
        failedProducts: failedCount,
        totalProducts: totalRows,
        errorMessage: !success ? 'Verification failed: No data was saved to the database.' : null
      },
    });
  } else {
    // Update final counts for cancelled job without changing status
    await (importPrisma as any).importJob.update({
      where: { id: jobId },
      data: { 
        processedProducts: processedCount, 
        failedProducts: failedCount,
      },
    });
    console.log(`[Import] Job ${jobId} cancelled. ${processedCount} products were imported before cancellation.`);
  }

  // 5. Record Detailed Audit Log
  const isBulk = processedCount > 1;
  await recordAuditLog({
    userId,
    subUserId: actorId,
    action: isBulk ? 'BULK_CREATE' as any : 'CREATE',
    entity: 'Product',
    entityId: isBulk ? `bulk-${jobId}` : `single-${jobId}`,
    description: isCancelled
      ? `Bulk CREATE stopped: ${processedCount} products imported before cancellation.`
      : isBulk 
        ? `Bulk CREATE: ${processedCount} items processed` 
        : `CREATE: Item ${jobId} processed`,
    newData: {
      successCount: processedCount,
      failureCount: failedCount,
      totalRows: totalRows,
      jobId: jobId,
      isCancelled
    }
  });

  // Clean up uploaded file
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn(`[Import] Could not delete temp file ${filePath}:`, e);
  }
  return { success: !isCancelled, processed: processedCount, failed: failedCount };
}

/**
 * Array-based import (JSON payload). Used by /bulk route.
 */
export async function processProductImport(
  jobId: string,
  products: any[],
  userId: string,
  actorId?: string,
  jobEmit?: (p: any) => Promise<void>
) {
  console.log(`[Import] Starting JSON batch import for Job: ${jobId}, Total: ${products.length}`);
  
  let processedCount = 0;
  let failedCount = 0;
  let errorLogs: string[] = [];
  const CHUNK_SIZE = 50; 

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    
    // 1. Check if user cancelled before every tiny batch
    try {
      const currentJobStatus = await (importPrisma as any).importJob.findUnique({ where: { id: jobId }, select: { status: true } });
      if (currentJobStatus?.status === 'cancelled') {
        console.log(`[Import] JSON job ${jobId} stopped due to user cancellation.`);
        break;
      }
    } catch (e) { /* silent fail on check */ }

    // 2. Prepare data
    const data = chunk.map(p => {
      // Fix Excel Mapping: Prioritize exact value, trim, and fallback only if empty
      const rawCategory = p.category?.toString() || '';
      const finalCategory = rawCategory.trim() || 'Uncategorized';

      return {
        userId,
        name: (p.name || '').trim(),
        description: p.description || null,
        price: parseFloat(p.price) || 0,
        taxRate: parseFloat(p.taxRate) || 0,
        stock: parseInt(p.stock, 10) || 0,
        category: finalCategory,
        sku: p.sku || null,
        minStockLevel: parseInt(p.minStockLevel, 10) || 0,
      };
    }).filter(p => p.name);

    if (data.length === 0) continue;

    try {
      // 3. Sequential 50-item insert
      await importPrisma.product.createMany({ data });
      processedCount += data.length;
    } catch (err) {
      console.warn(`[Import] JSON chunk failed. Individual fallback for ${data.length} items...`);
      for (const item of data) {
        try {
          await importPrisma.product.create({ data: item });
          processedCount++;
        } catch (singleErr: any) {
          failedCount++;
          if (errorLogs.length < 50) errorLogs.push(`${item.name}: ${singleErr.message}`);
        }
      }
    }

    // 4. Yield to prevent event loop starvation (Auth middleware depends on this!)
    await new Promise(resolve => setImmediate(resolve));

    // 5. Update progress in DB/Socket
    const isLastBatch = i + CHUNK_SIZE >= products.length;
    if (processedCount % 50 === 0 || isLastBatch) {
      await (importPrisma as any).importJob.update({
        where: { id: jobId },
        data: { 
          processedProducts: processedCount, 
          failedProducts: failedCount,
          errorLog: errorLogs.length > 0 ? JSON.stringify(errorLogs) : null
        },
      });

      if (jobEmit) {
        const pct = Math.floor(((processedCount + failedCount) / products.length) * 100);
        await jobEmit({ 
          count: processedCount, 
          failed: failedCount, 
          total: products.length, 
          percentage: pct 
        });
      }
    }
  }

  // Check final status — don't overwrite 'cancelled' status
  const currentJob = await (importPrisma as any).importJob.findUnique({ where: { id: jobId } });
  const wasCancelled = currentJob?.status === 'cancelled';
  if (!wasCancelled) {
    const finalStatus = failedCount > 0 && processedCount === 0 ? 'failed' : 'completed';
    await (importPrisma as any).importJob.update({
      where: { id: jobId },
      data: { status: finalStatus, totalProducts: products.length, processedProducts: processedCount, failedProducts: failedCount },
    });
  }

  // Record Detailed Audit Log for JSON import
  const isBulkImport = processedCount > 1;
  await recordAuditLog({
    userId,
    subUserId: actorId,
    action: isBulkImport ? 'BULK_CREATE' as any : 'CREATE',
    entity: 'Product',
    entityId: isBulkImport ? `bulk-json-${jobId}` : `single-json-${jobId}`,
    description: isBulkImport 
      ? `Bulk CREATE: ${processedCount} items processed` 
      : `CREATE: Item ${jobId} processed`,
    newData: {
      successCount: processedCount,
      failureCount: failedCount,
      totalRows: products.length,
      jobId: jobId,
      type: 'json'
    }
  });

  return { success: true, processed: processedCount, failed: failedCount };
}

// ── BullMQ Worker (optional — only if Redis is available) ────────────────────
export let importWorker: Worker | null = null;

const initWorker = () => {
  try {
    importWorker = new Worker(
      importQueueName,
      async (job: Job) => {
        const { products, filePath, userId, actorId, dbJobId } = job.data;
        const finalJobId = dbJobId || job.id;

        if (filePath) {
          return processFileImport(finalJobId, filePath, userId, actorId, async (p) => {
            await job.updateProgress(p);
          });
        } else {
          return processProductImport(finalJobId, products, userId, actorId, async (p) => {
            await job.updateProgress(p);
          });
        }
      },
      { 
        connection: redisConnection as any,
        // Don't let worker errors crash the process
      }
    );

    importWorker.on('failed', (job, err) => {
      console.error(`[ImportWorker] Job ${job?.id} failed:`, err.message);
    });

    importWorker.on('error', (err) => {
      // Silence connection errors as they are handled by redisConnection
    });

    console.log('[ImportWorker] BullMQ worker initialized.');
  } catch (err: any) {
    // If Redis is not available, we just don't start the worker.
    // The server will fall back to setImmediate/in-process imports.
    console.warn('[ImportWorker] BullMQ worker could not be started (Redis offline). Falling back to in-process imports.');
    importWorker = null;
  }
};

// Start initialization
initWorker();
