import { PrismaClient } from '@prisma/client';

// Simplified in-memory feature flags for demonstration
const SECURITY_FEATURES = {
  'two_factor_auth': {
    name: 'two_factor_auth',
    displayName: '2FA Authentication',
    enabled: false,
    isPaidFeature: true,
    requiredPlan: 'BASIC'
  },
  'oauth_integration': {
    name: 'oauth_integration',
    displayName: 'OAuth Integration',
    enabled: false,
    isPaidFeature: true,
    requiredPlan: 'BASIC'
  },
  'role_based_access': {
    name: 'role_based_access',
    displayName: 'Role-Based Access Control',
    enabled: false,
    isPaidFeature: true,
    requiredPlan: 'PREMIUM'
  },
  'api_key_management': {
    name: 'api_key_management',
    displayName: 'API Key Management',
    enabled: false,
    isPaidFeature: true,
    requiredPlan: 'PREMIUM'
  }
};

const prisma = new PrismaClient();

export class SimplifiedFeatureFlagService {
  private static instance: SimplifiedFeatureFlagService;

  public static getInstance(): SimplifiedFeatureFlagService {
    if (!SimplifiedFeatureFlagService.instance) {
      SimplifiedFeatureFlagService.instance = new SimplifiedFeatureFlagService();
    }
    return SimplifiedFeatureFlagService.instance;
  }

  /**
   * Check if a feature is enabled and user has access
   */
  public async hasFeatureAccess(
    featureName: string, 
    userPlan: string = 'FREE'
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    const feature = SECURITY_FEATURES[featureName as keyof typeof SECURITY_FEATURES];
    
    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' };
    }

    if (!feature.enabled) {
      return { hasAccess: false, reason: 'Feature is disabled' };
    }

    if (feature.isPaidFeature && feature.requiredPlan) {
      const planHierarchy = {
        'FREE': 0,
        'BASIC': 1,
        'PREMIUM': 2,
        'ENTERPRISE': 3
      };

      const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
      const requiredPlanLevel = planHierarchy[feature.requiredPlan as keyof typeof planHierarchy] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return { 
          hasAccess: false, 
          reason: `Feature requires ${feature.requiredPlan} plan or higher` 
        };
      }
    }

    return { hasAccess: true };
  }

  /**
   * Toggle a feature flag
   */
  public async toggleFlag(name: string, isEnabled: boolean): Promise<any> {
    const feature = SECURITY_FEATURES[name as keyof typeof SECURITY_FEATURES];
    if (feature) {
      feature.enabled = isEnabled;
      return {
        name: feature.name,
        isEnabled: feature.enabled,
        displayName: feature.displayName
      };
    }
    throw new Error('Feature not found');
  }

  /**
   * Get security features configuration
   */
  public async getSecurityFeaturesConfig(userPlan: string): Promise<{
    [key: string]: { enabled: boolean; hasAccess: boolean; reason?: string }
  }> {
    const config: { [key: string]: { enabled: boolean; hasAccess: boolean; reason?: string } } = {};

    for (const [featureName, feature] of Object.entries(SECURITY_FEATURES)) {
      const access = await this.hasFeatureAccess(featureName, userPlan);
      
      config[featureName] = {
        enabled: feature.enabled,
        hasAccess: access.hasAccess,
        reason: access.reason
      };
    }

    return config;
  }

  /**
   * Get all features for admin panel
   */
  public async getAllFeatures(): Promise<any[]> {
    return Object.values(SECURITY_FEATURES);
  }
}

export const simplifiedFeatureFlagService = SimplifiedFeatureFlagService.getInstance();
