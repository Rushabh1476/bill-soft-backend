import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

export interface InvoiceData {
    billNumber: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string | null;
    createdAt: Date;
    companyName: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyGst?: string;
}

/**
 * Generate a PDF invoice
 * @param data Invoice details
 * @returns Promise with PDF buffer
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });

            // Add Company Header
            doc.fillColor('#444444').fontSize(20).text(data.companyName, 50, 57);
            if (data.companyAddress) {
                doc.fontSize(10).text(data.companyAddress, 50, 80);
            }
            if (data.companyGst) {
                doc.text(`GSTIN: ${data.companyGst}`, 50, data.companyAddress ? 95 : 80);
            }
            doc.moveDown();

            // Add Invoice Title and Info
            doc.fillColor('#007bff').fontSize(25).text('INVOICE', 0, 50, { align: 'right' });
            doc.fillColor('#444444').fontSize(10).text(`Bill Number: ${data.billNumber}`, 0, 85, { align: 'right' });
            doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 0, 100, { align: 'right' });

            doc.moveTo(50, 130).lineTo(550, 130).stroke();

            // Customer Info
            doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 150);
            doc.fontSize(10).font('Helvetica').text(data.customerName, 50, 165);
            if (data.customerPhone) doc.text(data.customerPhone, 50, 180);
            if (data.customerEmail) doc.text(data.customerEmail, 50, 195);

            // Table Header
            const tableTop = 230;
            doc.font('Helvetica-Bold');
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 280, tableTop, { width: 50, align: 'right' });
            doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
            doc.text('Total', 450, tableTop, { width: 100, align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table Body
            let position = tableTop + 25;
            doc.font('Helvetica');

            data.items.forEach(item => {
                doc.text(item.productName, 50, position);
                doc.text(item.quantity.toString(), 280, position, { width: 50, align: 'right' });
                doc.text(`₹${item.price.toFixed(2)}`, 350, position, { width: 80, align: 'right' });
                doc.text(`₹${item.total.toFixed(2)}`, 450, position, { width: 100, align: 'right' });
                position += 20;

                if (position > 700) {
                    doc.addPage();
                    position = 50;
                }
            });

            doc.moveTo(50, position + 5).lineTo(550, position + 5).stroke();

            // Footer / Totals
            position += 20;
            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 350, position, { width: 100, align: 'right' });
            doc.text(`₹${data.subtotal.toFixed(2)}`, 450, position, { width: 100, align: 'right' });

            position += 20;
            doc.text('Tax (18%):', 350, position, { width: 100, align: 'right' });
            doc.text(`₹${data.taxAmount.toFixed(2)}`, 450, position, { width: 100, align: 'right' });

            position += 25;
            doc.fontSize(14).fillColor('#007bff').text('Total Amount:', 300, position, { width: 150, align: 'right' });
            doc.text(`₹${data.totalAmount.toFixed(2)}`, 450, position, { width: 100, align: 'right' });

            // Notes
            if (data.notes) {
                position += 50;
                doc.fillColor('#444444').fontSize(10).font('Helvetica-Bold').text('Notes:', 50, position);
                doc.font('Helvetica').text(data.notes, 50, position + 15);
            }

            // Thank you message
            doc.fontSize(10).text('Thank you for your business!', 50, doc.page.height - 70, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
