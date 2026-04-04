// Simplified feature flag service without database dependencies

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum FeatureFlagStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  BETA = 'BETA'
}

export interface FeatureFlag {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isEnabled: boolean;
  isPaidFeature: boolean;
  requiredPlan: PlanType | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory data store for demo
const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: '1',
    name: 'two_factor_auth',
    displayName: '2FA Authentication',
    description: 'Time-based One-Time Password authentication',
    isEnabled: false,
    isPaidFeature: true,
    requiredPlan: PlanType.BASIC,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'oauth_integration',
    displayName: 'OAuth Integration',
    description: 'Google and GitHub OAuth authentication',
    isEnabled: false,
    isPaidFeature: true,
    requiredPlan: PlanType.BASIC,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'role_based_access',
    displayName: 'Role-Based Access Control',
    description: 'Advanced user roles and permissions',
    isEnabled: false,
    isPaidFeature: true,
    requiredPlan: PlanType.PREMIUM,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'api_key_management',
    displayName: 'API Key Management',
    description: 'Generate and manage API keys',
    isEnabled: false,
    isPaidFeature: true,
    requiredPlan: PlanType.PREMIUM,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'security_audit_logs',
    displayName: 'Security Audit Logs',
    description: 'Comprehensive security event logging',
    isEnabled: true,
    isPaidFeature: true,
    requiredPlan: PlanType.ENTERPRISE,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export interface FeatureFlagConfig {
  name: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  isPaidFeature: boolean;
  requiredPlan?: PlanType;
  metadata?: any;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if a feature is available for a given plan
   */
  public async hasFeatureAccess(
    featureName: string, 
    userPlan: PlanType = PlanType.FREE
  ): Promise<{ hasAccess: boolean; reason?: string }> {
    const feature = FEATURE_FLAGS.find(f => f.name === featureName);
    
    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' };
    }

    if (!feature.isEnabled) {
      return { hasAccess: false, reason: 'Feature is disabled' };
    }

    if (feature.isPaidFeature && feature.requiredPlan) {
      const planHierarchy = {
        [PlanType.FREE]: 0,
        [PlanType.BASIC]: 1,
        [PlanType.PREMIUM]: 2,
        [PlanType.ENTERPRISE]: 3
      };

      const userPlanLevel = planHierarchy[userPlan] || 0;
      const requiredPlanLevel = planHierarchy[feature.requiredPlan] || 0;

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
  public async toggleFlag(name: string, isEnabled: boolean): Promise<FeatureFlag> {
    const featureIndex = FEATURE_FLAGS.findIndex(f => f.name === name);
    
    if (featureIndex === -1) {
      throw new Error('Feature not found');
    }

    FEATURE_FLAGS[featureIndex].isEnabled = isEnabled;
    FEATURE_FLAGS[featureIndex].updatedAt = new Date();
    
    return FEATURE_FLAGS[featureIndex];
  }

  /**
   * Get a specific feature flag
   */
  public async getFlag(name: string): Promise<FeatureFlag | null> {
    const feature = FEATURE_FLAGS.find(f => f.name === name);
    return feature || null;
  }

  /**
   * Get all feature flags
   */
  public async getAllFlags(): Promise<FeatureFlag[]> {
    return [...FEATURE_FLAGS];
  }

  /**
   * Create or update a feature flag
   */
  public async upsertFlag(flagConfig: FeatureFlagConfig): Promise<FeatureFlag> {
    const existingIndex = FEATURE_FLAGS.findIndex(f => f.name === flagConfig.name);
    
    const flag: FeatureFlag = {
      id: existingIndex !== -1 ? FEATURE_FLAGS[existingIndex].id : Date.now().toString(),
      name: flagConfig.name,
      displayName: flagConfig.displayName,
      description: flagConfig.description || null,
      isEnabled: flagConfig.isEnabled,
      isPaidFeature: flagConfig.isPaidFeature,
      requiredPlan: flagConfig.requiredPlan || null,
      metadata: flagConfig.metadata ? JSON.stringify(flagConfig.metadata) : null,
      createdAt: existingIndex !== -1 ? FEATURE_FLAGS[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIndex !== -1) {
      FEATURE_FLAGS[existingIndex] = flag;
    } else {
      FEATURE_FLAGS.push(flag);
    }

    return flag;
  }

  /**
   * Get security features configuration for a user plan
   */
  public async getSecurityFeaturesConfig(userPlan: PlanType): Promise<{
    [key: string]: { enabled: boolean; hasAccess: boolean; reason?: string }
  }> {
    const config: { [key: string]: { enabled: boolean; hasAccess: boolean; reason?: string } } = {};

    for (const feature of FEATURE_FLAGS) {
      const access = await this.hasFeatureAccess(feature.name, userPlan);
      
      config[feature.name] = {
        enabled: feature.isEnabled,
        hasAccess: access.hasAccess,
        reason: access.reason
      };
    }

    return config;
  }

  /**
   * Check if user plan supports a feature
   */
  public isPlanEligible(feature: FeatureFlag, userPlan: PlanType): boolean {
    if (!feature.isPaidFeature) return true;
    if (!feature.requiredPlan) return true;

    const planHierarchy = {
      [PlanType.FREE]: 0,
      [PlanType.BASIC]: 1,
      [PlanType.PREMIUM]: 2,
      [PlanType.ENTERPRISE]: 3
    };

    const userPlanLevel = planHierarchy[userPlan] || 0;
    const requiredPlanLevel = planHierarchy[feature.requiredPlan] || 0;

    return userPlanLevel >= requiredPlanLevel;
  }

  /**
   * Get plan upgrade suggestions for locked features
   */
  public async getPlanUpgradeSuggestions(userPlan: PlanType): Promise<{
    currentPlan: PlanType;
    recommendedPlan: PlanType | null;
    lockedFeatures: FeatureFlag[];
    availableFeatures: FeatureFlag[];
  }> {
    const allFeatures = await this.getAllFlags();
    const lockedFeatures = allFeatures.filter(f => !this.isPlanEligible(f, userPlan));
    const availableFeatures = allFeatures.filter(f => this.isPlanEligible(f, userPlan));

    let recommendedPlan: PlanType | null = null;
    if (lockedFeatures.length > 0) {
      const plans = [PlanType.BASIC, PlanType.PREMIUM, PlanType.ENTERPRISE];
      recommendedPlan = plans.find(plan => 
        lockedFeatures.some(f => this.isPlanEligible(f, plan))
      ) || null;
    }

    return {
      currentPlan: userPlan,
      recommendedPlan,
      lockedFeatures,
      availableFeatures
    };
  }
}

export const featureFlagService = FeatureFlagService.getInstance();
