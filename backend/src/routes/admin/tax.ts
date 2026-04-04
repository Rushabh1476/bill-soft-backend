import express, { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requirePermission } from '../../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requirePermission('manage_settings'));

interface TaxRequest {
  name: string;
  displayName?: string;
  rate: number;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'COMPOUND';
  isDefault?: boolean;
  isActive?: boolean;
  applicableTo?: string[]; // Will be stored as JSON string
  region?: string;
  metadata?: Record<string, any>;
}

interface TaxResponse {
  id: string;
  name: string;
  displayName: string;
  rate: number;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'COMPOUND';
  isDefault: boolean;
  isActive: boolean;
  applicableTo?: string[];
  region?: string;
  metadata?: Record<string, any>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/tax - List and search taxes
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, type, isActive, isDefault, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault === 'true';
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [taxes, total] = await Promise.all([
      prisma.tax.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { isDefault: 'desc' },
          { isActive: 'desc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              billItems: true
            }
          }
        }
      }),
      prisma.tax.count({ where })
    ]);

    const formattedTaxes: TaxResponse[] = taxes.map((tax: any) => ({
      id: tax.id,
      name: tax.name,
      displayName: tax.displayName,
      rate: tax.rate,
      description: tax.description || undefined,
      type: tax.type,
      isDefault: tax.isDefault,
      isActive: tax.isActive,
      applicableTo: tax.applicableTo ? JSON.parse(tax.applicableTo) : undefined,
      region: tax.region || undefined,
      metadata: tax.metadata ? JSON.parse(tax.metadata) : undefined,
      usageCount: tax._count.billItems,
      createdAt: tax.createdAt.toISOString(),
      updatedAt: tax.updatedAt.toISOString()
    }));

    res.json({
      success: true,
      data: formattedTaxes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch taxes'
    });
  }
});

// POST /api/admin/tax - Create new tax
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      displayName,
      rate,
      description,
      type,
      isDefault = false,
      isActive = true,
      applicableTo = [],
      region,
      metadata
    }: TaxRequest = req.body;

    // Validation
    if (!name || typeof rate !== 'number' || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name, rate, and type are required'
      });
    }

    if (rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        error: 'Rate must be between 0 and 100'
      });
    }

    // If setting as default, remove default from other taxes
    if (isDefault) {
      await prisma.tax.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create tax
    const tax = await prisma.tax.create({
      data: {
        name,
        displayName: displayName || name,
        rate,
        description,
        type,
        isDefault,
        isActive,
        applicableTo: applicableTo.length > 0 ? JSON.stringify(applicableTo) : undefined,
        region,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      },
      include: {
        _count: {
          select: {
            billItems: true
          }
        }
      }
    });

    const response: TaxResponse = {
      id: tax.id,
      name: tax.name,
      displayName: tax.displayName,
      rate: tax.rate,
      description: tax.description || undefined,
      type: tax.type as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'COMPOUND',
      isDefault: tax.isDefault,
      isActive: tax.isActive,
      applicableTo: tax.applicableTo ? JSON.parse(tax.applicableTo) : undefined,
      region: tax.region || undefined,
      metadata: tax.metadata ? JSON.parse(tax.metadata) : undefined,
      usageCount: tax._count.billItems,
      createdAt: tax.createdAt.toISOString(),
      updatedAt: tax.updatedAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error creating tax:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tax'
    });
  }
});

// PUT /api/admin/tax/:id - Update existing tax
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      displayName,
      rate,
      description,
      type,
      isDefault,
      isActive,
      applicableTo,
      region,
      metadata
    }: Partial<TaxRequest> = req.body;

    // If setting as default, remove default from other taxes
    if (isDefault) {
      await prisma.tax.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const tax = await prisma.tax.update({
      where: { id },
      data: {
        name,
        displayName,
        rate,
        description,
        type,
        isDefault,
        isActive,
        applicableTo: applicableTo ? JSON.stringify(applicableTo) : undefined,
        region,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });

    res.json({
      success: true,
      data: tax
    });
  } catch (error) {
    console.error('Error updating tax:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tax'
    });
  }
});

// DELETE /api/admin/tax/:id - Delete a tax
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check usage
    const usageCount = await prisma.billItem.count({
      where: { 
        // Logic to check if tax is used - assuming billItem has a relation or similar
        // Since schema is not fully visible, we just try to delete
      }
    });

    await prisma.tax.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tax deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting tax:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete tax because it is being used in invoices'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete tax'
    });
  }
});

export default router;
