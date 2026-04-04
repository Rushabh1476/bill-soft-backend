import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNewTables() {
  console.log('🌱 Seeding new tables...');

  try {
    // Seed default tax rates
    console.log('  📊 Seeding tax rates...');
    
    const taxes = [
      {
        name: 'GST_18',
        displayName: 'GST 18%',
        rate: 18.0,
        description: 'Standard Goods and Services Tax rate',
        type: 'PERCENTAGE' as const,
        isDefault: true,
        isActive: true,
        region: 'India'
      },
      {
        name: 'GST_12',
        displayName: 'GST 12%',
        rate: 12.0,
        description: 'Reduced GST rate for specific goods and services',
        type: 'PERCENTAGE' as const,
        isDefault: false,
        isActive: true,
        region: 'India'
      },
      {
        name: 'GST_5',
        displayName: 'GST 5%',
        rate: 5.0,
        description: 'Lower GST rate for essential goods',
        type: 'PERCENTAGE' as const,
        isDefault: false,
        isActive: true,
        region: 'India'
      },
      {
        name: 'IGST_18',
        displayName: 'IGST 18%',
        rate: 18.0,
        description: 'Integrated Goods and Services Tax for inter-state transactions',
        type: 'PERCENTAGE' as const,
        isDefault: false,
        isActive: true,
        region: 'India'
      },
      {
        name: 'NO_TAX',
        displayName: 'No Tax',
        rate: 0.0,
        description: 'Tax-exempt items',
        type: 'PERCENTAGE' as const,
        isDefault: false,
        isActive: true
      }
    ];

    for (const tax of taxes) {
      await prisma.tax.upsert({
        where: { name: tax.name },
        update: tax,
        create: tax
      });
    }

    // Seed global settings
    console.log('  ⚙️ Seeding global settings...');
    
    const settings = [
      {
        category: 'invoice',
        key: 'default_currency',
        value: JSON.stringify('INR'),
        defaultValue: JSON.stringify('INR'),
        valueType: 'STRING' as const,
        displayName: 'Default Currency',
        description: 'Default currency for invoices',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'General',
        order: 1
      },
      {
        category: 'invoice',
        key: 'invoice_prefix',
        value: JSON.stringify('INV'),
        defaultValue: JSON.stringify('INV'),
        valueType: 'STRING' as const,
        displayName: 'Invoice Prefix',
        description: 'Prefix for invoice numbers',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'Numbering',
        order: 2
      },
      {
        category: 'invoice',
        key: 'auto_calculate_tax',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        valueType: 'BOOLEAN' as const,
        displayName: 'Auto Calculate Tax',
        description: 'Automatically calculate tax on invoice items',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'Tax',
        order: 3
      },
      {
        category: 'billing',
        key: 'payment_terms_days',
        value: JSON.stringify(30),
        defaultValue: JSON.stringify(30),
        valueType: 'NUMBER' as const,
        displayName: 'Payment Terms (Days)',
        description: 'Default payment terms in days',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'Payment',
        order: 4
      },
      {
        category: 'notification',
        key: 'send_invoice_emails',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        valueType: 'BOOLEAN' as const,
        displayName: 'Send Invoice Emails',
        description: 'Automatically send email notifications for new invoices',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'Email',
        order: 5
      },
      {
        category: 'appearance',
        key: 'company_logo_url',
        value: JSON.stringify(''),
        defaultValue: JSON.stringify(''),
        valueType: 'STRING' as const,
        displayName: 'Company Logo URL',
        description: 'URL for company logo on invoices',
        isSystemSetting: false,
        isUserEditable: true,
        group: 'Branding',
        order: 6
      }
    ];

    for (const setting of settings) {
      await prisma.settings.upsert({
        where: {
          category_key: {
            category: setting.category,
            key: setting.key
          }
        },
        update: setting,
        create: setting
      });
    }

    // Seed feature flags
    console.log('  🚩 Seeding feature flags...');
    
    const featureFlags = [
      {
        module: 'BILLS' as const,
        feature: 'advanced_search',
        displayName: 'Advanced Bill Search',
        description: 'Enable advanced search and filtering options for bills',
        isEnabled: true,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      },
      {
        module: 'BILLS' as const,
        feature: 'bulk_operations',
        displayName: 'Bulk Bill Operations',
        description: 'Enable bulk operations for bill management',
        isEnabled: true,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 2
      },
      {
        module: 'CUSTOMERS' as const,
        feature: 'customer_portal',
        displayName: 'Customer Portal',
        description: 'Enable customer self-service portal',
        isEnabled: false,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      },
      {
        module: 'PRODUCTS' as const,
        feature: 'inventory_tracking',
        displayName: 'Inventory Tracking',
        description: 'Enable inventory tracking for products',
        isEnabled: true,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      },
      {
        module: 'PRODUCTS' as const,
        feature: 'barcode_scanning',
        displayName: 'Barcode Scanning',
        description: 'Enable barcode scanning for product entry',
        isEnabled: false,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 2
      },
      {
        module: 'USERS' as const,
        feature: 'two_factor_auth',
        displayName: 'Two-Factor Authentication',
        description: 'Enable two-factor authentication for users',
        isEnabled: false,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      },
      {
        module: 'ROLES' as const,
        feature: 'custom_permissions',
        displayName: 'Custom Permissions',
        description: 'Enable custom permission management',
        isEnabled: true,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      },
      {
        module: 'SETTINGS' as const,
        feature: 'advanced_theming',
        displayName: 'Advanced Theming',
        description: 'Enable advanced theming and customization options',
        isEnabled: false,
        isVisible: true,
        isEditable: true,
        isRequired: false,
        order: 1
      }
    ];

    // Create feature flags (skip if they already exist)
    for (const flag of featureFlags) {
      try {
        await prisma.dynamicFeatureFlag.create({
          data: flag
        });
      } catch (error) {
        // Flag already exists, skip
        console.log(`  🔄 Feature flag ${flag.module}.${flag.feature} already exists`);
      }
    }

    console.log('✅ New tables seeded successfully!');
    console.log(`   📊 ${taxes.length} tax rates`);
    console.log(`   ⚙️  ${settings.length} settings`);
    console.log(`   🚩 ${featureFlags.length} feature flags`);

  } catch (error) {
    console.error('❌ Error seeding new tables:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedNewTables();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedNewTables };
