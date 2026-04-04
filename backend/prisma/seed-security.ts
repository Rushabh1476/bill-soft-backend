import { PrismaClient } from '@prisma/client';
import { featureFlagService } from '../src/services/featureFlagService';

const prisma = new PrismaClient();

async function initializeSecurityFeatures() {
  console.log('🔐 Initializing security features...');

  try {
    // Feature flags are already initialized in the service
    console.log('✅ Feature flags initialized');

    // Create default organization settings
    const existingSettings = await prisma.organizationSettings.findFirst();

    if (!existingSettings) {
      await prisma.organizationSettings.create({
        data: {
          // Security Settings - all disabled by default for free plan
          twoFactorRequired: false,
          oauthEnabled: false,
          rbacEnabled: false,
          apiKeysEnabled: false,

          // Password Policy - basic requirements
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecial: true,
          passwordExpiryDays: null, // No expiry by default
          passwordHistoryCount: 5,

          // Session Settings - reasonable defaults
          sessionTimeoutMinutes: 1440, // 24 hours
          maxConcurrentSessions: 5,

          // Security Settings - moderate defaults
          maxFailedAttempts: 5,
          lockoutDurationMinutes: 30
        }
      });
      console.log('✅ Organization settings created');
    } else {
      console.log('✅ Organization settings already exist');
    }

    // Initialize default roles (this would be done when RBAC is enabled)
    // await rbacService.initializeDefaultRoles();
    // console.log('✅ Default roles initialized');

    console.log('🎉 Security features initialization complete!');

  } catch (error) {
    console.error('❌ Failed to initialize security features:', error);
    throw error;
  }
}

async function main() {
  try {
    await initializeSecurityFeatures();
  } catch (error) {
    console.error('Failed to seed security data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { initializeSecurityFeatures };
