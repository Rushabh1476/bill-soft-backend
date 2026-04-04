/**
 * Send Birthday Greetings Job
 * 
 * Runs daily at 08:00 AM IST to check for customers whose birthday is today
 * and sends a warm Happy Birthday email from BillSoft to strengthen
 * customer-business bonds.
 */

import { PrismaClient } from '@prisma/client';
import { CronJob, CronJobConfig, CronJobContext, CronJobResult } from '../types';
import { sendMail } from '../../services/emailService/mailService';

const prisma = new PrismaClient();

export const sendBirthdayGreetingsConfig: CronJobConfig = {
    name: 'sendBirthdayGreetings',
    description: 'Send happy birthday emails to customers with birthdays today',
    schedule: '0 8 * * *', // Daily at 8:00 AM IST
    enabled: true,
    retryAttempts: 1,
    timeoutMs: 120000 // 2 minutes (may send many emails)
};

/**
 * Generate a beautiful, professional birthday email HTML
 */
function generateBirthdayEmailHtml(customerName: string, companyName: string): string {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e6ed; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
        <div style="font-size: 60px; margin-bottom: 10px;">🎂</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 0.5px;">Happy Birthday!</h1>
        <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">${customerName}</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 30px; background: #ffffff; text-align: center;">
        <p style="font-size: 18px; color: #333; line-height: 1.7; margin-bottom: 20px;">
          🎉 <strong>Wishing you a very Happy Birthday!</strong> 🎉
        </p>
        
        <p style="font-size: 15px; color: #555; line-height: 1.8; margin-bottom: 15px;">
          On this special day, we at <strong>${companyName}</strong> want to express our heartfelt gratitude 
          for being a valued part of our journey. Your trust and support mean the world to us.
        </p>

        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
          <p style="font-size: 16px; color: #5d4037; margin: 0; font-style: italic; line-height: 1.6;">
            "May this year bring you joy, success, and all the wonderful things you deserve. 
            Thank you for choosing us — we're proud to serve you!" 🌟
          </p>
        </div>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          Here's to another amazing year ahead! 🥳🎈
        </p>

        <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #f0f0f0;">
          <p style="color: #333; font-weight: 700; margin-bottom: 4px; font-size: 15px;">With warm regards,</p>
          <p style="color: #667eea; font-weight: 800; font-size: 17px; margin: 0;">${companyName}</p>
          <p style="color: #999; font-size: 12px; margin-top: 5px;">Powered by BillSoft India</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 15px; text-align: center;">
        <p style="color: #aaa; font-size: 11px; margin: 0;">
          This is an automated birthday greeting from ${companyName} via BillSoft. 🎂
        </p>
      </div>
    </div>
  `;
}

export const sendBirthdayGreetingsJob: CronJob = {
    config: sendBirthdayGreetingsConfig,

    async execute(context: CronJobContext): Promise<CronJobResult> {
        const startTime = Date.now();
        let emailsSent = 0;
        let emailsFailed = 0;

        try {
            console.log(`🎂 [${context.jobName}] Starting birthday greetings check...`);

            const today = new Date();
            const currentMonth = today.getMonth() + 1; // JS months are 0-indexed
            const currentDay = today.getDate();

            // Find all customers who have a DOB set
            const allCustomersWithDob = await prisma.customer.findMany({
                where: {
                    dob: { not: null },
                    email: { not: null }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    dob: true,
                    userId: true,
                    user: {
                        select: {
                            companyName: true,
                            email: true
                        }
                    }
                }
            });

            // Filter by month and day (birthday match regardless of year)
            const birthdayCustomers = allCustomersWithDob.filter(customer => {
                if (!customer.dob) return false;
                const dob = new Date(customer.dob);
                return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
            });

            if (birthdayCustomers.length === 0) {
                console.log(`✅ [${context.jobName}] No customer birthdays today (${currentDay}/${currentMonth})`);
                return {
                    success: true,
                    recordsProcessed: 0,
                    duration: Date.now() - startTime,
                    metadata: {
                        message: 'No birthdays today',
                        date: `${currentDay}/${currentMonth}`
                    }
                };
            }

            console.log(`🎉 [${context.jobName}] Found ${birthdayCustomers.length} customer(s) with birthdays today!`);

            // Send birthday emails
            for (const customer of birthdayCustomers) {
                if (!customer.email) continue;

                const companyName = customer.user?.companyName || 'BillSoft Store';

                try {
                    const result = await sendMail({
                        to: customer.email,
                        subject: `🎂 Happy Birthday, ${customer.name}! — From ${companyName}`,
                        html: generateBirthdayEmailHtml(customer.name, companyName)
                    });

                    if (result.success) {
                        emailsSent++;
                        console.log(`  🎂 Birthday email sent to ${customer.name} (${customer.email})`);
                    } else {
                        emailsFailed++;
                        console.error(`  ❌ Failed to send birthday email to ${customer.email}: ${result.error}`);
                    }
                } catch (emailErr: any) {
                    emailsFailed++;
                    console.error(`  ❌ Error sending birthday email to ${customer.email}:`, emailErr.message);
                }

                // Small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`✅ [${context.jobName}] Birthday greetings done: ${emailsSent} sent, ${emailsFailed} failed`);

            return {
                success: true,
                recordsProcessed: emailsSent,
                duration: Date.now() - startTime,
                metadata: {
                    birthdaysFound: birthdayCustomers.length,
                    emailsSent,
                    emailsFailed,
                    date: `${currentDay}/${currentMonth}`,
                    customers: birthdayCustomers.map(c => c.name).slice(0, 10)
                }
            };

        } catch (error: any) {
            console.error(`❌ [${context.jobName}] Error:`, error.message);

            return {
                success: false,
                recordsProcessed: emailsSent,
                duration: Date.now() - startTime,
                errorMessage: error.message,
                metadata: { emailsSent, emailsFailed }
            };
        } finally {
            await prisma.$disconnect();
        }
    }
};
