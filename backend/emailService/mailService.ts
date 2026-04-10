import nodemailer from 'nodemailer';

/**
 * Mail Service
 * Handles sending emails using nodemailer
 */

// Create a transporter using SMTP configuration from environment variables
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
        // auth: {
        // user: process.env.EMAIL_USER,
        // pass: process.env.EMAIL_PASS,
        // },
    });
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
 * Send an email
 * @param options Mail options (to, subject, text, html, attachments)
 * @returns Promise with success status
 */
export async function sendMail(options: MailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"BillSoft" <${process.env.EMAIL_USER}>`,
            ...options,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MailService] Email sent: ${info.messageId}`);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('[MailService] Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}

/**
 * Send a welcome email to a new user
 * @param email User's email
 * @param name User's name
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to BillSoft! 🚀';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to BillSoft, ${name}!</h2>
            <p>We're excited to have you on board. BillSoft is designed to make your billing and inventory management seamless and efficient.</p>
            <p>With BillSoft, you can:</p>
            <ul>
                <li>Create and manage invoices effortlessly</li>
                <li>Track your inventory in real-time</li>
                <li>Manage customer and supplier relationships</li>
                <li>Generate detailed business reports</li>
            </ul>
            <p>If you have any questions, feel free to reply to this email.</p>
            <br>
            <p>Best regards,<br>The BillSoft Team</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send an OTP for password reset or verification
 * @param email User's email
 * @param otp The OTP code
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = 'Your BillSoft Verification Code';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Your verification code for BillSoft is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff; border-radius: 5px;">
                ${otp}
            </div>
            <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
            <br>
            <p>Best regards,<br>The BillSoft Team</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send an invoice to a customer
 * @param email Customer's email
 * @param customerName Customer's name
 * @param billNumber Bill number
 * @param totalAmount Total amount
 * @param billId Bill ID
 * @param appUrl Application URL
 * @param pdfBuffer PDF buffer for attachment
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #007bff; margin: 0;">BillSoft</h1>
                <p style="color: #666; font-size: 14px;">Professional Billing Solutions</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee;">
            <h2 style="color: #333;">Invoice Details</h2>
            <p>Hi ${customerName},</p>
            <p>Your invoice has been generated. We have attached a PDF copy for your records. You can also view it online.</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #666;">Invoice Number:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right;">${billNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Total Amount:</td>
                    <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #28a745; font-size: 18px;">₹${totalAmount.toLocaleString('en-IN')}</td>
                </tr>
            </table>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View/Download Online</a>
            </div>
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
                Thank you for your business! If you have any questions regarding this invoice, please contact us.
            </p>
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
 * @param email Customer's email
 * @param name Customer's name
 * @param companyName Your company name
 */
export async function sendCustomerWelcomeEmail(email: string, name: string, companyName: string): Promise<void> {
    const subject = `Welcome to ${companyName}!`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p>Thank you for choosing <strong>${companyName}</strong>. We've added you to our customer list to provide you with better service and faster billing.</p>
            <p>You will now receive your invoices and payment receipts directly via email.</p>
            <br>
            <p>Best regards,<br>The ${companyName} Team</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send a notification to a new supplier
 * @param email Supplier's email
 * @param name Supplier's name
 * @param companyName Your company name
 */
export async function sendSupplierWelcomeEmail(email: string, name: string, companyName: string): Promise<void> {
    const subject = `Partnership with ${companyName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p>We are pleased to inform you that <strong>${companyName}</strong> has added you as an official supplier in our system.</p>
            <p>All future purchase orders and transaction correspondence will be managed through this email address.</p>
            <br>
            <p>Best regards,<br>The ${companyName} Team</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}

/**
 * Send a low stock alert to the merchant
 * @param email Merchant's email
 * @param products List of low stock products
 */
export async function sendStockAlertEmail(email: string, products: { name: string; stock: number }[]): Promise<void> {
    const subject = '⚠️ Low Stock Alert - BillSoft';
    const productListHtml = products.map(p => `
        <li style="margin-bottom: 10px;">
            <strong>${p.name}</strong>: Only <strong>${p.stock}</strong> units left!
        </li>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #dc3545;">Low Stock Warning</h2>
            <p>The following items in your inventory are running low:</p>
            <ul style="background-color: #fff3f3; padding: 20px; border-radius: 5px; list-style-type: none;">
                ${productListHtml}
            </ul>
            <p>Please restock soon to avoid running out of these items.</p>
            <br>
            <p>Best regards,<br>The BillSoft Team</p>
        </div>
    `;

    await sendMail({ to: email, subject, html });
}
