/**
 * Aggregate Daily Revenue Job
 * 
 * Runs daily at 00:10 to aggregate revenue metrics
 * Creates/updates DailyMetric records for analytics
 */

import { PrismaClient } from '@prisma/client';
import { CronJob, CronJobConfig, CronJobContext, CronJobResult } from '../types';

const prisma = new PrismaClient();

export const aggregateDailyRevenueConfig: CronJobConfig = {
  name: 'aggregateDailyRevenue',
  description: 'Aggregate daily revenue and metrics',
  schedule: '10 0 * * *', // Daily at 00:10 AM
  enabled: true,
  retryAttempts: 2,
  timeoutMs: 60000 // 60 seconds
};

export const aggregateDailyRevenueJob: CronJob = {
  config: aggregateDailyRevenueConfig,
  
  async execute(context: CronJobContext): Promise<CronJobResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [${context.jobName}] Starting daily revenue aggregation...`);
      
      // Calculate yesterday's date for aggregation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const todayStart = new Date(yesterday);
      todayStart.setDate(todayStart.getDate() + 1);
      
      console.log(`   Aggregating data for: ${yesterday.toISOString().split('T')[0]}`);
      
      // Check if we already have metrics for this date
      const existingMetric = await prisma.dailyMetric.findUnique({
        where: {
          date: yesterday
        }
      });
      
      // Get revenue from PAID bills
      const paidBills = await prisma.bill.findMany({
        where: {
          status: 'PAID',
          updatedAt: {
            gte: yesterday,
            lt: todayStart
          }
        }
      });
      
      const revenue = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      const billsPaid = paidBills.length;
      
      // Get overdue bills count
      const overdueBills = await prisma.bill.count({
        where: {
          status: 'OVERDUE',
          createdAt: {
            gte: yesterday,
            lt: todayStart
          }
        }
      });
      
      // Get new customers
      const newCustomers = await prisma.customer.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: todayStart
          }
        }
      });
      
      // Get new products
      const newProducts = await prisma.product.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: todayStart
          }
        }
      });
      
      // Get active users (users who created bills or logged in)
      const activeUsers = await prisma.user.count({
        where: {
          OR: [
            {
              bills: {
                some: {
                  createdAt: {
                    gte: yesterday,
                    lt: todayStart
                  }
                }
              }
            },
            {
              lastLoginAt: {
                gte: yesterday,
                lt: todayStart
              }
            }
          ]
        }
      });
      
      const metricData = {
        date: yesterday,
        revenue,
        billsPaid,
        billsOverdue: overdueBills,
        newCustomers,
        newProducts,
        activeUsers
      };
      
      if (existingMetric) {
        // Update existing metric
        await prisma.dailyMetric.update({
          where: { id: existingMetric.id },
          data: metricData
        });
        console.log(`✅ [${context.jobName}] Updated existing metric for ${yesterday.toISOString().split('T')[0]}`);
      } else {
        // Create new metric
        await prisma.dailyMetric.create({
          data: metricData
        });
        console.log(`✅ [${context.jobName}] Created new metric for ${yesterday.toISOString().split('T')[0]}`);
      }
      
      console.log(`   Revenue: ₹${revenue.toFixed(2)}`);
      console.log(`   Bills paid: ${billsPaid}`);
      console.log(`   New customers: ${newCustomers}`);
      console.log(`   Active users: ${activeUsers}`);
      
      return {
        success: true,
        recordsProcessed: 1,
        duration: Date.now() - startTime,
        metadata: {
          date: yesterday.toISOString().split('T')[0],
          revenue,
          billsPaid,
          newCustomers,
          newProducts,
          activeUsers,
          isUpdate: !!existingMetric
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
