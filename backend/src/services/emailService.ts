/**
 * Email Service Entry Point
 * This file serves as a bridge to the new modular email service in the /emailService directory.
 */

import * as emailNew from './emailService/index';
import prisma from '../lib/prisma';
import nodemailer from 'nodemailer';
import { getBaseUrl, getFrontendUrl } from '../lib/baseUrl';

// Re-export new functions
export * from './emailService/index';

/**
 * COMPATIBILITY WRAPPER: generateInvoicePdfBuffer
 * Maps the old function signature to the new modular pdfService
 */
export async function generateInvoicePdfBuffer(bill: any): Promise<Buffer> {
  // Fetch user/company info for the PDF
  const user = await prisma.user.findUnique({
    where: { id: bill.userId }
  });

  const invoiceData: emailNew.InvoiceData = {
    billNumber: bill.billNumber || bill.id.slice(0, 8),
    customerName: bill.customerName,
    customerEmail: bill.customerEmail || bill.customer?.email,
    customerPhone: bill.customer?.phone,
    items: bill.items.map((item: any) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    })),
    subtotal: bill.subtotal,
    taxAmount: bill.taxAmount,
    totalAmount: bill.totalAmount,
    notes: bill.notes,
    createdAt: bill.createdAt,
    companyName: user?.companyName || 'My Business',
    companyAddress: user?.address || '',
    companyPhone: user?.phone || '',
    companyEmail: user?.email || '',
    companyGst: user?.gstNumber || '',
    companyPan: user?.panNumber || '',
    logoUrl: user?.logoUrl || null,
    logoPosition: user?.logoPosition || 'left',
    logoWidth: user?.logoWidth ?? 100,
    logoOffsetY: user?.logoOffsetY ?? 0,
  };

  return emailNew.generateInvoicePdf(invoiceData);
}

/**
 * COMPATIBILITY WRAPPER: sendEmailInvoiceWithPdf
 * Maps the old function signature to the new modular mailService
 */
export async function sendEmailInvoiceWithPdf(bill: any, pdfBuffer: Buffer, toEmail: string) {
  const appUrl = getBaseUrl();

  await emailNew.sendInvoiceEmail(
    toEmail,
    bill.customerName,
    bill.billNumber || bill.id.slice(0, 8),
    bill.totalAmount,
    bill.id,
    appUrl,
    pdfBuffer
  );

  return { success: true };
}

// Function to send Forgot Password Email
export async function sendForgotPasswordEmail(toEmail: string, token: string, frontendUrlOverride?: string) {
  const frontendUrl = frontendUrlOverride || getFrontendUrl();
  const resetLink = `${frontendUrl}/reset-password/${token}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e6ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0044CC; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">PASSWORD RESET</h1>
        </div>
        <div style="padding: 40px; background-color: white;">
            <p style="color: #666; line-height: 1.6;">You've requested to reset your password for your <strong>BillSoft</strong> account. Click the button below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0044CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>

            <p style="color: #666; line-height: 1.6; font-size: 0.9em;">If you did not request a password reset, you can safely ignore this email.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="color: #333; font-weight: bold; margin-bottom: 0;">BillSoft Team</p>
            </div>
        </div>
    </div>
  `;

  return emailNew.sendMail({
    to: toEmail,
    subject: 'Password Reset Request - BillSoft',
    html
  });
}

// Function to send Signup Verification Email
export async function sendSignupVerificationEmail(toEmail: string, token: string, frontendUrlOverride?: string) {
  const frontendUrl = frontendUrlOverride || getFrontendUrl();
  const verifyLink = `${frontendUrl}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e6ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0044CC; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">WELCOME TO BillSoft</h1>
        </div>
        <div style="padding: 40px; background-color: white;">
            <p style="color: #666; line-height: 1.6;">Thank you for choosing <strong>BillSoft</strong>. To complete your signup and start using our platform, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background-color: #0044CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>

            <p style="color: #666; line-height: 1.6; font-size: 0.9em;">This link will expire in 1 hour and is valid for a single use.</p>
            <p style="color: #666; line-height: 1.6; font-size: 0.9em;">If you did not sign up for BillSoft, you can safely ignore this email.</p>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="color: #333; font-weight: bold; margin-bottom: 0;">BillSoft Team</p>
            </div>
        </div>
    </div>
  `;

  return emailNew.sendMail({
    to: toEmail,
    subject: 'Verify Your Email - BillSoft',
    html
  });
}
