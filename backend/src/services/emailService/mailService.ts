import nodemailer from 'nodemailer';
import path from 'path';
import { getBaseUrl, getFrontendUrl } from '../../lib/baseUrl';

/**
 * Mail Service
 * Handles sending emails using nodemailer
 */

let sharedTransporter: nodemailer.Transporter | null = null;

/**
 * Creates or retrieves a persistent, verified Gmail transporter.
 */
const getTransporter = async () => {
    if (sharedTransporter) return sharedTransporter;

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS?.replace(/\s/g, '');

    if (!user || !pass) {
        console.error('[MailService] ❌ CRITICAL: EMAIL_USER or EMAIL_PASS environment variables are missing.');
        return null;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass,
        },
        logger: true,
        debug: true,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
    });

    try {
        await transporter.verify();
        sharedTransporter = transporter;
        return transporter;
    } catch (vErr: any) {
        console.error('[MailService] ❌ CONNECTION ERROR:', vErr.message);
        return null;
    }
};

export interface MailOptions {
    to: string;
    bcc?: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
}

/**
 * Send an email with detailed logging
 */
export async function sendMail(options: MailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const transporter = await getTransporter();
        if (!transporter) {
            throw new Error('Email configuration error. Please check your App Password.');
        }

        // Clean sender format: Prefer EMAIL_FROM as a full string if it exists
        const fromEnv = process.env.EMAIL_FROM;
        const fromAddress = fromEnv && fromEnv.includes('<') 
            ? fromEnv 
            : `BillSoft Support <${process.env.EMAIL_USER || 'agbitsolutions247@gmail.com'}>`;

        const mailOptions = {
            from: fromAddress,
            ...options,
        };

        console.log(`[MailService] 📧 Scheduling: [From: ${mailOptions.from}] [To: ${mailOptions.to}]`);

        // NON-BLOCKING: Trigger the send in the background and return immediately
        transporter.sendMail(mailOptions)
            .then(info => console.log(`[MailService] ✅ DISPATCHED to ${options.to} (MessageID: ${info.messageId})`))
            .catch(error => console.error(`[MailService] ❌ BACKGROUND FAILURE for ${options.to}:`, error.message));

        return {
            success: true, // Optimistically return success as requested
            messageId: 'scheduled'
        };
    } catch (error: any) {
        console.error(`[MailService] ❌ FAILURE: Error sending email to ${options.to}:`, error.message);

        // Log more specifics if available (SMTP error codes)
        if (error.code) console.error(`[MailService] SMTP Error Code: ${error.code}`);
        if (error.command) console.error(`[MailService] SMTP Command: ${error.command}`);
        if (error.response) console.error(`[MailService] SMTP Response: ${error.response}`);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(email: string, name: string, frontendUrlOverride?: string): Promise<void> {
    const subject = 'Welcome to BillSoft! 🚀 Your Account is Ready';
    const baseUrl = getBaseUrl();
    const frontendUrl = frontendUrlOverride || getFrontendUrl();
    const loginUrl = frontendUrl + '/login';

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0044CC; padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to BillSoft!</h1>
                <p style="margin-top: 10px; opacity: 0.9;">Hello, ${name}. Your account is ready.</p>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <p>Your account has been successfully created. Use the username below to log in:</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>Username:</strong> ${email}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #0044CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
                </div>
            </div>
        </div>
    `;

    const reportPath = path.join(process.cwd(), '..', 'Billsoft test report.docx');

    await sendMail({ 
        to: email, 
        subject, 
        html,
        attachments: [
            {
                filename: 'Billsoft test report.docx',
                path: reportPath
            }
        ]
    });
}

/**
 * Send a secure invitation email to a new team member
 */
export async function sendInvitationEmail(email: string, name: string, token: string, role: string, baseUrlOverride?: string): Promise<void> {
    const subject = `Invitation to join BillSoft workspace`;
    const baseUrl = baseUrlOverride || getBaseUrl();
    const cleanBaseUrl = baseUrl;
    const setupLink = `${cleanBaseUrl}/api/auth/setup-password-redirect?token=${token}`;

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e6ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #0044CC; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">WELCOME TO BILLSOFT</h1>
            </div>
            <div style="padding: 40px; background-color: white;">
                <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
                <p style="color: #666; line-height: 1.6;">You have been invited to join the <strong>BillSoft</strong> billing workspace.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Login ID: <strong>${email}</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Assigned Role: <strong style="text-transform: capitalize;">${role}</strong></p>
                </div>

                <p style="color: #666; line-height: 1.6;">Click the button below to activate your account and set your login password:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${setupLink}" style="background-color: #0044CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Set Password</a>
                </div>

                <p style="color: #666; line-height: 1.6; font-size: 0.9em;">This link will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.</p>
                
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #333; font-weight: bold; margin-bottom: 0;">BillSoft Team</p>
                </div>
            </div>
        </div>
    `;

    const result = await sendMail({ to: email, subject, html });
    if (!result.success) {
        throw new Error(`Invitation email failure: ${result.error}`);
    }
}

/**
 * Send an alert when a new device logs in
 */
export async function sendNewDeviceAlertEmail(email: string, name: string, deviceName: string, ipAddress: string): Promise<void> {
    const subject = 'Security Alert: New Login from unrecognized device';
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #ef4444; padding: 30px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">New Login Alert</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <p>Hello ${name},</p>
                <p>We noticed a new login to your BillSoft account from a device we haven't seen before.</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>Device/Browser:</strong> ${deviceName}</p>
                    <p style="margin: 5px 0 0 0;"><strong>IP Address:</strong> ${ipAddress}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>If this was you, you can safely ignore this email.</p>
                <p style="color: #ef4444; font-weight: bold;">If you did not authorize this login, please act immediately to secure your account by changing your password.</p>
            </div>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send an OTP for password reset or verification

 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your BillSoft Verification Code';
    const html = ` 
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333; margin: 0;">Verification Code</h1>
            </div>
            <p>Your verification code for BillSoft is:</p>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0044CC; border-radius: 8px; border: 1px dashed #0044CC; margin: 20px 0;">
                ${otp}
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">This code will expire in 10 minutes. Please do not share it.</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send an invoice to a customer
 */
export async function sendInvoiceEmail(
    email: string,
    customerName: string,
    billNumber: string,
    totalAmount: number,
    billId: string,
    appUrl: string,
    pdfBuffer?: Buffer,
    bccEmail?: string
): Promise<void> {
    const subject = `Invoice #${billNumber} from BillSoft`;
    const invoiceUrl = `${appUrl}/bills/view/${billId}`;

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e6ed; border-radius: 12px;">
            <div style="background-color: #0044CC; padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0; margin: -20px -20px 20px -20px;">
                <h1 style="margin: 0; font-size: 24px;">INVOICE READY</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Ref: #${billNumber}</p>
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #333;">Hi ${customerName},</h2>
                <p>Your invoice has been generated. You can view it online or see the attached PDF.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #0044CC; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Invoice:</strong> #${billNumber}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${invoiceUrl}" style="background-color: #0044CC; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Invoice</a>
                </div>
            </div>
        </div>
    `;

    const attachments = pdfBuffer ? [{
        filename: `Invoice_${billNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
    }] : [];

    await sendMail({ 
        to: email, 
        bcc: bccEmail,
        subject, 
        html, 
        attachments 
    });
}

/**
 * Send a welcome email to a new customer
 */
export async function sendCustomerWelcomeEmail(email: string, name: string, companyName: string): Promise<void> {
    const subject = `Welcome to ${companyName}!`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e6ed; border-radius: 12px;">
            <h1 style="color: #0044CC; text-align: center;">Welcome, ${name}!</h1>
            <p>Dear ${name},</p>
            <p>Thank you for choosing <strong>${companyName}</strong>. We're excited to have you as a customer.</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send a welcome email to a new supplier
 */
export async function sendSupplierWelcomeEmail(email: string, name: string, companyName: string): Promise<void> {
    const subject = `Partnership with ${companyName}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e6ed; border-radius: 12px;">
            <h1 style="color: #10b981; text-align: center;">Business Partnership</h1>
            <p>Hello ${name},</p>
            <p>We've added you as a supplier for <strong>${companyName}</strong>. We look forward to working together.</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send a low stock alert email
 */
export async function sendStockAlertEmail(email: string, products: { name: string; stock: number; minStockLevel: number }[]): Promise<void> {
    const subject = '⚠️ Low Stock Alert - Action Required';

    const productRows = products.map(p => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7;">${p.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #ef4444; font-weight: bold;">${p.stock}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #718096;">${p.minStockLevel || 10}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #ef4444; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Low Stock Alert!</h1>
            </div>
            <div style="padding: 30px; background-color: white;">
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: left;">Current</th>
                            <th style="padding: 12px; text-align: left;">Limit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send notification to admin for new website lead
 */
export async function sendLeadNotificationEmail(lead: { name: string; email: string; phone?: string; message?: string }): Promise<void> {
    const adminEmail = process.env.EMAIL_USER || 'admin@billsoft.com';
    const subject = `New Lead: ${lead.name} from Website`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background: #0044CC; color: white; padding: 20px; text-align: center;">
                <h2>New Website Lead</h2>
            </div>
            <div style="padding: 20px;">
                <p><strong>Name:</strong> ${lead.name}</p>
                <p><strong>Email:</strong> ${lead.email}</p>
                <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
                <p><strong>Message:</strong> ${lead.message || 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #666; font-size: 12px;">This lead was captured from the BillSoft landing page.</p>
            </div>
        </div>
    `;

    await sendMail({ to: adminEmail, subject, html });

    // Send acknowledgment to the user
    const ackSubject = 'Thank you for your interest in BillSoft!';
    const ackHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0044CC;">Hi ${lead.name},</h2>
            <p>Thanks for reaching out! We've received your request and one of our experts will call you back within 24 hours to help you with the demo.</p>
            <p>Best regards,<br/>BillSoft Team</p>
        </div>
    `;
    await sendMail({ to: lead.email, subject: ackSubject, html: ackHtml });
}

/**
 * Send notification to admin for new demo request
 */
export async function sendDemoRequestNotificationEmail(request: { name: string; email: string; phone: string; companyName?: string }): Promise<void> {
    const adminEmail = process.env.EMAIL_USER || 'admin@billsoft.com';
    const subject = `DEMO REQUEST: ${request.name}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background: #0044CC; color: white; padding: 20px; text-align: center;">
                <h2>Live Demo Request</h2>
            </div>
            <div style="padding: 20px;">
                <p><strong>Name:</strong> ${request.name}</p>
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Phone:</strong> ${request.phone}</p>
                <p><strong>Preferred Time/Company:</strong> ${request.companyName || 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #666; font-size: 12px;">Immediate action required for live demo setup.</p>
            </div>
        </div>
    `;

    await sendMail({ to: adminEmail, subject, html });

    // Send acknowledgment to the user
    const ackSubject = 'Your Demo Request with BillSoft 🚀';
    const ackHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #0044CC;">Ready for your demo, ${request.name}?</h2>
            <p>We've received your request for a live demo. Our team is preparing a customized walkthrough for your business needs.</p>
            <p>We will contact you shortly at <strong>${request.phone}</strong> to confirm the schedule.</p>
            <br/>
            <p>Team BillSoft</p>
        </div>
    `;
    await sendMail({ to: request.email, subject: ackSubject, html: ackHtml });
}

/**
 * Send an alert to admin when a payment is received
 */
export async function sendPaymentReceivedAlertEmail(
    adminEmail: string,
    customerName: string,
    billNumber: string,
    amount: number
): Promise<void> {
    const subject = `💰 Payment Received: ₹${amount.toLocaleString('en-IN')} - ${customerName}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #10b981; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Payment Received!</h1>
            </div>
            <div style="padding: 30px; background-color: white;">
                <p>Hello Admin,</p>
                <p>A payment has been successfully recorded for an invoice.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Customer:</strong> ${customerName}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Invoice Number:</strong> #${billNumber}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Amount Paid:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
                </div>
                <p style="color: #64748b; font-size: 0.9em;">This is an automated notification based on your payment alert settings.</p>
            </div>
        </div>
    `;

    await sendMail({ to: adminEmail, subject, html });
}

/**
 * Send an alert to admin about an upcoming due invoice
 */
export async function sendInvoiceDueAlertEmail(
    adminEmail: string,
    invoices: Array<{ billNumber: string, customerName: string, totalAmount: number, dueDate: Date }>
): Promise<void> {
    const subject = `⏳ Reminder: ${invoices.length} Invoices are Due Soon`;
    
    const invoiceRows = invoices.map(inv => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7;">#${inv.billNumber}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7;">${inv.customerName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-weight: bold;">₹${inv.totalAmount.toLocaleString('en-IN')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #edf2f7; color: #f59e0b;">${new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #3b82f6; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Upcoming Invoice Deadlines</h1>
            </div>
            <div style="padding: 30px; background-color: white;">
                <p>Hello Admin,</p>
                <p>The following invoices are approaching their due dates within the next 48 hours:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <thead style="background-color: #f8fafc;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Invoice</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Customer</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Amount</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceRows}
                    </tbody>
                </table>
                <p style="color: #64748b; font-size: 0.85em; margin-top: 30px;">To stop receiving these alerts, update your Notification Settings in the dashboard.</p>
            </div>
        </div>
    `;

    await sendMail({ to: adminEmail, subject, html });
}

/**
 * Send an alert for crucial system/admin changes
 */
export async function sendAdminSystemAlertEmail(
    adminEmail: string,
    action: string,
    details: string,
    actorName: string
): Promise<void> {
    const subject = `🚨 System Alert: ${action}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #1e293b; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">ADMIN SYSTEM ALERT</h1>
            </div>
            <div style="padding: 30px; background-color: white;">
                <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <p style="margin: 0; font-weight: bold; color: #9a3412;">Action Triggered: ${action}</p>
                    <p style="margin: 10px 0 0 0; color: #431407; line-height: 1.5;">${details}</p>
                </div>
                <div style="font-size: 14px; color: #64748b;">
                    <p style="margin: 0;"><strong>Triggered By:</strong> ${actorName}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN')}</p>
                </div>
                <hr style="margin: 30px 0; border: 0; border-top: 1px solid #f1f5f9;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">You receive this because Admin System Alerts are enabled in your settings.</p>
            </div>
        </div>
    `;

    await sendMail({ to: adminEmail, subject, html });
}
