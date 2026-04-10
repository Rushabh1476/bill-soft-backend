import express from 'express'
import prisma from '../lib/prisma'
import { extractUserFromRequest } from '../lib/auth'
import { recordAuditLog } from '../lib/auditLog';
import { PRODUCT_CATEGORIES as VALID_CATEGORIES } from './constants/categories';
import { authenticateToken, requirePermission } from '../middleware/auth'
import { processFileImport } from '../workers/importWorker'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

const router = express.Router()

const safeParse = (str: any) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('[Products] Failed to parse customFields:', str);
    return null;
  }
};

// Get dashboard stats (Total Count and Valuation)
router.get('/stats', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
  try {
    const userId = req.user.orgId
    
    // Direct Calculation using Raw SQL for maximum precision and speed
    const stats: any[] = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as totalCount,
        SUM(price * stock) as totalValue
      FROM products 
      WHERE user_id = ${userId}
    `;

    const totalCount = Number(stats[0]?.totalCount || 0);
    const totalValue = Number(stats[0]?.totalValue || 0);

    console.log(`[Products] Stats fetched (Direct SQL) for org ${userId}: Count=${totalCount}, Value=${totalValue}`);

    res.status(200).json({
      totalCount,
      totalValue
    });

  } catch (error) {
    console.error('Get product stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all matching product IDs
router.get('/all-ids', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
  try {
    const { search, category, status } = req.query
    const userId = req.user.orgId
    
    console.log(`[Products] fetching all-ids for org: ${userId}`);
    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { sku: { contains: search as string } }
      ]
    }

    if (category && category !== 'All Categories') {
      if (category === 'Uncategorized') {
        whereClause.OR = [
          { category: 'Uncategorized' },
          { category: null },
          { category: '' },
          { category: { notIn: VALID_CATEGORIES } }
        ]
      } else {
        whereClause.category = category
      }
    }

    if (status && status !== 'All Status') {
      if (status === 'Out of Stock') {
        whereClause.stock = { lte: 0 }
      } else if (status === 'Low Stock') {
        whereClause.stock = { gt: 0, lte: 10 }
      } else if (status === 'In Stock') {
        whereClause.stock = { gt: 10 }
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    })

    const ids = products.map(p => p.id);
    console.log(`[Products] all-ids found ${ids.length} products for org: ${userId}`);
    res.status(200).json({ ids })

  } catch (error) {
    console.error('Get all product IDs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bulk delete products
router.post('/delete', authenticateToken, requirePermission('delete_products'), async (req: any, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.orgId;
    const actorId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      console.warn(`[Products] Bulk delete called without IDs or invalid body:`, ids);
      return res.status(400).json({ error: 'An array of product IDs is required' });
    }

    console.log(`[Products] Bulk delete request: Received ${ids.length} IDs to delete for Org: ${userId}`);

    // Remove duplicates to be efficient
    const uniqueIds = Array.from(new Set(ids));
    const totalToProcess = uniqueIds.length;
    
    // --- CRITICAL FIX: Sequential Small-Batch Delete (Exactly 50) ---
    const CHUNK_SIZE = 50; 
    let totalDeleted = 0;

    console.log(`[Products] Deleting ${uniqueIds.length} items in chunks of ${CHUNK_SIZE} for Org: ${userId}`);

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
      
      try {
        const result = await prisma.product.deleteMany({
          where: {
            id: { in: chunk },
            userId: userId
          }
        });
        totalDeleted += result.count;
        
        // Yield to allow auth middleware / sessions to breathe
        await new Promise(resolve => setImmediate(resolve));
      } catch (chunkErr: any) {
        console.error(`[Products] Delete chunk failed:`, chunkErr.message);
      }
    }

    // Record an audit log summary
    if (totalDeleted > 0) {
      const isBulk = totalDeleted > 1;
      await recordAuditLog({
        userId,
        subUserId: actorId,
        action: isBulk ? 'BULK_DELETE' as any : 'DELETE',
        entity: 'Product',
        entityId: isBulk ? `bulk-del-${Date.now()}` : uniqueIds[0],
        description: isBulk 
          ? `Bulk DELETE: ${totalDeleted} items processed` 
          : `DELETE: Item ${uniqueIds[0]} processed`,
        req,
        oldData: { requested: totalToProcess, deleted: totalDeleted }
      });
    }

    console.log(`[Products] Bulk delete FINISHED. Final outcome: ${totalDeleted} products removed out of ${totalToProcess} unique requested IDs.`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${totalDeleted} products.`,
      deletedCount: totalDeleted,
      totalRequested: totalToProcess
    });

  } catch (error: any) {
    console.error('CRITICAL: Bulk delete handler crashed:', error);
    res.status(500).json({ 
      error: 'A critical server error occurred during bulk deletion process.', 
      details: error.message 
    });
  }
})

// Get all products with pagination
router.get('/', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
  try {
    const { search, page = '1', limit = '50', category, status } = req.query
    const userId = req.user.orgId
    
    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 50
    const skip = (pageNum - 1) * limitNum

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { sku: { contains: search as string } }
      ]
    }

    if (category && category !== 'All Categories') {
      if (category === 'Uncategorized') {
        whereClause.OR = [
          { category: 'Uncategorized' },
          { category: null },
          { category: '' },
          { category: { notIn: VALID_CATEGORIES } }
        ]
      } else {
        whereClause.category = category
      }
    }

    if (status && status !== 'All Status') {
      if (status === 'Out of Stock') {
        whereClause.stock = { lte: 0 }
      } else if (status === 'Low Stock') {
        whereClause.stock = { gt: 0, lte: 10 }
      } else if (status === 'In Stock') {
        whereClause.stock = { gt: 10 }
      }
    }

    console.log(`[Products] Executing paginated query for org: ${userId}, page: ${pageNum}, limit: ${limitNum}`);
    const start = Date.now();
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          supplier: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.product.count({ where: whereClause })
    ])
    const duration = Date.now() - start;
    console.log(`[Products] Query finished in ${duration}ms. Found ${products.length} items, total ${total}.`);

    const resultProducts = products.map((p: any) => ({
      ...p,
      customFields: safeParse(p.customFields)
    }));

    res.status(200).json({ 
      products: resultProducts, 
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create product
router.post('/', authenticateToken, requirePermission('create_products'), async (req: any, res) => {
  try {
    const { name, description, price, imageUrl, taxRate, stock, category, sku, supplierId, customFields, isMarkedRed } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id;

    console.log('Creating product for user:', userId);
    console.log('Payload:', req.body);

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' })
    }

    if (price === undefined || price === null || isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number or zero' });
    }

    const nameLower = name.trim().toLowerCase();

    // SQLite doesn't support case-insensitive equals in Prisma conveniently.
    // Fetch all product names for the user and check in-memory for precision.
    const userProducts = await prisma.product.findMany({
      where: { userId },
      select: { name: true }
    });

    const isDuplicate = userProducts.some(p => p.name.trim().toLowerCase() === nameLower);

    // Implement 'Uncategorized' logic
    let finalCategory = category?.trim() || 'Uncategorized';
    if (finalCategory && finalCategory !== 'Uncategorized' && !VALID_CATEGORIES.includes(finalCategory)) {
      finalCategory = 'Uncategorized';
    }

    // --- Validation ---
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }
    if (stock !== undefined && (isNaN(parseFloat(stock)) || parseFloat(stock) < 0)) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }
    if (taxRate !== undefined && (isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0)) {
      return res.status(400).json({ error: 'Tax rate cannot be negative' });
    }

    const product = await prisma.product.create({
      data: {
        userId,
        name: name.trim(),
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        stock: stock ? parseInt(stock) : 0,
        category: finalCategory,
        sku: sku || null,
        supplierId: supplierId || null,
        isMarkedRed: isMarkedRed !== undefined ? isMarkedRed : false,
        customFields: customFields ? JSON.stringify(customFields) : null
      } as any
    })

    const resultProduct = {
      ...product,
      customFields: safeParse(product.customFields)
    };

    // Audit Log: Create (Single)
    await recordAuditLog({
      userId,
      subUserId: actorId,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      description: `CREATE: Item ${product.id} processed`,
      req,
      newData: { name: product.name, price: product.price, stock: product.stock }
    });

    // Check for stock notification
    if (product.stock <= 10) {
      await (prisma as any).notification.create({
        data: {
          userId,
          type: 'stock',
          message: `${product.name} is added with low stock (${product.stock} units)`,
          isRead: false
        }
      });
    }

    res.status(201).json({
      message: 'Product created successfully',
      product: resultProduct
    })

  } catch (error: any) {
    console.error('Create product error:', error)

    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this SKU already exists' })
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'User session invalid. Please log out and log in again.' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get, Update, Delete product routes similar to customers...
router.get('/:id', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.orgId
    const actorId = req.user.id;

    const product = await prisma.product.findFirst({
      where: { id, userId },
      include: { supplier: true }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.status(200).json({ 
      product: {
        ...product,
        customFields: safeParse(product.customFields)
      } 
    })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateToken, requirePermission('edit_products'), async (req: any, res) => {
  try {
    const { id } = req.params
    const { name, description, price, imageUrl, taxRate, stock, category, sku, supplierId, customFields, isMarkedRed } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' })
    }

    // Implement 'Uncategorized' logic
    let finalCategory = category?.trim() || 'Uncategorized';
    if (finalCategory && finalCategory !== 'Uncategorized' && !VALID_CATEGORIES.includes(finalCategory)) {
      finalCategory = 'Uncategorized';
    }

    // Verify ownership and existence
    const existing = await prisma.product.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      console.warn(`[Products] Update failed: Product ${id} not found for org ${userId}`);
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    // --- Validation ---
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }
    if (stock !== undefined && (isNaN(parseFloat(stock)) || parseFloat(stock) < 0)) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }
    if (taxRate !== undefined && (isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0)) {
      return res.status(400).json({ error: 'Tax rate cannot be negative' });
    }

    // --- Duplicate Name Check (More Resilient) ---
    const nameLower = name.trim().toLowerCase();
    const existingNameLower = existing.name.trim().toLowerCase();

    // Only block if the name is being CHANGED to a name that another product already has.
    // If the name is UNCHANGED, allow it even if duplicates already exist (fixes legacy data issues).
    if (nameLower !== existingNameLower) {
      const nameCollision = await prisma.product.findFirst({
        where: { 
          userId, 
          name: { equals: name.trim() }, // Case-sensitive check in DB
          id: { not: id }
        },
        select: { id: true }
      });

      if (nameCollision) {
        console.warn(`[Products] Update blocked: Name collision for "${name.trim()}" in org ${userId}`);
        return res.status(400).json({ error: `Another product with name "${name.trim()}" already exists.` });
      }
    }

    console.log(`[Products] Updating product ${id} for org ${userId}. Payload values: price=${price}, stock=${stock}`);

    // Use prisma.product.update for direct consistency and returning the object
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description || null,
        price: parseFloat(price) || 0,
        imageUrl: imageUrl || null,
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        stock: stock ? BigInt(Math.floor(Number(stock))) : BigInt(0),
        category: finalCategory,
        sku: sku || null,
        supplierId: supplierId || null,
        isMarkedRed: isMarkedRed !== undefined ? isMarkedRed : isMarkedRed, 
        customFields: customFields ? JSON.stringify(customFields) : null
      } as any
    })

    const resultProduct = {
      ...updatedProduct,
      customFields: safeParse(updatedProduct.customFields)
    };

    // Audit Log: Update
    await recordAuditLog({
      userId: userId,
      subUserId: actorId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      description: `Product: ${resultProduct.name} updated`,
      req,
      newData: { name: resultProduct.name, price: resultProduct.price, stock: resultProduct.stock }
    });

    // Unified Visibility: Check for stock alert on update
    const currentStock = Number(resultProduct.stock || 0);
    if (currentStock <= 10) {
      // Create new unread notification if name + stock combination changed or manually pushed
      await (prisma as any).notification.create({
        data: {
          userId,
          type: 'stock',
          message: `${resultProduct.name} stock updated to ${currentStock}`,
          isRead: false
        }
      });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: resultProduct
    })
  } catch (error: any) {
    console.error('Update product error:', error)

    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this SKU already exists' })
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'User not found or database sync issue. Please reload and log in again.' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, requirePermission('delete_products'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.orgId
    const actorId = req.user.id;
    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    await prisma.$transaction(async (tx) => {
      // 1. Verify the product belongs to this user (unless admin)
      const product = await tx.product.findFirst({
        where: userRole === 'ADMIN' ? { id } : { id, userId }
      });

      if (!product) {
        throw Object.assign(new Error('Product not found'), { statusCode: 404 });
      }

      // 2. Safe to delete
      await tx.product.delete({ where: { id } });

      // 3. Audit log (Single Delete)
      await recordAuditLog({
        userId,
        subUserId: actorId,
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        description: `DELETE: Item ${id} processed`,
        req,
        oldData: { name: product.name, price: product.price },
        prismaClient: tx
      });
    });

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Delete product error:', error)

    const statusCode = error.statusCode || 500;
    if (statusCode === 404) return res.status(404).json({ error: 'Product not found' });
    if (statusCode === 409) return res.status(409).json({ error: error.message });

    // Prisma FK constraint fallback (should not reach here, but guard anyway)
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'Cannot delete product: it is referenced in existing bills. Delete those bills first.' });
    }

    res.status(500).json({
      error: error.message || 'Internal server error',
      details: error.stack
    })
  }
})

// --- Frontend-Managed Batch Uploads (v2) ---

/**
 * Initialize a new import job tracking.
 */
router.post('/batch-init', authenticateToken, requirePermission('create_products'), async (req: any, res) => {
  try {
    const { total } = req.body;
    const userId = req.user.orgId;

    const job = await (prisma as any).importJob.create({
      data: {
        userId,
        status: 'running',
        totalProducts: total || 0,
        processedProducts: 0
      }
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize job' });
  }
});

/**
 * Process a single batch for an existing job.
 */
router.post('/batch-insert-v2', authenticateToken, requirePermission('create_products'), async (req: any, res) => {
  const { jobId, products } = req.body;
  const userId = req.user.orgId;
  const actorId = req.user.id;

  try {
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No products provided' });
    }

    const toInsert = products.map((item: any) => {
      // Fix Excel Mapping: Prioritize exact value, trim, and fallback only if empty
      const rawCategory = item.category?.toString() || '';
      const finalCategory = rawCategory.trim() || 'Uncategorized';

      return {
        userId,
        name: (item.name || '').trim(),
        description: item.description || null,
        price: parseFloat(item.price) || 0,
        stock: parseInt(item.stock, 10) || 0,
        taxRate: parseFloat(item.taxRate) || 0,
        category: finalCategory,
        sku: item.sku || null,
        minStockLevel: parseInt(item.minStockLevel, 10) || 0,
      };
    });

    const result = await prisma.product.createMany({ data: toInsert });

    // Update job progress
    if (jobId) {
      await (prisma as any).importJob.update({
        where: { id: jobId },
        data: { processedProducts: { increment: result.count } }
      });
    }

    res.json({ success: true, count: result.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Product Upload (File-based) — runs in-process, no Redis required
router.post('/bulk-upload', authenticateToken, requirePermission('create_products'), upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.orgId;
    const actorId = req.user.id;
    const filePath = req.file.path;

    // Create Job record in DB first so frontend gets a jobId immediately
    const dbJob = await (prisma as any).importJob.create({
      data: { userId, status: 'pending', totalProducts: 0, processedProducts: 0 }
    });

    // Fire-and-forget: run import in background without blocking the response
    setImmediate(() => {
      processFileImport(dbJob.id, filePath, userId, actorId)
        .catch((err: any) => {
          console.error(`[BulkUpload] Import failed for job ${dbJob.id}:`, err.message);
          (prisma as any).importJob.update({
            where: { id: dbJob.id },
            data: { status: 'failed', errorMessage: err.message }
          }).catch(() => {});
        });
    });

    console.log(`[BulkUpload] Job ${dbJob.id} started in-process (no Redis needed).`);
    res.status(202).json({ success: true, jobId: dbJob.id, message: 'Bulk upload started' });

  } catch (error) {
    console.error('[BulkUpload] Start error:', error);
    res.status(500).json({ error: 'Failed to start bulk upload' });
  }
});

// Bulk Product Import — alias for /bulk-upload, runs in-process, no Redis required
router.post('/bulk-import', authenticateToken, requirePermission('create_products'), upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.orgId;
    const actorId = req.user.id;
    const filePath = req.file.path;

    // Create Job record in DB first so frontend gets a jobId immediately
    const dbJob = await (prisma as any).importJob.create({
      data: { userId, status: 'pending', totalProducts: 0, processedProducts: 0 }
    });

    // Fire-and-forget: run import in background without blocking the response
    setImmediate(() => {
      processFileImport(dbJob.id, filePath, userId, actorId)
        .catch((err: any) => {
          console.error(`[BulkImport] Import failed for job ${dbJob.id}:`, err.message);
          (prisma as any).importJob.update({
            where: { id: dbJob.id },
            data: { status: 'failed', errorMessage: err.message }
          }).catch(() => {});
        });
    });

    console.log(`[BulkImport] Job ${dbJob.id} started in-process (no Redis needed).`);
    res.status(202).json({ success: true, jobId: dbJob.id, message: 'Bulk import started' });

  } catch (error) {
    console.error('[BulkImport] Start error:', error);
    res.status(500).json({ error: 'Failed to start bulk import' });
  }
});

// --- NEW CHUNKED IMPORT ENDPOINTS ---

// Start a chunked import job
router.post('/import/start', authenticateToken, requirePermission('create_products'), async (req: any, res: any) => {
  try {
    const { totalProducts } = req.body;
    const userId = req.user.orgId;

    const dbJob = await (prisma as any).importJob.create({
      data: { 
        userId, 
        status: 'running', 
        totalProducts: totalProducts || 0, 
        processedProducts: 0, 
        failedProducts: 0 
      }
    });

    console.log(`[ChunkImport] Started job ${dbJob.id} for ${totalProducts} products.`);
    res.status(201).json({ success: true, jobId: dbJob.id });
  } catch (error) {
    console.error('[ChunkImport] Start error:', error);
    res.status(500).json({ error: 'Failed to start import job' });
  }
});

// Process a chunk of products
router.post('/import/chunk', authenticateToken, requirePermission('create_products'), async (req: any, res: any) => {
  const { jobId, products } = req.body;
  const userId = req.user.orgId;

  if (!jobId || !Array.isArray(products)) {
    return res.status(400).json({ error: 'jobId and products array are required' });
  }

  try {
    // Check if job exists and is still running
    const job = await (prisma as any).importJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'cancelled') return res.status(400).json({ error: 'Job was cancelled' });

    // Prepare data with jobId tagging for Atomic Rollback
    const data = products.map(p => {
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
        customFields: JSON.stringify({ _importJobId: jobId }) // Hidden tag for rollback
      };
    }).filter(p => p.name);

    if (data.length > 0) {
      // Create products in one go (chunk size is already controlled by frontend)
      await prisma.product.createMany({ data });
      
      // Update job progress
      const updatedJob = await (prisma as any).importJob.update({
        where: { id: jobId },
        data: { 
          processedProducts: { increment: data.length },
          failedProducts: { increment: products.length - data.length }
        }
      });

      // REMOVED individual chunk logging to adhere to "Single Log Entry" rule.
      // Final summary will be handled by processFileImport/processProductImport logic or job finish.
      // If this is chunk-based from frontend directly (batch-insert-v2 type), we should log once at finish.
    }

    res.json({ success: true, processed: data.length });
  } catch (error: any) {
    console.error(`[ChunkImport] Chunk error for job ${jobId}:`, error);
    res.status(500).json({ error: 'Failed to process chunk', details: error.message });
  }
});

// Finish an import job
router.post('/import/finish', authenticateToken, requirePermission('create_products'), async (req: any, res: any) => {
  const { jobId, status = 'completed' } = req.body;

  try {
    const job = await (prisma as any).importJob.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    await (prisma as any).importJob.update({
      where: { id: jobId },
      data: { status }
    });

    // WORLD-CLASS LOGGING: Trigger single log entry at the very end of the service function
    const isBulk = job.processedProducts > 1;
    await recordAuditLog({
      userId: job.userId,
      action: isBulk ? 'BULK_CREATE' as any : 'CREATE',
      entity: 'Product',
      entityId: isBulk ? `bulk-import-${jobId}` : `single-import-${jobId}`,
      description: isBulk 
        ? `Bulk CREATE: ${job.processedProducts} items processed` 
        : `CREATE: Item ${jobId} processed`,
      newData: { count: job.processedProducts, jobId }
    });
  } catch (error) {
    console.error('[ChunkImport] Finish error:', error);
    res.status(500).json({ error: 'Failed to finish import job' });
  }
});

// GET bulk-import/status/:jobId strictly as requested
router.get('/bulk-import/status/:jobId', authenticateToken, async (req: any, res: any) => {
  const { jobId } = req.params;

  try {
    const job = await (prisma as any).importJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    const total = job.totalProducts || 0;
    const processed = job.processedProducts || 0;
    const failed = job.failedProducts || 0;
    const progress = total > 0 ? Math.floor(((processed + failed) / total) * 100) : 0;

    return res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      processed,
      failed,
      total,
      progress: Math.min(progress, 100),
      errorMessage: job.errorMessage,
      errorLog: job.errorLog ? JSON.parse(job.errorLog) : []
    });
  } catch (error) {
    console.error('[BulkImport] Status check error:', error);
    return res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// POST /bulk-import/cancel/:jobId to stop the job
router.post('/bulk-import/cancel/:jobId', authenticateToken, async (req: any, res: any) => {
  const { jobId } = req.params;
  const userId = req.user.orgId;

  try {
    const job = await (prisma as any).importJob.findUnique({
      where: { id: jobId, userId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return res.status(400).json({ error: 'Cannot cancel a finished job' });
    }

    // Atomic Rollback: Delete any products created during this job session
    await prisma.product.deleteMany({
      where: {
        userId,
        customFields: {
          contains: `"importJobId":"${jobId}"`
        }
      }
    });

    // Update status to 'cancelled'. The worker/logic polls this status and will stop.
    await (prisma as any).importJob.update({
      where: { id: jobId },
      data: { status: 'cancelled' }
    });

    console.log(`[BulkImport] Job ${jobId} marked as cancelled by user.`);

    return res.json({
      success: true,
      message: 'Import cancellation requested'
    });
  } catch (error) {
    console.error('[BulkImport] Cancellation error:', error);
    return res.status(500).json({ error: 'Failed to cancel job' });
  }
});

export default router;
