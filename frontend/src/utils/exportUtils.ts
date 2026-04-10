/* eslint-disable */
import { Bill } from '../types/bill';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';

export const exportBillHistory = async (bills: Bill[]) => {
    const workbook = new ExcelJS.Workbook();
    const defaultFont = { name: 'Segoe UI', size: 10 };

    for (const bill of bills) {
        const sheetName = (bill.billNumber || bill.id).toString().replace(/[*?/\\[\\]]/g, '').substring(0, 31) || 'Invoice';
        const worksheet = workbook.addWorksheet(sheetName, {
            views: [{ showGridLines: false }],
            pageSetup: {
                paperSize: 9, // A4
                horizontalCentered: true,
                verticalCentered: false,
                margins: {
                    left: 0.25, right: 0.25,
                    top: 0.5, bottom: 0.5,
                    header: 0.2, footer: 0.2
                }
            }
        });

        // 1. Margins: Buffer columns A and G
        worksheet.columns = [
            { key: 'A', width: 5 },    // Left margin buffer
            { key: 'B', width: 40 },   // Description
            { key: 'C', width: 12 },   // Qty
            { key: 'D', width: 15 },   // Rate
            { key: 'E', width: 22 },   // Amount
            { key: 'F', width: 15 },   // Extra Space / alignment 
            { key: 'G', width: 5 },    // Right margin buffer
        ];

        // Apply default font globally to our used range
        for (let i = 1; i <= 60; i++) {
            worksheet.getRow(i).font = defaultFont;
        }

        // 2. The Logo: Top left 'B' logo with high-quality blue background and white text
        worksheet.getCell('B2').value = ' B ';
        worksheet.getCell('B2').font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('B2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0044CC' } };
        worksheet.getCell('B2').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(2).height = 40;

        // Company Details Next to/below logo
        worksheet.getCell('B4').value = 'BillSoft';
        worksheet.getCell('B4').font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF333333' } };

        worksheet.getCell('B5').value = '123 Business Avenue, Tech Park';
        worksheet.getCell('B5').font = { name: 'Segoe UI', size: 10, color: { argb: 'FFAAAAAA' } };

        // 3. Invoice Title: Centered across B to F
        worksheet.mergeCells('B7:F7');
        const titleCell = worksheet.getCell('B7');
        titleCell.value = 'I   N   V   O   I   C   E';
        titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF111111' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(7).height = 40;

        // Invoice Details Top Right
        worksheet.getCell('E9').value = 'Invoice #:';
        worksheet.getCell('E9').font = { name: 'Segoe UI', bold: true, color: { argb: 'FF777777' } };
        worksheet.getCell('E9').alignment = { horizontal: 'right' };
        worksheet.getCell('F9').value = bill.billNumber || bill.id.slice(0, 8);
        worksheet.getCell('F9').font = { name: 'Segoe UI', bold: true, color: { argb: 'FF333333' } };
        worksheet.getCell('F9').alignment = { horizontal: 'right' };

        worksheet.getCell('E10').value = 'Date:';
        worksheet.getCell('E10').font = { name: 'Segoe UI', bold: true, color: { argb: 'FF777777' } };
        worksheet.getCell('E10').alignment = { horizontal: 'right' };
        worksheet.getCell('F10').value = new Date(bill.createdAt).toLocaleDateString();
        worksheet.getCell('F10').font = { name: 'Segoe UI' };
        worksheet.getCell('F10').alignment = { horizontal: 'right' };

        worksheet.getCell('E11').value = 'Status:';
        worksheet.getCell('E11').font = { name: 'Segoe UI', bold: true, color: { argb: 'FF777777' } };
        worksheet.getCell('E11').alignment = { horizontal: 'right' };
        worksheet.getCell('F11').value = bill.status?.toUpperCase();
        worksheet.getCell('F11').font = { name: 'Segoe UI', bold: true, color: bill.status === 'Paid' ? { argb: 'FF22C55E' } : { argb: 'FFF59E0B' } };
        worksheet.getCell('F11').alignment = { horizontal: 'right' };

        // "Bill To" section
        worksheet.getCell('B9').value = 'BILL TO';
        worksheet.getCell('B9').font = { name: 'Segoe UI', bold: true, size: 9, color: { argb: 'FFAAAAAA' } };

        worksheet.getCell('B10').value = bill.customerName;
        worksheet.getCell('B10').font = { name: 'Segoe UI', bold: true, size: 14, color: { argb: 'FF333333' } };

        if (bill.customerEmail) {
            worksheet.getCell('B11').value = bill.customerEmail;
            worksheet.getCell('B11').font = { name: 'Segoe UI', size: 10, color: { argb: 'FF888888' } };
        }

        // 4. Professional Table Header Bar
        const startRow = 14;
        worksheet.getCell(`B${startRow}`).value = 'DESCRIPTION';
        worksheet.getCell(`C${startRow}`).value = 'QTY';
        worksheet.getCell(`D${startRow}`).value = 'RATE';
        worksheet.mergeCells(`E${startRow}:F${startRow}`);
        worksheet.getCell(`E${startRow}`).value = 'AMOUNT';

        ['B', 'C', 'D', 'E', 'F'].forEach(col => {
            const cell = worksheet.getCell(`${col}${startRow}`);
            cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF666666' }, size: 9 };
            cell.alignment = { vertical: 'middle', horizontal: col === 'B' ? 'left' : 'right' };
            // Minimalist Design: Thin light-blue bottom border for header
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFB3D4FF' } }, // Light blue
            };
        });
        worksheet.getRow(startRow).height = 25;

        // 5. Professional Table Body (Row height 25, no vertical borders)
        let currentRow = startRow + 1;
        const items = bill.items && bill.items.length > 0 ? bill.items : [];

        if (items.length === 0) {
            worksheet.getCell(`B${currentRow}`).value = 'No items';
            worksheet.getRow(currentRow).height = 25;
            currentRow++;
        } else {
            items.forEach((item) => {
                worksheet.getCell(`B${currentRow}`).value = item.productName || (item as any).serviceName || 'Unknown Item';
                worksheet.getCell(`B${currentRow}`).alignment = { vertical: 'middle', horizontal: 'left' };
                worksheet.getCell(`B${currentRow}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };

                const qtyCell = worksheet.getCell(`C${currentRow}`);
                qtyCell.value = item.quantity;
                qtyCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF555555' } };
                qtyCell.alignment = { vertical: 'middle', horizontal: 'right' };

                const priceCell = worksheet.getCell(`D${currentRow}`);
                priceCell.value = item.price;
                priceCell.numFmt = '₹#,##0.00';
                priceCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF555555' } };
                priceCell.alignment = { vertical: 'middle', horizontal: 'right' };

                worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
                const totalCell = worksheet.getCell(`E${currentRow}`);
                totalCell.value = item.total;
                totalCell.numFmt = '₹#,##0.00';
                totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
                totalCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };

                worksheet.getRow(currentRow).height = 25;
                currentRow++;
            });
        }

        currentRow += 2;
        const totalsRow = currentRow;

        // 6. QR Code generation (Scan to Pay) at bottom left
        try {
            const qrDataUrl = await QRCode.toDataURL(`upi://pay?pa=merchant@upi&pn=AGBIT&am=${bill.totalAmount}&cu=INR`, {
                width: 250,
                margin: 0,
                color: { dark: '#0044CC', light: '#FFFFFF' }
            });
            const imageId = workbook.addImage({
                base64: qrDataUrl,
                extension: 'png',
            });
            worksheet.getCell(`B${totalsRow}`).value = 'Scan to Pay';
            worksheet.getCell(`B${totalsRow}`).font = { name: 'Segoe UI', bold: true, size: 9, color: { argb: 'FF888888' } };

            worksheet.addImage(imageId, {
                tl: { col: 1, row: totalsRow },
                ext: { width: 90, height: 90 } // square display
            });
        } catch (e) {
            console.error('QR code generation failed', e);
        }

        // Calculations section (Subtotal / Tax)
        worksheet.getCell(`D${totalsRow}`).value = 'Subtotal';
        worksheet.getCell(`D${totalsRow}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF777777' } };
        worksheet.getCell(`D${totalsRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.mergeCells(`E${totalsRow}:F${totalsRow}`);
        worksheet.getCell(`E${totalsRow}`).value = bill.subtotal;
        worksheet.getCell(`E${totalsRow}`).numFmt = '₹#,##0.00';
        worksheet.getCell(`E${totalsRow}`).font = { name: 'Segoe UI', size: 11, color: { argb: 'FF333333' } };
        worksheet.getCell(`E${totalsRow}`).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getRow(totalsRow).height = 20;

        worksheet.getCell(`D${totalsRow + 1}`).value = 'Tax';
        worksheet.getCell(`D${totalsRow + 1}`).font = { name: 'Segoe UI', size: 10, color: { argb: 'FF777777' } };
        worksheet.getCell(`D${totalsRow + 1}`).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.mergeCells(`E${totalsRow + 1}:F${totalsRow + 1}`);
        worksheet.getCell(`E${totalsRow + 1}`).value = bill.taxAmount;
        worksheet.getCell(`E${totalsRow + 1}`).numFmt = '₹#,##0.00';
        worksheet.getCell(`E${totalsRow + 1}`).font = { name: 'Segoe UI', size: 11, color: { argb: 'FF333333' } };
        worksheet.getCell(`E${totalsRow + 1}`).alignment = { horizontal: 'right', vertical: 'middle' };
        worksheet.getRow(totalsRow + 1).height = 20;

        // 7. The Blue 'Total' Box exactly mirroring the UI
        const grandTotalRow = totalsRow + 3;
        worksheet.getCell(`D${grandTotalRow}`).value = 'Total Amount';
        worksheet.getCell(`D${grandTotalRow}`).font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FF0044CC' } };
        worksheet.getCell(`D${grandTotalRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

        worksheet.mergeCells(`E${grandTotalRow}:F${grandTotalRow}`);
        worksheet.getCell(`E${grandTotalRow}`).value = bill.totalAmount;
        worksheet.getCell(`E${grandTotalRow}`).numFmt = '₹#,##0.00';
        worksheet.getCell(`E${grandTotalRow}`).font = { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FF0044CC' } };
        worksheet.getCell(`E${grandTotalRow}`).alignment = { horizontal: 'right', vertical: 'middle' };

        // Light blue background with thick solid blue border
        ['D', 'E', 'F'].forEach(col => {
            const cell = worksheet.getCell(`${col}${grandTotalRow}`);
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F7FF' } // Light blue
            };
            cell.border = {
                top: { style: 'medium', color: { argb: 'FF0044CC' } },
                bottom: { style: 'medium', color: { argb: 'FF0044CC' } },
                left: col === 'D' ? { style: 'medium', color: { argb: 'FF0044CC' } } : undefined,
                right: col === 'F' ? { style: 'medium', color: { argb: 'FF0044CC' } } : undefined
            };
        });
        worksheet.getRow(grandTotalRow).height = 45;

        // 8. Footer Formatting
        currentRow = grandTotalRow + 4;
        worksheet.mergeCells(`B${currentRow}:F${currentRow}`);
        const footer1 = worksheet.getCell(`B${currentRow}`);
        footer1.value = 'Thank you for your business!';
        footer1.font = { name: 'Segoe UI', italic: true, bold: false, size: 10, color: { argb: 'FF888888' } };
        footer1.alignment = { horizontal: 'center' };

        // Blank row space if needed, otherwise this is the very bottom.
    }

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const data = new Blob([buffer], { type: EXCEL_TYPE });

        const fileName = bills.length === 1
            ? `Invoice_${bills[0].billNumber || bills[0].id.slice(0, 8)}.xlsx`
            : `Bills_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

        saveAs(data, fileName);
    } catch (err) {
        console.error('Error generating Excel file:', err);
    }
};


/**
 * Share invoice on WhatsApp with professional formatting and local IP support
 */
export const shareOnWhatsApp = (bill: Bill, networkIp?: string) => {
    // FORCEFUL: Use specific User IP if on localhost, otherwise fallback to auto-detected network IP
    const targetIp = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? '192.168.31.132' // Specific IP requested by user
        : window.location.hostname;

    const port = window.location.port || '3000';
    const shareUrl = `http://${targetIp}:${port}/share/invoice/${bill.id}`;

    const billIdShort = bill.billNumber || bill.id.slice(0, 8);
    // STICK TO EXACT FORMAT + BLUE LINK HACK: Start with URL
    const rawMessage = `${shareUrl} \n\nHello, your Invoice ${billIdShort} is ready. Click here to view it.`;
    const message = encodeURIComponent(rawMessage);

    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
};

export const exportToCSV = (bills: Bill[]) => {
    const csvContent = bills.map(bill => Object.values(bill).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'bill_history.csv');
};
