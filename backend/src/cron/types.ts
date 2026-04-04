/**
 * Cron Job Types and Interfaces
 */

export interface CronJobConfig {
  name: string;
  description: string;
  schedule: string; // Cron expression
  enabled: boolean;
  retryAttempts?: number;
  timeoutMs?: number;
}

export interface CronJobContext {
  startTime: Date;
  jobName: string;
  recordsProcessed: number;
  metadata: Record<string, any>;
}

export interface CronJobResult {
  success: boolean;
  recordsProcessed: number;
  duration: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CronJob {
  config: CronJobConfig;
  execute(context: CronJobContext): Promise<CronJobResult>;
}

export type JobStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
