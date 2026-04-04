import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/templates
 * List all templates including custom ones
 */
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.orgId;
    
    // Fetch user custom templates
    const registrationSettingKey = `user_custom_templates`;
    const regSetting = await prisma.settings.findUnique({
        where: { category_key: { category: 'TEMPLATE_CONFIG', key: registrationSettingKey } }
    });

    let customTemplates: any[] = [];
    if (regSetting) {
        const state = await prisma.settingState.findUnique({
            where: { settingId_userId: { settingId: regSetting.id, userId } }
        });
        if (state) {
            try {
                customTemplates = JSON.parse(state.value);
            } catch (e) {
                customTemplates = [];
            }
        }
    }

    res.status(200).json({ success: true, customTemplates });
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    res.status(500).json({ error: 'Internal server error while fetching templates' });
  }
});

/**
 * PUT /api/templates/:id/settings
 * Save template style settings
 */
router.put('/:id/settings', async (req: any, res) => {
  try {
    const { id: templateId } = req.params;
    const { settings } = req.body;
    const userId = req.user.orgId;

    if (!settings) {
      return res.status(400).json({ error: 'Settings are required' });
    }

    // Use Settings table to persist template-specific configurations
    // Category: TEMPLATE_CONFIG, Key: template_styles_{id}
    const settingKey = `template_styles_${templateId}`;
    
    // First ensure the system setting exists
    const systemSetting = await prisma.settings.upsert({
      where: {
        category_key: {
          category: 'TEMPLATE_CONFIG',
          key: settingKey
        }
      },
      update: {},
      create: {
        category: 'TEMPLATE_CONFIG',
        key: settingKey,
        value: JSON.stringify(settings),
        valueType: 'JSON',
        displayName: `Template Styles: ${templateId}`,
        isSystemSetting: false,
        isUserEditable: true
      }
    });

    // Then save user-specific override in SettingState
    await prisma.settingState.upsert({
      where: {
        settingId_userId: {
          settingId: systemSetting.id,
          userId
        }
      },
      update: {
        value: JSON.stringify(settings)
      },
      create: {
        settingId: systemSetting.id,
        userId,
        value: JSON.stringify(settings)
      }
    });

    res.status(200).json({ success: true, message: 'Template settings saved successfully' });
  } catch (error) {
    console.error('Error saving template settings:', error);
    res.status(500).json({ error: 'Internal server error while saving settings' });
  }
});

/**
 * PUT /api/templates/:id/fields
 * Save template fields
 */
router.put('/:id/fields', async (req: any, res) => {
  try {
    const { id: templateId } = req.params;
    const { fields } = req.body;
    const userId = req.user.orgId;

    if (!fields) {
      return res.status(400).json({ error: 'Fields are required' });
    }

    const settingKey = `template_fields_${templateId}`;
    
    const systemSetting = await prisma.settings.upsert({
      where: {
        category_key: {
          category: 'TEMPLATE_CONFIG',
          key: settingKey
        }
      },
      update: {},
      create: {
        category: 'TEMPLATE_CONFIG',
        key: settingKey,
        value: JSON.stringify(fields),
        valueType: 'JSON',
        displayName: `Template Fields: ${templateId}`,
        isSystemSetting: false,
        isUserEditable: true
      }
    });

    await prisma.settingState.upsert({
      where: {
        settingId_userId: {
          settingId: systemSetting.id,
          userId
        }
      },
      update: {
        value: JSON.stringify(fields)
      },
      create: {
        settingId: systemSetting.id,
        userId,
        value: JSON.stringify(fields)
      }
    });

    res.status(200).json({ success: true, message: 'Template fields saved successfully' });
  } catch (error) {
    console.error('Error saving template fields:', error);
    res.status(500).json({ error: 'Internal server error while saving fields' });
  }
});

/**
 * POST /api/templates
 * Create a new template (or duplicate an existing one)
 */
router.post('/', async (req: any, res) => {
  try {
    const { name, description, category, complexity, settings, fields } = req.body;
    const userId = req.user.orgId;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // Generate a unique ID for the new template
    const templateId = `custom-${Date.now()}`;
    
    // If settings or fields are provided (as in duplication), use them.
    // Otherwise, use default values.
    const templateData = {
      id: templateId,
      name,
      description: description || '',
      category: category || 'general',
      complexity: complexity || 'standard',
      fields: fields || [],
      settings: settings || {
        logoPosition: 'top-left',
        colorScheme: '#1976d2',
        fontFamily: 'Arial',
        fontSize: 12,
        showBorder: true,
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store custom template registration
    const registrationSettingKey = `user_custom_templates`;
    
    const registrationSetting = await prisma.settings.upsert({
        where: {
          category_key: {
            category: 'TEMPLATE_CONFIG',
            key: registrationSettingKey
          }
        },
        update: {},
        create: {
          category: 'TEMPLATE_CONFIG',
          key: registrationSettingKey,
          value: '[]',
          valueType: 'ARRAY',
          displayName: 'User Custom Templates',
          isSystemSetting: false,
          isUserEditable: true
        }
      });

    const existingStates = await prisma.settingState.findUnique({
        where: {
            settingId_userId: {
                settingId: registrationSetting.id,
                userId
            }
        }
    });

    let customTemplates = [];
    if (existingStates) {
        try {
            customTemplates = JSON.parse(existingStates.value);
        } catch (e) {
            customTemplates = [];
        }
    }

    customTemplates.push(templateData);

    await prisma.settingState.upsert({
      where: {
        settingId_userId: {
          settingId: registrationSetting.id,
          userId
        }
      },
      update: {
        value: JSON.stringify(customTemplates)
      },
      create: {
        settingId: registrationSetting.id,
        userId,
        value: JSON.stringify(customTemplates)
      }
    });

    res.status(201).json({ success: true, templateId, templateData });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error while creating template' });
  }
});

/**
 * GET /api/templates/settings/:category/:key
 * Fetch specific template settings
 */
router.get('/settings/:category/:key', async (req: any, res) => {
  try {
    const { category, key } = req.params;
    const userId = req.user.orgId;

    const setting = await prisma.settings.findUnique({
      where: {
        category_key: {
          category,
          key
        }
      },
      include: {
        settingStates: {
          where: { userId }
        }
      }
    });

    if (!setting) {
      return res.status(200).json({ success: true, data: null });
    }

    const value = setting.settingStates.length > 0
      ? setting.settingStates[0].value
      : setting.value;

    let parsedValue;
    try {
        parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
        parsedValue = value;
    }

    res.status(200).json({ 
      success: true, 
      data: parsedValue
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error while fetching settings' });
  }
});

/**
 * PUT /api/templates/settings/:category/:key
 * Save specific template settings
 */
router.put('/settings/:category/:key', async (req: any, res) => {
  try {
    const { category, key } = req.params;
    const { value } = req.body;
    const userId = req.user.orgId;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const stringifiedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Find or create setting
    const setting = await prisma.settings.upsert({
      where: {
        category_key: {
          category,
          key
        }
      },
      update: {},
      create: {
        category,
        key,
        value: stringifiedValue,
        displayName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        valueType: typeof value === 'object' ? 'JSON' : 'STRING'
      }
    });

    // Upsert state for user
    await prisma.settingState.upsert({
      where: {
        settingId_userId: {
          settingId: setting.id,
          userId
        }
      },
      update: {
        value: stringifiedValue
      },
      create: {
        settingId: setting.id,
        userId,
        value: stringifiedValue
      }
    });

    res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Internal server error while saving settings' });
  }
});

export default router;
