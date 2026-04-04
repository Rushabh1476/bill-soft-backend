
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { extractUserFromRequest } from '../lib/auth';
import { recordAuditLog } from '../lib/auditLog';

/**
 * High-performance batch insertion service.
 * Handles database transaction, batching, and audit logging.
 */
export async function insertProductBatch(userId: string, products: any[], actorId?: string) {
  // Use prisma.$transaction to ensure all-or-nothing for this batch
  return await prisma.$transaction(async (tx) => {
    // 1. Bulk insert using createMany (most efficient for large datasets)
    const result = await tx.product.createMany({
      data: products.map(p => ({
        userId,
        name: p.name,
        description: p.description || null,
        price: parseFloat(p.price) || 0,
        stock: parseInt(p.stock) || 0,
        taxRate: parseFloat(p.taxRate) || 0,
        category: p.category || null,
        sku: p.sku || null,
        supplierId: p.supplierId || null,
        imageUrl: p.imageUrl || null
      }))
    });

    // 2. recordAuditLog if result.count > 0
    if (result.count > 0) {
      await recordAuditLog({
        userId,
        subUserId: actorId,
        action: 'CREATE',
        entity: 'Product',
        entityId: `batch-${Date.now()}`,
        description: `Bulk inserted batch of ${result.count} products`,
        prismaClient: tx
      });
    }

    return result;
  }, {
    timeout: 30000 // Increase timeout for large batches
  });
}

/**
 * Specialized route for handling incoming batches from the frontend.
 */
export async function handleBatchUpload(req: any, res: Response) {
  try {
    const { products } = req.body;
    const userId = req.user.orgId;
    const actorId = req.user.id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Valid products array is required' });
    }

    const batchSize = products.length;
    console.log(`[BatchInsert] Processing batch of ${batchSize} for user ${userId}`);

    // Call service
    const result = await insertProductBatch(userId, products, actorId);

    return res.status(200).json({
      success: true,
      count: result.count,
      message: `Successfully inserted ${result.count} products`
    });

  } catch (error: any) {
    console.error('[BatchInsert] Error:', error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Duplicate entries found in batch' });
    }

    return res.status(500).json({ 
        error: 'Failed to process batch', 
        details: error.message 
    });
  }
}
