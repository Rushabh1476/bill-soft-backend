import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';

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
    companyPan?: string;
    logoUrl?: string | null;
    logoPosition?: string | null;
    logoWidth?: number | null;
    logoOffsetY?: number | null;
}

/**
 * Generate a PDF invoice
 * @param data Invoice details
 * @returns Promise with PDF buffer
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });

            // Styling colors
            const primaryColor = '#007bff';
            const secondaryColor = '#444444';
            const mutedColor = '#777777';
            const borderColor = '#EEEEEE';

            // Add Header Decoration
            doc.rect(0, 0, 600, 15).fill(primaryColor);

            // Add Logo if available
            let logoOffset = 0;
            if (data.logoUrl) {
                try {
                    // In a production environment, we'd need to resolve this path.
                    // If it's a URL, we might need to fetch it or a local path.
                    // Assuming local path based on how it's stored
                    let logoPath = data.logoUrl;
                    // Ensure we don't treat /uploads as root /uploads
                    const relativePath = logoPath.startsWith('/') ? logoPath.substring(1) : logoPath;
                    logoPath = path.join(process.cwd(), relativePath);

                    if (fs.existsSync(logoPath)) {
                        const logoWidth = data.logoWidth || 100;
                        const pageWith = 595; // A4
                        let x = 50; // Left

                        if (data.logoPosition === 'center') {
                            x = (pageWith - logoWidth) / 2;
                        } else if (data.logoPosition === 'right') {
                            x = pageWith - 50 - logoWidth;
                        }

                        const yOffset = 30 + (data.logoOffsetY || 0);
                        doc.image(logoPath, x, yOffset, { width: logoWidth });
                        logoOffset = (yOffset - 30) + (logoWidth / 2) + 20; // Adjust space below based on size/offset
                    }
                } catch (e) {
                    console.error('Failed to add logo to PDF:', e);
                }
            }

            // Add Company Header
            doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text(data.companyName.toUpperCase(), 50, 45 + logoOffset);

            doc.fillColor(secondaryColor).font('Helvetica').fontSize(10);
            let headerY = 75 + logoOffset;
            if (data.companyAddress) {
                doc.text(data.companyAddress, 50, headerY);
                headerY += 15;
            }
            if (data.companyPhone) {
                doc.text(`Phone: ${data.companyPhone}`, 50, headerY);
                headerY += 15;
            }
            if (data.companyGst) {
                doc.text(`GSTIN: ${data.companyGst}`, 50, headerY);
                headerY += 15;
            }
            if (data.companyPan) {
                doc.text(`PAN: ${data.companyPan}`, 50, headerY);
            }

            // Add Invoice Title and Info (Right Aligned)
            doc.fillColor(primaryColor).fontSize(28).font('Helvetica-Bold').text('INVOICE', 350, 40 + logoOffset, { align: 'right', width: 200 });
            doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold').text(`Bill #: ${data.billNumber}`, 350, 75 + logoOffset, { align: 'right', width: 200 });
            doc.font('Helvetica').text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN')}`, 350, 90 + logoOffset, { align: 'right', width: 200 });

            doc.moveTo(50, 140 + logoOffset).lineTo(550, 140 + logoOffset).strokeColor(borderColor).stroke();

            // Billing Info
            doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('BILL TO:', 50, 160 + logoOffset);
            doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold').text(data.customerName, 50, 175 + logoOffset);
            doc.fontSize(10).font('Helvetica').fillColor(mutedColor);
            let customerY = 190 + logoOffset;
            if (data.customerPhone) {
                doc.text(`Phone: ${data.customerPhone}`, 50, customerY);
                customerY += 15;
            }
            if (data.customerEmail) {
                doc.text(`Email: ${data.customerEmail}`, 50, customerY);
            }

            // Table Header
            const tableTop = 250 + logoOffset;
            doc.rect(50, tableTop, 500, 25).fill(primaryColor);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
            doc.text('Description', 60, tableTop + 8);
            doc.text('Qty', 300, tableTop + 8, { width: 40, align: 'center' });
            doc.text('Price', 350, tableTop + 8, { width: 90, align: 'right' });
            doc.text('Total', 450, tableTop + 8, { width: 90, align: 'right' });

            // Table Body
            let position = tableTop + 35;
            doc.font('Helvetica').fontSize(10).fillColor(secondaryColor);

            data.items.forEach((item, index) => {
                // Alternating row background
                if (index % 2 === 1) {
                    doc.fillColor('#F9F9F9').rect(50, position - 5, 500, 20).fill();
                }

                doc.fillColor(secondaryColor);
                doc.text(item.productName, 60, position, { width: 230 });
                doc.text(item.quantity.toString(), 300, position, { width: 40, align: 'center' });
                doc.text(`₹${item.price.toFixed(2)}`, 350, position, { width: 90, align: 'right' });
                doc.text(`₹${item.total.toFixed(2)}`, 450, position, { width: 90, align: 'right' });

                position += 20;

                if (position > 700) {
                    doc.addPage();
                    position = 50;
                }
            });

            doc.moveTo(50, position).lineTo(550, position).strokeColor(borderColor).stroke();

            // Totals
            position += 20;
            const summaryX = 350;
            const valueX = 450;
            const summaryWidth = 100;

            doc.font('Helvetica').fontSize(10).fillColor(mutedColor);
            doc.text('Subtotal:', summaryX, position);
            doc.fillColor(secondaryColor).text(`₹${data.subtotal.toFixed(2)}`, valueX, position, { width: summaryWidth, align: 'right' });

            position += 20;
            doc.fillColor(mutedColor).text('Tax Amount:', summaryX, position);
            doc.fillColor(secondaryColor).text(`₹${data.taxAmount.toFixed(2)}`, valueX, position, { width: summaryWidth, align: 'right' });

            position += 25;
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Total Amount:', 250, position, { width: 200, align: 'right' });
            doc.text(`₹${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, position, { width: summaryWidth, align: 'right' });

            // Notes
            if (data.notes) {
                position += 50;
                doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold').text('Notes:', 50, position);
                doc.fillColor(mutedColor).font('Helvetica').text(data.notes, 50, position + 15, { width: 500 });
            }

            // Footer
            doc.fontSize(10).fillColor(mutedColor).text('Thank you for your business!', 50, doc.page.height - 70, { align: 'center' });
            doc.fontSize(8).text('This is a system-generated invoice.', 50, doc.page.height - 55, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
