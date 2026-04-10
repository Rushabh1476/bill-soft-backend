/**
 * Cleanup Expired Sessions Job
 * 
 * Runs every hour to clean up expired sessions
 * Removes sessions where expires_at < now OR is_active = false
 */

import { PrismaClient } from '@prisma/client';
import { CronJob, CronJobConfig, CronJobContext, CronJobResult } from '../types';

const prisma = new PrismaClient();

export const cleanupExpiredSessionsConfig: CronJobConfig = {
  name: 'cleanupExpiredSessions',
  description: 'Clean up expired user sessions',
  schedule: '0 * * * *', // Every hour
  enabled: true,
  retryAttempts: 1,
  timeoutMs: 30000 // 30 seconds
};

export const cleanupExpiredSessionsJob: CronJob = {
  config: cleanupExpiredSessionsConfig,
  
  async execute(context: CronJobContext): Promise<CronJobResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${context.jobName}] Starting expired sessions cleanup...`);
      
      // Delete expired sessions
      const deleteResult = await prisma.userSession.deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lt: new Date()
              }
            },
            {
              isActive: false
            }
          ]
        }
      });
      
      console.log(`✅ [${context.jobName}] Deleted ${deleteResult.count} expired sessions`);
      
      // Log security event for audit
      if (deleteResult.count > 0) {
        await prisma.securityLog.create({
          data: {
            eventType: 'SESSION_TERMINATED',
            description: `Cleaned up ${deleteResult.count} expired sessions`,
            success: true,
            metadata: JSON.stringify({
              sessionsDeleted: deleteResult.count,
              cleanupTime: new Date().toISOString()
            })
          }
        });
      }
      
      return {
        success: true,
        recordsProcessed: deleteResult.count,
        duration: Date.now() - startTime,
        metadata: {
          sessionsDeleted: deleteResult.count
        }
      };
      
    } catch (error: any) {
      console.error(`❌ [${context.jobName}] Error:`, error.message);
      
      return {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - startTime,
        errorMessage: error.message
      };
    } finally {
      await prisma.$disconnect();
    }
  }
};
