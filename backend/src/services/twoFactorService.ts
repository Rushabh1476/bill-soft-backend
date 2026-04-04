import * as crypto from 'crypto';
import prisma from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

// Type assertion to ensure Prisma client has all models
const typedPrisma = prisma as PrismaClient;

export class TwoFactorService {
  private static instance: TwoFactorService;

  public static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  /**
   * Generate a base32 secret for TOTP
   */
  private generateBase32Secret(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return secret;
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Enable 2FA for a user
   */
  public async enable2FA(userId: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const secret = this.generateBase32Secret();
    const backupCodes = this.generateBackupCodes();

    // Generate QR code URL for authenticator apps
    const serviceName = 'BillSoft';
    const accountName = user.email;
    const qrCodeUrl = `otpauth://totp/${serviceName}:${accountName}?secret=${secret}&issuer=${serviceName}`;

    // Store the secret and backup codes (hashed) in database
    const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

    await typedPrisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
        twoFactorEnabled: false // Will be enabled after verification
      }
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify 2FA setup with TOTP token
   */
  public async verify2FASetup(userId: string, token: string): Promise<boolean> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    const isValid = this.verifyTOTP(user.twoFactorSecret, token);

    if (isValid) {
      // Enable 2FA
      await typedPrisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });

      // Log security event
      await this.logSecurityEvent(userId, 'TWO_FACTOR_ENABLED', 'User enabled 2FA');
    }

    return isValid;
  }

  /**
   * Verify TOTP token during login
   */
  public async verifyLoginToken(userId: string, token: string): Promise<boolean> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Try TOTP verification first
    const isValidTOTP = this.verifyTOTP(user.twoFactorSecret, token);
    
    if (isValidTOTP) {
      await this.logSecurityEvent(userId, 'TWO_FACTOR_SUCCESS', 'Successful 2FA login');
      return true;
    }

    // Try backup code verification
    const isValidBackupCode = await this.verifyBackupCode(userId, token);
    
    if (isValidBackupCode) {
      await this.logSecurityEvent(userId, 'TWO_FACTOR_SUCCESS', 'Successful 2FA login with backup code');
      return true;
    }

    await this.logSecurityEvent(userId, 'TWO_FACTOR_FAILED', 'Failed 2FA login attempt');
    return false;
  }

  /**
   * Disable 2FA for a user
   */
  public async disable2FA(userId: string): Promise<void> {
    await typedPrisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    });

    await this.logSecurityEvent(userId, 'TWO_FACTOR_DISABLED', 'User disabled 2FA');
  }

  /**
   * Generate new backup codes
   */
  public async generateNewBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

    await typedPrisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes)
      }
    });

    return backupCodes;
  }

  /**
   * Verify TOTP token using time-based algorithm
   */
  private verifyTOTP(secret: string, token: string, window: number = 1): boolean {
    const timeStep = 30; // 30 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(currentTime / timeStep);

    // Check current time step and previous/next steps for clock drift
    for (let i = -window; i <= window; i++) {
      const stepTime = currentStep + i;
      const expectedToken = this.generateTOTP(secret, stepTime);
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP token for given time step
   */
  private generateTOTP(secret: string, timeStep: number): string {
    const secretBuffer = this.base32Decode(secret);
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigUInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const truncated = hash.readUInt32BE(offset) & 0x7fffffff;
    const token = (truncated % 1000000).toString().padStart(6, '0');

    return token;
  }

  /**
   * Decode base32 string to buffer
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (const char of encoded.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Hash backup code for secure storage
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify and consume backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorBackupCodes) {
      return false;
    }

    const hashedCode = this.hashBackupCode(code);
    const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);

    const codeIndex = backupCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await typedPrisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      }
    });

    return true;
  }

  /**
   * Check if user has 2FA enabled
   */
  public async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Get 2FA status for user
   */
  public async get2FAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await typedPrisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        twoFactorBackupCodes: true
      }
    });

    let backupCodesRemaining = 0;
    if (user?.twoFactorBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      backupCodesRemaining = backupCodes.length;
    }

    return {
      enabled: user?.twoFactorEnabled || false,
      backupCodesRemaining
    };
  }

  /**
   * Log security events
   */
  private async logSecurityEvent(
    userId: string, 
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

export const twoFactorService = TwoFactorService.getInstance();
