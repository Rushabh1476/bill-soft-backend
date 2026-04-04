import express, { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requirePermission } from '../../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requirePermission('manage_settings'));

interface FeatureFlagRequest {
  module: 'BILLS' | 'CUSTOMERS' | 'PRODUCTS' | 'USERS' | 'ROLES' | 'SETTINGS';
  feature: string;
  displayName: string;
  description?: string;
  isEnabled?: boolean;
  isVisible?: boolean;
  isEditable?: boolean;
  isRequired?: boolean;
  order?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  roleId?: string;
}

interface FeatureFlagResponse {
  id: string;
  module: 'BILLS' | 'CUSTOMERS' | 'PRODUCTS' | 'USERS' | 'ROLES' | 'SETTINGS';
  feature: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  isVisible: boolean;
  isEditable: boolean;
  isRequired: boolean;
  order: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  roleId?: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/feature-flags - List and search feature flags
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      module,
      isEnabled,
      isVisible,
      userId,
      roleId,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { feature: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (module) {
      where.module = module;
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled === 'true';
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible === 'true';
    }

    if (userId) {
      where.userId = userId;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [featureFlags, total] = await Promise.all([
      prisma.dynamicFeatureFlag.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { module: 'asc' },
          { order: 'asc' },
          { feature: 'asc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              companyName: true
            }
          },
          role: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      }),
      prisma.dynamicFeatureFlag.count({ where })
    ]);

    const formattedFlags: (FeatureFlagResponse & {
      user?: { id: string; email: string; companyName?: string };
      role?: { id: string; name: string; displayName: string };
    })[] = featureFlags.map((flag: any) => {
      let parsedConditions;
      let parsedMetadata;

      try {
        parsedConditions = flag.conditions ? JSON.parse(flag.conditions) : undefined;
      } catch {
        parsedConditions = flag.conditions;
      }

      try {
        parsedMetadata = flag.metadata ? JSON.parse(flag.metadata) : undefined;
      } catch {
        parsedMetadata = flag.metadata;
      }

      return {
        id: flag.id,
        module: flag.module,
        feature: flag.feature,
        displayName: flag.displayName,
        description: flag.description || undefined,
        isEnabled: flag.isEnabled,
        isVisible: flag.isVisible,
        isEditable: flag.isEditable,
        isRequired: flag.isRequired,
        order: flag.order,
        conditions: parsedConditions,
        metadata: parsedMetadata,
        userId: flag.userId || undefined,
        roleId: flag.roleId || undefined,
        user: flag.user ? {
          id: flag.user.id,
          email: flag.user.email,
          companyName: flag.user.companyName || undefined
        } : undefined,
        role: flag.role || undefined,
        createdAt: flag.createdAt.toISOString(),
        updatedAt: flag.updatedAt.toISOString()
      };
    });

    // Group by module for better organization
    const groupedFlags = formattedFlags.reduce((acc: any, flag) => {
      if (!acc[flag.module]) {
        acc[flag.module] = [];
      }
      acc[flag.module].push(flag);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedFlags,
      flatData: formattedFlags,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags'
    });
  }
});

// POST /api/admin/feature-flags - Create new feature flag
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      module,
      feature,
      displayName,
      description,
      isEnabled = true,
      isVisible = true,
      isEditable = true,
      isRequired = false,
      order = 0,
      conditions,
      metadata,
      userId,
      roleId
    }: FeatureFlagRequest = req.body;

    // Validation
    if (!module || !feature || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Module, feature, and displayName are required'
      });
    }

    // Check if feature flag already exists
    const existingFlag = await prisma.dynamicFeatureFlag.findFirst({
      where: {
        module,
        feature,
        userId: userId || null,
        roleId: roleId || null
      }
    });

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        error: 'Feature flag with this combination already exists'
      });
    }

    // Create feature flag
    const featureFlag = await prisma.dynamicFeatureFlag.create({
      data: {
        module,
        feature,
        displayName,
        description,
        isEnabled,
        isVisible,
        isEditable,
        isRequired,
        order,
        conditions: conditions ? JSON.stringify(conditions) : undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        user: userId ? { connect: { id: userId } } : undefined,
        role: roleId ? { connect: { id: roleId } } : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    });

    const response: FeatureFlagResponse & {
      user?: { id: string; email: string; companyName?: string };
      role?: { id: string; name: string; displayName: string };
    } = {
      id: featureFlag.id,
      module: featureFlag.module as 'BILLS' | 'CUSTOMERS' | 'PRODUCTS' | 'USERS' | 'ROLES' | 'SETTINGS',
      feature: featureFlag.feature,
      displayName: featureFlag.displayName,
      description: featureFlag.description || undefined,
      isEnabled: featureFlag.isEnabled,
      isVisible: featureFlag.isVisible,
      isEditable: featureFlag.isEditable,
      isRequired: featureFlag.isRequired,
      order: featureFlag.order,
      conditions: featureFlag.conditions ? JSON.parse(featureFlag.conditions) : undefined,
      metadata: featureFlag.metadata ? JSON.parse(featureFlag.metadata) : undefined,
      userId: featureFlag.userId || undefined,
      roleId: featureFlag.roleId || undefined,
      user: featureFlag.user ? {
        id: featureFlag.user.id,
        email: featureFlag.user.email,
        companyName: featureFlag.user.companyName || undefined
      } : undefined,
      role: featureFlag.role || undefined,
      createdAt: featureFlag.createdAt.toISOString(),
      updatedAt: featureFlag.updatedAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feature flag'
    });
  }
});

export default router;
