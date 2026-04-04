/**
 * Cron Job Scheduler for BillSoft
 * 
 * Registers and manages all scheduled jobs
 */

import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';
import { CronJob, CronJobContext, JobStatus, CronJobResult } from './types';

// Import job definitions
import { markOverdueBillsJob } from './jobs/markOverdueBills';
import { aggregateDailyRevenueJob } from './jobs/aggregateDailyRevenue';
import { cleanupExpiredSessionsJob } from './jobs/cleanupExpiredSessions';
import { sendBirthdayGreetingsJob } from './jobs/sendBirthdayGreetings';

const prisma = new PrismaClient();

class CronScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private registeredJobs: CronJob[] = [];

  constructor() {
    // Register all jobs
    this.registerJob(markOverdueBillsJob);
    this.registerJob(aggregateDailyRevenueJob);
    this.registerJob(cleanupExpiredSessionsJob);
    this.registerJob(sendBirthdayGreetingsJob);
  }

  registerJob(job: CronJob) {
    this.registeredJobs.push(job);

    if (!job.config.enabled) {
      console.log(`⏸️  Job ${job.config.name} is disabled, skipping registration`);
      return;
    }

    console.log(`📅 Registering job: ${job.config.name}`);
    console.log(`   Schedule: ${job.config.schedule}`);
    console.log(`   Description: ${job.config.description}`);

    const cronJob = cron.schedule(
      job.config.schedule,
      () => this.executeJob(job),
      {
        scheduled: false,
        timezone: 'Asia/Kolkata'
      }
    );

    this.jobs.set(job.config.name, cronJob);
  }

  async executeJob(job: CronJob) {
    const jobLogId = await this.logJobStart(job.config.name);

    const context: CronJobContext = {
      startTime: new Date(),
      jobName: job.config.name,
      recordsProcessed: 0,
      metadata: {}
    };

    try {
      console.log(`🚀 Executing job: ${job.config.name}`);

      const result = await this.executeWithTimeout(job, context);

      await this.logJobComplete(jobLogId, 'SUCCESS', result);

      console.log(`✅ Job ${job.config.name} completed successfully`);
      console.log(`   Duration: ${(result as CronJobResult).duration}ms`);
      console.log(`   Records processed: ${(result as CronJobResult).recordsProcessed}`);

    } catch (error: any) {
      console.error(`❌ Job ${job.config.name} failed:`, error.message);

      await this.logJobComplete(jobLogId, 'FAILED', {
        success: false,
        recordsProcessed: 0,
        duration: Date.now() - context.startTime.getTime(),
        errorMessage: error.message
      });

      // TODO: Add retry logic based on job.config.retryAttempts
    }
  }

  private async executeWithTimeout(job: CronJob, context: CronJobContext) {
    const timeoutMs = job.config.timeoutMs || 30000;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Job ${job.config.name} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      job.execute(context)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async logJobStart(jobName: string): Promise<string> {
    try {
      const log = await prisma.cronJobLog.create({
        data: {
          jobName,
          status: 'RUNNING',
          startedAt: new Date()
        }
      });
      return log.id;
    } catch (error) {
      console.error('Failed to log job start:', error);
      return 'unknown';
    }
  }

  private async logJobComplete(jobLogId: string, status: JobStatus, result: any) {
    try {
      if (jobLogId === 'unknown') return;

      await prisma.cronJobLog.update({
        where: { id: jobLogId },
        data: {
          status,
          completedAt: new Date(),
          duration: result.duration,
          recordsProcessed: result.recordsProcessed || 0,
          errorMessage: result.errorMessage || null,
          metadata: result.metadata ? JSON.stringify(result.metadata) : null
        }
      });
    } catch (error) {
      console.error('Failed to log job completion:', error);
    }
  }

  startAll() {
    console.log(`🚀 Starting ${this.jobs.size} cron jobs...`);

    this.jobs.forEach((cronJob, jobName) => {
      cronJob.start();
      console.log(`✅ Started job: ${jobName}`);
    });

    console.log('🎉 All cron jobs started successfully!');
  }

  stopAll() {
    console.log('🛑 Stopping all cron jobs...');

    this.jobs.forEach((cronJob, jobName) => {
      cronJob.stop();
      console.log(`🛑 Stopped job: ${jobName}`);
    });

    console.log('✅ All cron jobs stopped');
  }

  getJobStatus(): Array<{ name: string, running: boolean, lastDate: Date | null, nextDate: Date | null }> {
    return Array.from(this.jobs.entries()).map(([name, cronJob]) => ({
      name,
      running: true, // Assume running if registered
      lastDate: null as Date | null, // node-cron doesn't provide this info
      nextDate: null as Date | null  // node-cron doesn't provide this info easily
    }));
  }

  async runJobManually(jobName: string) {
    const job = this.registeredJobs.find(j => j.config.name === jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    console.log(`🔧 Running job manually: ${jobName}`);
    await this.executeJob(job);
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();

// Graceful shutdown handling
const handleShutdown = () => {
  console.log('🛑 Shutting down cron scheduler...');
  cronScheduler.stopAll();
  prisma.$disconnect();
  // Exit after a short delay to allow cleanup
  setTimeout(() => {
    // process.exit(0);
  }, 1000);
};

// Export for use in other modules
export { CronScheduler };
