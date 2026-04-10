import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import path from 'path';
import fs from 'fs';

export interface InvoiceItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
    custom_fields?: string | null;
}

export interface InvoiceData {
    billNumber: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    items: InvoiceItem[];
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
    columnsSnapshot?: string | null;
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
                    let logoPath = data.logoUrl;
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
                        logoOffset = (yOffset - 30) + (logoWidth / 2) + 20; 
                    }
                } catch (e) {
                    console.error('Failed to add logo to PDF:', e);
                }
            }

            // Add Company Header
            doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(data.companyName.toUpperCase(), 50, 45 + logoOffset);

            doc.fillColor(secondaryColor).font('Helvetica').fontSize(9);
            let headerY = 70 + logoOffset;
            if (data.companyAddress) {
                doc.text(data.companyAddress, 50, headerY, { width: 250 });
                headerY += 12;
            }
            if (data.companyPhone) {
                doc.text(`Phone: ${data.companyPhone}`, 50, headerY);
                headerY += 12;
            }
            if (data.companyGst) {
                doc.text(`GSTIN: ${data.companyGst}`, 50, headerY);
                headerY += 12;
            }
            if (data.companyPan) {
                doc.text(`PAN: ${data.companyPan}`, 50, headerY);
            }

            // Add Invoice Title and Info (Right Aligned)
            doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('INVOICE', 350, 40 + logoOffset, { align: 'right', width: 200 });
            doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold').text(`Bill #: ${data.billNumber}`, 350, 70 + logoOffset, { align: 'right', width: 200 });
            doc.font('Helvetica').text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-IN')}`, 350, 82 + logoOffset, { align: 'right', width: 200 });

            doc.moveTo(50, 130 + logoOffset).lineTo(550, 130 + logoOffset).strokeColor(borderColor).stroke();

            // Billing Info
            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('BILL TO:', 50, 145 + logoOffset);
            doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold').text(data.customerName, 50, 158 + logoOffset);
            doc.fontSize(9).font('Helvetica').fillColor(mutedColor);
            let customerY = 172 + logoOffset;
            if (data.customerPhone) {
                doc.text(`Phone: ${data.customerPhone}`, 50, customerY);
                customerY += 12;
            }
            if (data.customerEmail) {
                doc.text(`Email: ${data.customerEmail}`, 50, customerY);
            }

            // Parse columns snapshot
            let columns: string[] = ['Description', 'Qty', 'Price', 'Total'];
            if (data.columnsSnapshot) {
                try {
                    const snapshot = JSON.parse(data.columnsSnapshot);
                    if (Array.isArray(snapshot) && snapshot.length > 0) {
                        columns = snapshot;
                    }
                } catch (e) {
                    console.error('Error parsing columnsSnapshot:', e);
                }
            }

            // Table Header Configuration
            const tableTop = 220 + logoOffset;
            const tableWidth = 500;
            const colCount = columns.length;
            const colWidth = tableWidth / colCount;

            doc.rect(50, tableTop, tableWidth, 22).fill(primaryColor);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
            
            columns.forEach((col, i) => {
                const align = i === 0 ? 'left' : (i === colCount - 1 ? 'right' : 'center');
                const x = 50 + (i * colWidth) + (i === 0 ? 10 : 0);
                const width = colWidth - (i === 0 || i === colCount - 1 ? 10 : 0);
                doc.text(col, x, tableTop + 7, { width, align });
            });

            // Table Body
            let position = tableTop + 22;
            doc.font('Helvetica').fontSize(9).fillColor(secondaryColor);

            data.items.forEach((item, index) => {
                const itemY = position;
                const rowHeight = 20;

                // Alternating row background
                if (index % 2 === 1) {
                    doc.fillColor('#F9F9F9').rect(50, itemY, tableWidth, rowHeight).fill();
                }

                doc.fillColor(secondaryColor);
                
                // Parse item custom fields
                let customFields: any = {};
                if (item.custom_fields) {
                    try {
                        customFields = JSON.parse(item.custom_fields);
                    } catch (e) {
                        customFields = {};
                    }
                }

                columns.forEach((col, i) => {
                    const align = i === 0 ? 'left' : (i === colCount - 1 ? 'right' : 'center');
                    const x = 50 + (i * colWidth) + (i === 0 ? 10 : 0);
                    const width = colWidth - (i === 0 || i === colCount - 1 ? 10 : 0);
                    
                    let value = '';
                    const colLower = col.toLowerCase();

                    if (colLower === 'description' || colLower === 'item' || colLower === 'product') {
                        value = item.productName;
                    } else if (colLower === 'qty' || colLower === 'quantity') {
                        value = item.quantity.toString();
                    } else if (colLower === 'price' || colLower === 'rate') {
                        value = `₹${item.price.toFixed(2)}`;
                    } else if (colLower === 'total' || colLower === 'amount') {
                        value = `₹${item.total.toFixed(2)}`;
                    } else {
                        // Look in custom fields
                        value = customFields[col] || customFields[colLower] || '-';
                    }

                    doc.text(value, x, itemY + 6, { width, align });
                });

                position += rowHeight;

                if (position > 750) {
                    doc.addPage();
                    position = 50;
                    // Redraw header on new page? (Optional)
                }
            });

            doc.moveTo(50, position).lineTo(550, position).strokeColor(borderColor).stroke();

            // Totals
            position += 15;
            const summaryX = 350;
            const valueX = 450;
            const summaryWidth = 100;

            doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
            doc.text('Subtotal:', summaryX, position);
            doc.fillColor(secondaryColor).text(`₹${data.subtotal.toFixed(2)}`, valueX, position, { width: summaryWidth, align: 'right' });

            position += 15;
            doc.fillColor(mutedColor).text('Tax Amount:', summaryX, position);
            doc.fillColor(secondaryColor).text(`₹${data.taxAmount.toFixed(2)}`, valueX, position, { width: summaryWidth, align: 'right' });

            position += 20;
            doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Total Amount:', 250, position, { width: 200, align: 'right' });
            doc.text(`₹${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, valueX, position, { width: summaryWidth, align: 'right' });

            // Notes
            if (data.notes) {
                position += 40;
                doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold').text('Notes:', 50, position);
                doc.fillColor(mutedColor).font('Helvetica').text(data.notes, 50, position + 12, { width: 500 });
            }

            // Footer
            doc.fontSize(9).fillColor(mutedColor).text('Thank you for your business!', 50, doc.page.height - 60, { align: 'center' });
            doc.fontSize(7).text('This is a system-generated invoice.', 50, doc.page.height - 48, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

