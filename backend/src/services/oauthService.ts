import prisma from '../lib/prisma';
import { PrismaClient } from '@prisma/client';
import { featureFlagService } from './featureFlagService';

// Type assertion to ensure Prisma client has all models
const typedPrisma = prisma as PrismaClient;

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export class OAuthService {
  private static instance: OAuthService;
  private readonly googleClientId = process.env.GOOGLE_CLIENT_ID;
  private readonly googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  private readonly redirectUri = process.env.GOOGLE_REDIRECT_URI;

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Generate Google OAuth URL
   */
  public generateGoogleAuthUrl(): string {
    const scope = 'openid email profile';
    const state = this.generateState();
    
    const params = new URLSearchParams({
      client_id: this.googleClientId || '',
      redirect_uri: this.redirectUri || '',
      response_type: 'code',
      scope,
      state,
      access_type: 'offline',
      prompt: 'select_account'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    id_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.googleClientId || '',
        client_secret: this.googleClientSecret || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri || '',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return await response.json();
  }

  /**
   * Get user info from Google
   */
  public async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to get user info from Google');
    }

    return await response.json();
  }

  /**
   * Handle Google OAuth login/signup
   */
  public async handleGoogleAuth(code: string): Promise<{
    user: any;
    token: string;
    isNewUser: boolean;
  }> {
    try {
      // Check if OAuth is enabled
      const access = await featureFlagService.hasFeatureAccess('oauth_integration');
      if (!access.hasAccess) {
        throw new Error('OAuth integration is not enabled');
      }

      // Exchange code for token
      const tokenData = await this.exchangeCodeForToken(code);
      
      // Get user info from Google
      const googleUser = await this.getGoogleUserInfo(tokenData.access_token);

      if (!googleUser.verified_email) {
        throw new Error('Email not verified with Google');
      }

      // Check if user already exists
      let user = await typedPrisma.user.findFirst({
        where: {
          OR: [
            { email: googleUser.email },
            { googleId: googleUser.id }
          ]
        }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user (auto-provisioning)
        const autoProvision = await this.getAutoProvisionSetting();
        
        if (!autoProvision) {
          throw new Error('Auto-provisioning is disabled. Please contact administrator.');
        }

        user = await typedPrisma.user.create({
          data: {
            email: googleUser.email,
            password: '', // OAuth users don't need password
            companyName: googleUser.name,
            googleId: googleUser.id,
            oauthProvider: 'google',
            isActive: true,
            planType: 'FREE'
          }
        });

        isNewUser = true;

        // Log security event
        await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', 'New user created via Google OAuth');
      } else {
        // Update existing user with Google ID if not set
        if (!user.googleId) {
          user = await typedPrisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.id,
              oauthProvider: 'google'
            }
          });
        }

        // Update last login
        await typedPrisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        // Log security event
        await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', 'User logged in via Google OAuth');
      }

      // Generate JWT token
      const token = this.generateJWTToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          companyName: user.companyName,
          planType: user.planType
        },
        token,
        isNewUser
      };

    } catch (error: any) {
      console.error('Google OAuth error:', error);
      
      // Log failed attempt
      await this.logSecurityEvent(null, 'LOGIN_FAILED', `Google OAuth failed: ${error?.message || 'Unknown error'}`);
      
      throw error;
    }
  }

  /**
   * Unlink Google account
   */
  public async unlinkGoogleAccount(userId: string): Promise<void> {
    await typedPrisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        oauthProvider: null
      }
    });

    await this.logSecurityEvent(userId, 'ACCOUNT_UNLINKED', 'Google account unlinked');
  }

  /**
   * Check if user has linked Google account
   */
  public async hasLinkedGoogleAccount(userId: string): Promise<boolean> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true }
    });

    return !!user?.googleId;
  }

  /**
   * Get OAuth settings from organization settings
   */
  private async getAutoProvisionSetting(): Promise<boolean> {
    const settings = await typedPrisma.organizationSettings.findFirst();
    return settings?.oauthEnabled || false;
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate JWT token for user
   */
  private generateJWTToken(user: any): string {
    // This should use the same JWT logic as your existing auth
    const jwt = require('jsonwebtoken');
    
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        planType: user.planType
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    userId: string | null,
    eventType: string,
    description: string
  ): Promise<void> {
    try {
      await typedPrisma.securityLog.create({
        data: {
          userId,
          eventType: eventType as any,
          description,
          success: !eventType.includes('FAILED')
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export const oauthService = OAuthService.getInstance();
