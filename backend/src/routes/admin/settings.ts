import express, { Request, Response } from 'express';
import db from '../../lib/prisma';
import { authenticateToken, requirePermission } from '../../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/admin/settings/invoice-preferences
router.get('/invoice-preferences', async (req: Request, res: Response) => {
  try {
    const settings = await db.settings.findFirst({
      where: { 
        category: 'invoice',
        key: 'invoice_config'
      }
    });
    
    // If not found, return reasonable defaults
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          showLogo: true,
          includeTaxBreakdown: true,
          showPaymentTerms: true,
          autoGenerateInvoiceNumbers: true,
          customColumns: ["Product Name", "Quantity", "Price", "Total"]
        }
      });
    }

    // Parse the value if it's stored as JSON (though we've added literal fields to the model)
    res.status(200).json({
      success: true,
      data: {
        ...settings,
        // Ensure customColumns is always an array
        customColumns: settings.customColumns ? JSON.parse(settings.customColumns as string) : ["Product Name", "Quantity", "Price", "Total"]
      }
    });
  } catch (error: any) {
    console.error('[InvoicePreferences GET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/settings/invoice-preferences
router.put('/invoice-preferences', async (req: Request, res: Response) => {
  try {
    const { preferences } = req.body; 
    console.log('[InvoicePreferences] Saving Preferences:', preferences);
    
    // Convert array to string for DB storage if it exists
    const dbData = { ...preferences };
    if (Array.isArray(dbData.customColumns)) {
      dbData.customColumns = JSON.stringify(dbData.customColumns);
    }

    const updated = await db.settings.upsert({
      where: { 
        category_key: {
          category: 'invoice',
          key: 'invoice_config'
        }
      },
      update: { 
        ...dbData 
      },
      create: { 
        category: 'invoice',
        key: 'invoice_config',
        value: 'managed',
        displayName: 'Invoice Configuration',
        ...dbData 
      }
    });
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('[InvoicePreferences PUT] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply authentication middleware to all other routes
router.use(authenticateToken);

/**
 * PATCH /api/admin/settings/update-template
 * Updates the persistent template and size selection for the current user
 */
router.patch('/update-template', async (req: any, res: Response) => {
  try {
    const { defaultBillSize, activeTemplateId } = req.body;
    const userId = req.user.id;

    console.log(`[UpdateTemplate] Syncing for user ${userId}:`, { defaultBillSize, activeTemplateId });

    // Use upsert to handle missing BusinessProfile records gracefully
    const profile = await db.businessProfile.upsert({
      where: { userId: userId },
      update: {
        defaultBillSize: defaultBillSize || "A4",
        activeTemplateId: activeTemplateId || "default"
      },
      create: {
        userId: userId,
        defaultBillSize: defaultBillSize || "A4",
        activeTemplateId: activeTemplateId || "default"
      }
    });

    // Also sync the user model for backward compatibility
    await db.user.update({
      where: { id: userId },
      data: {
        defaultBillSize: defaultBillSize || "A4",
        activeTemplateId: activeTemplateId || "default"
      }
    }).catch(() => {
        // Ignore if user update fails but profile succeeded
        console.warn(`[UpdateTemplate] User ${userId} sync legacy fields failed.`);
    });

    res.status(200).json({
      success: true,
      data: {
        defaultBillSize: profile.defaultBillSize,
        activeTemplateId: profile.activeTemplateId
      }
    });
  } catch (error: any) {
    console.error('[UpdateTemplate PATCH] CRITICAL DATABASE ERROR:', error);
    res.status(500).json({ success: false, error: 'Database update failed: ' + error.message });
  }
});


router.use(requirePermission('manage_settings'));

interface SettingRequest {
  key: string;
  category: string;
  value: any;
  defaultValue?: any;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  description?: string;
  isSystemSetting?: boolean;
  isUserEditable?: boolean;
  validation?: Record<string, any>;
  displayName?: string;
  group?: string;
  order?: number;
}

interface SettingResponse {
  id: string;
  key: string;
  category: string;
  value: any;
  defaultValue?: any;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
  description?: string;
  isSystemSetting: boolean;
  isUserEditable: boolean;
  validation?: Record<string, any>;
  displayName: string;
  group?: string;
  order: number;
  userValue?: any;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/settings - List and search settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      valueType,
      isUserEditable,
      userId,
      page = 1,
      limit = 100
    } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { key: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (valueType) {
      where.valueType = valueType;
    }

    if (isUserEditable !== undefined) {
      where.isUserEditable = isUserEditable === 'true';
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [settings, total] = await Promise.all([
      db.settings.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { category: 'asc' },
          { order: 'asc' },
          { key: 'asc' }
        ],
        include: userId ? {
          settingStates: {
            where: { userId: userId as string },
            take: 1
          }
        } : {}
      }),
      db.settings.count({ where })
    ]);

    const formattedSettings: SettingResponse[] = settings.map((setting: any) => {
      let parsedValue;
      let parsedDefaultValue;
      let parsedValidation;
      let userValue;

      try {
        parsedValue = JSON.parse(setting.value);
      } catch {
        parsedValue = setting.value;
      }

      try {
        parsedDefaultValue = setting.defaultValue ? JSON.parse(setting.defaultValue) : undefined;
      } catch {
        parsedDefaultValue = setting.defaultValue;
      }

      try {
        parsedValidation = setting.validation ? JSON.parse(setting.validation) : undefined;
      } catch {
        parsedValidation = setting.validation;
      }

      // Get user-specific value if requested
      if (userId && setting.settingStates && setting.settingStates.length > 0) {
        try {
          userValue = JSON.parse(setting.settingStates[0].value);
        } catch {
          userValue = setting.settingStates[0].value;
        }
      }

      return {
        id: setting.id,
        key: setting.key,
        category: setting.category,
        value: parsedValue,
        defaultValue: parsedDefaultValue,
        valueType: setting.valueType as any,
        description: setting.description || undefined,
        isSystemSetting: setting.isSystemSetting,
        isUserEditable: setting.isUserEditable,
        validation: parsedValidation,
        displayName: setting.displayName,
        group: setting.group || undefined,
        order: setting.order,
        userValue,
        createdAt: setting.createdAt.toISOString(),
        updatedAt: setting.updatedAt.toISOString()
      };
    });

    // Group by category for better organization
    const groupedSettings = formattedSettings.reduce((acc: any, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedSettings,
      flatData: formattedSettings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

// POST /api/admin/settings - Create new setting
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      key,
      category,
      value,
      defaultValue,
      valueType,
      description,
      isSystemSetting = false,
      isUserEditable = true,
      validation,
      displayName,
      group,
      order = 0
    }: SettingRequest = req.body;

    if (!key || !category || value === undefined || !valueType) {
      return res.status(400).json({
        success: false,
        error: 'Key, category, value, and valueType are required'
      });
    }

    const setting = await db.settings.upsert({
      where: {
        category_key: {
          key,
          category
        }
      },
      update: {
        value: JSON.stringify(value),
        description,
        displayName: displayName || key,
        order
      },
      create: {
        key,
        category,
        value: JSON.stringify(value),
        defaultValue: defaultValue ? JSON.stringify(defaultValue) : undefined,
        valueType,
        description,
        isSystemSetting,
        isUserEditable,
        validation: validation ? JSON.stringify(validation) : undefined,
        displayName: displayName || key,
        group,
        order
      }
    });

    res.status(201).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create setting'
    });
  }
});

// PUT /api/admin/settings - Update multiple settings (upsert)
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    if (typeof updates !== 'object' || updates === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid update body. Expected an object of settings.'
      });
    }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      // Find the setting to get its category if it exists, otherwise use a default or inferred category
      let setting = await db.settings.findFirst({
        where: { key }
      });

      const category = setting?.category || 'general';
      const valueType = setting?.valueType || (typeof value === 'number' ? 'NUMBER' : typeof value === 'boolean' ? 'BOOLEAN' : 'STRING');

      const upserted = await db.settings.upsert({
        where: { 
          category_key: {
            key,
            category
          }
        },
        update: {
          value: JSON.stringify(value)
        },
        create: {
          key,
          category,
          value: JSON.stringify(value),
          valueType: valueType as any,
          displayName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          isSystemSetting: false,
          isUserEditable: true,
          order: 0
        }
      });
      results.push(upserted);
    }

    res.json({
      success: true,
      message: `Updated ${results.length} settings successfully`,
      data: results
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// POST /api/admin/settings/backup - Trigger a database backup
router.post('/backup', async (req: Request, res: Response) => {
  try {
    // For SQLite, a backup is just a copy of the db file
    // Dynamic Resolution: Check environment DATABASE_URL first (production uses /app/data/billsoft.db)
    let dbPath = '';
    const dbUrl = process.env.DATABASE_URL || '';
    
    if (dbUrl.startsWith('file:')) {
      // Parse file path from Prisma URL (e.g., 'file:/app/data/billsoft.db' or 'file:./dev.db')
      const relativePath = dbUrl.replace('file:', '');
      if (path.isAbsolute(relativePath)) {
        dbPath = relativePath;
      } else {
        // Resolve relative to schema location (usually in prisma/ directory)
        dbPath = path.join(process.cwd(), 'prisma', relativePath);
      }
    } else {
      // Default fallback
      dbPath = path.join(process.cwd(), 'prisma/dev.db');
    }

    // --- FALLBACK CHECK ---
    // If the guessed path doesn't exist, try common alternatives before failing
    if (!fs.existsSync(dbPath)) {
      const alternatives = [
        path.join(process.cwd(), 'prisma/dev.db'),
        path.join(process.cwd(), 'data/billsoft.db'),
        path.join(process.cwd(), 'dev.db')
      ];
      for (const alt of alternatives) {
        if (fs.existsSync(alt)) {
          dbPath = alt;
          break;
        }
      }
    }

    // Consistent backup directory (placed next to DB if possible for persistence in volumes)
    const backupDir = path.join(path.dirname(dbPath), 'backups');
    
    console.log(`[Backup] Using database path: ${dbPath}`);
    console.log(`[Backup] Using backup directory: ${backupDir}`);
    
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        success: false,
        error: `Database file not found at ${dbPath}. Verify your DATABASE_URL.`
      });
    }

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Execute copy
    fs.copyFileSync(dbPath, backupPath);
    console.log(`[Backup] Backup completed successfully at ${backupPath}`);

    // Update last_backup_time setting in DB
    await db.settings.upsert({
        where: { 
          category_key: {
            key: 'last_backup_time',
            category: 'maintenance'
          }
        },
        update: { value: JSON.stringify(new Date().toISOString()) },
        create: {
          key: 'last_backup_time',
          category: 'maintenance',
          value: JSON.stringify(new Date().toISOString()),
          valueType: 'STRING',
          displayName: 'Last Backup Time',
          isSystemSetting: true,
          isUserEditable: false,
          order: 0
        }
    });

    res.json({
      success: true,
      message: 'Backup completed successfully',
      backupFile: backupFileName,
      path: backupPath
    });
  } catch (error: any) {
    console.error('CRITICAL: Backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Backup failed: ' + error.message
    });
  }
});

export default router;
