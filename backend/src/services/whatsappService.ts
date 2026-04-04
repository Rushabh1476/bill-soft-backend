/**
 * WhatsApp Service
 * Handles sending invoice PDFs via WhatsApp
 */

interface WhatsAppMessagePayload {
    phoneNumber: string;
    message: string;
    invoiceUrl?: string;
    billNumber: string;
    customerName: string;
    totalAmount: number;
}

/**
 * Send invoice via WhatsApp
 * @param payload WhatsApp message payload
 * @returns Promise with success status
 */
export async function sendInvoiceViaWhatsApp(
    payload: WhatsAppMessagePayload
): Promise<{ success: boolean; whatsappUrl?: string; error?: string }> {
    try {
        const { phoneNumber, message, invoiceUrl, billNumber, customerName, totalAmount } = payload;

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // Validate phone number
        if (!cleanPhone || cleanPhone.length < 10) {
            return {
                success: false,
                error: 'Invalid phone number',
            };
        }

        // Construct WhatsApp message with direct public URL link
        const invoiceMessage = message || `Hello, your invoice from BillSoft is ready. View it here: ${invoiceUrl}`;

        // Generate WhatsApp URL
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(invoiceMessage)}`;

        // In a production environment, you might integrate with WhatsApp Business API
        // For now, we return the URL for the user to open
        return {
            success: true,
            whatsappUrl,
        };
    } catch (error) {
        console.error('WhatsApp service error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
        };
    }
}

/**
 * Send invoice automatically after bill creation
 * @param billId Bill ID
 * @param customerPhone Customer phone number
 * @param billNumber Bill number
 * @param customerName Customer name
 * @param totalAmount Total amount
 * @param appUrl Application URL
 */
export async function autoSendInvoice(
    billId: string,
    customerPhone: string,
    billNumber: string,
    customerName: string,
    totalAmount: number,
    appUrl: string
): Promise<{ success: boolean; whatsappUrl?: string }> {
    let finalAppUrl = appUrl.replace(/\/$/, '');

    const shareUrl = `${finalAppUrl}/share/invoice/${billId}`;
    const billIdShort = billNumber || billId.slice(0, 8);
    const message = `Hello, your Invoice ${billIdShort} is ready. Click here to view: ${shareUrl}`;

    const result = await sendInvoiceViaWhatsApp({
        phoneNumber: customerPhone,
        message: message,
        invoiceUrl: shareUrl,
        billNumber,
        customerName,
        totalAmount,
    });

    return result;
}

/**
 * Generate UPI QR code string
 * @param vpa UPI VPA (e.g., merchant@upi)
 * @param payeeName Payee name
 * @param amount Amount to pay
 * @param transactionNote Transaction note
 * @returns UPI string for QR code
 */
export function generateUpiQrString(
    vpa: string,
    payeeName: string,
    amount: number,
    transactionNote?: string
): string {
    // UPI QR Code format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
    const params = new URLSearchParams({
        pa: vpa, // Payee Address (VPA)
        pn: payeeName, // Payee Name
        am: amount.toFixed(2), // Amount
        cu: 'INR', // Currency
    });

    if (transactionNote) {
        params.append('tn', transactionNote);
    }

    return `upi://pay?${params.toString()}`;
}
