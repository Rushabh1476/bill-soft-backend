import { PrismaClient } from '@prisma/client';

/**
 * Interface Segregation Principle - Admin Settings interfaces
 * Each interface has a specific responsibility
 */

export interface IInvoiceTemplateService {
  getDefaultTemplate(): Promise<string>;
  setDefaultTemplate(templateId: string): Promise<void>;
  getAvailableTemplates(): Promise<InvoiceTemplate[]>;
}

export interface IOrganizationSettingsService {
  getOrganizationSettings(): Promise<OrganizationSettings>;
  updateOrganizationSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings>;
}

export interface IAdminSettingsService extends IInvoiceTemplateService, IOrganizationSettingsService {
  getAllSettings(): Promise<AdminSettingsData>;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string;
  isDefault?: boolean;
}

export interface OrganizationSettings {
  id: string;
  defaultInvoiceTemplateId?: string;
  twoFactorRequired: boolean;
  oauthEnabled: boolean;
  rbacEnabled: boolean;
  apiKeysEnabled: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

export interface AdminSettingsData {
  organization: OrganizationSettings;
  defaultTemplate: string;
  availableTemplates: InvoiceTemplate[];
}

/**
 * Single Responsibility Principle - Template Service
 * Handles only invoice template-related operations
 */
export class InvoiceTemplateService implements IInvoiceTemplateService {
  constructor(private prisma: PrismaClient) {}

  async getDefaultTemplate(): Promise<string> {
    try {
      const settings = await this.prisma.organizationSettings.findFirst();
      return settings?.defaultInvoiceTemplateId || 'standard';
    } catch (error) {
      console.error('Error getting default template:', error);
      return 'standard'; // Fallback to standard template
    }
  }

  async setDefaultTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.organizationSettings.upsert({
        where: { id: 'default' },
        update: { defaultInvoiceTemplateId: templateId },
        create: { 
          id: 'default', 
          defaultInvoiceTemplateId: templateId 
        }
      });
    } catch (error) {
      console.error('Error setting default template:', error);
      throw new Error('Failed to set default template');
    }
  }

  async getAvailableTemplates(): Promise<InvoiceTemplate[]> {
    // This could be fetched from database in the future
    // For now, return static templates
    const currentDefault = await this.getDefaultTemplate();
    
    return [
      {
        id: 'standard',
        name: 'Standard Template',
        description: 'Clean and professional standard invoice template',
        preview: '/templates/previews/standard.png',
        isDefault: currentDefault === 'standard'
      },
      {
        id: 'modern',
        name: 'Modern Template',
        description: 'Contemporary design with enhanced visual appeal',
        preview: '/templates/previews/modern.png',
        isDefault: currentDefault === 'modern'
      },
      {
        id: 'minimal',
        name: 'Minimal Template',
        description: 'Simple and clean design for minimal look',
        preview: '/templates/previews/minimal.png',
        isDefault: currentDefault === 'minimal'
      },
      {
        id: 'professional',
        name: 'Professional Template',
        description: 'Formal business template with corporate styling',
        preview: '/templates/previews/professional.png',
        isDefault: currentDefault === 'professional'
      }
    ];
  }
}

/**
 * Single Responsibility Principle - Organization Settings Service
 * Handles only organization-wide settings operations
 */
export class OrganizationSettingsService implements IOrganizationSettingsService {
  constructor(private prisma: PrismaClient) {}

  async getOrganizationSettings(): Promise<OrganizationSettings> {
    try {
      let settings = await this.prisma.organizationSettings.findFirst();
      
      // If no settings exist, create default ones
      if (!settings) {
        settings = await this.prisma.organizationSettings.create({
          data: {
            id: 'default',
            defaultInvoiceTemplateId: 'standard'
          }
        });
      }

      return {
        id: settings.id,
        defaultInvoiceTemplateId: settings.defaultInvoiceTemplateId || 'standard',
        twoFactorRequired: settings.twoFactorRequired,
        oauthEnabled: settings.oauthEnabled,
        rbacEnabled: settings.rbacEnabled,
        apiKeysEnabled: settings.apiKeysEnabled,
        passwordMinLength: settings.passwordMinLength,
        passwordRequireUppercase: settings.passwordRequireUppercase,
        passwordRequireNumbers: settings.passwordRequireNumbers,
        passwordRequireSpecial: settings.passwordRequireSpecial,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        maxConcurrentSessions: settings.maxConcurrentSessions,
        maxFailedAttempts: settings.maxFailedAttempts,
        lockoutDurationMinutes: settings.lockoutDurationMinutes
      };
    } catch (error) {
      console.error('Error getting organization settings:', error);
      throw new Error('Failed to get organization settings');
    }
  }

  async updateOrganizationSettings(settingsUpdate: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    try {
      const updated = await this.prisma.organizationSettings.upsert({
        where: { id: settingsUpdate.id || 'default' },
        update: {
          ...settingsUpdate,
          updatedAt: new Date()
        },
        create: {
          id: 'default',
          ...settingsUpdate
        }
      });

      return await this.getOrganizationSettings();
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw new Error('Failed to update organization settings');
    }
  }
}

/**
 * Dependency Inversion Principle - Main Admin Settings Service
 * Depends on abstractions (interfaces) rather than concrete implementations
 * Composition over inheritance - uses other services rather than extending them
 */
export class AdminSettingsService implements IAdminSettingsService {
  private templateService: IInvoiceTemplateService;
  private organizationService: IOrganizationSettingsService;

  constructor(prisma: PrismaClient) {
    // Dependency injection - services are injected rather than created internally
    this.templateService = new InvoiceTemplateService(prisma);
    this.organizationService = new OrganizationSettingsService(prisma);
  }

  // Delegate to template service
  async getDefaultTemplate(): Promise<string> {
    return this.templateService.getDefaultTemplate();
  }

  async setDefaultTemplate(templateId: string): Promise<void> {
    return this.templateService.setDefaultTemplate(templateId);
  }

  async getAvailableTemplates(): Promise<InvoiceTemplate[]> {
    return this.templateService.getAvailableTemplates();
  }

  // Delegate to organization service
  async getOrganizationSettings(): Promise<OrganizationSettings> {
    return this.organizationService.getOrganizationSettings();
  }

  async updateOrganizationSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    return this.organizationService.updateOrganizationSettings(settings);
  }

  // Aggregate method that combines all admin settings
  async getAllSettings(): Promise<AdminSettingsData> {
    try {
      const [organization, defaultTemplate, availableTemplates] = await Promise.all([
        this.getOrganizationSettings(),
        this.getDefaultTemplate(),
        this.getAvailableTemplates()
      ]);

      return {
        organization,
        defaultTemplate,
        availableTemplates
      };
    } catch (error) {
      console.error('Error getting all admin settings:', error);
      throw new Error('Failed to get admin settings');
    }
  }
}

/**
 * Factory function for creating AdminSettingsService
 * Open/Closed Principle - easy to extend without modifying existing code
 */
export function createAdminSettingsService(prisma: PrismaClient): IAdminSettingsService {
  return new AdminSettingsService(prisma);
}

/**
 * Validation utilities following Single Responsibility Principle
 */
export class AdminSettingsValidator {
  static validateTemplateId(templateId: string): boolean {
    const validTemplates = ['standard', 'modern', 'minimal', 'professional'];
    return validTemplates.includes(templateId);
  }

  static validatePasswordPolicy(policy: Partial<OrganizationSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (policy.passwordMinLength && (policy.passwordMinLength < 6 || policy.passwordMinLength > 50)) {
      errors.push('Password minimum length must be between 6 and 50 characters');
    }

    if (policy.sessionTimeoutMinutes && (policy.sessionTimeoutMinutes < 15 || policy.sessionTimeoutMinutes > 10080)) {
      errors.push('Session timeout must be between 15 minutes and 7 days');
    }

    if (policy.maxConcurrentSessions && (policy.maxConcurrentSessions < 1 || policy.maxConcurrentSessions > 50)) {
      errors.push('Max concurrent sessions must be between 1 and 50');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
