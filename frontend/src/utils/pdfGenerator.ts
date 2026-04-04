import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Bill } from '../types/bill';

// Format number as currency for PDF (Avoids encoding issues with standard PDF fonts)
const formatPDFCurrency = (amount: number): string => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
};

export const generateBillPDF = (bill: Bill) => {
    console.log('generateBillPDF called for:', bill.id);
    const doc = new jsPDF();

    // Add company logo/header if available
    // doc.addImage(...) 

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('INVOICE', 14, 22);

    // Bill Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice No: ${bill.billNumber || bill.id.slice(0, 8).toUpperCase()}`, 14, 32);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 14, 38);
    doc.text(`Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`, 14, 44);
    doc.text(`Status: ${bill.status}`, 14, 50);

    // Customer Details (Right Aligned)
    const pageWidth = doc.internal.pageSize.width;
    doc.text('Bill To:', pageWidth - 14, 32, { align: 'right' });
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(bill.customerName, pageWidth - 14, 38, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (bill.customerEmail) {
        doc.text(bill.customerEmail, pageWidth - 14, 44, { align: 'right' });
    }

    // Items Table
    const tableColumn = ["Product", "Price", "Qty", "Total"];
    const tableRows = bill.items.map(item => [
        item.productName,
        formatPDFCurrency(item.price),
        item.quantity,
        formatPDFCurrency(item.total)
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Product
            1: { halign: 'right' },   // Price
            2: { halign: 'center' },  // Qty
            3: { halign: 'right' },   // Total
        },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const rightColumnX = pageWidth - 60;
    const valueColumnX = pageWidth - 14;

    doc.setFontSize(10);
    doc.setTextColor(100);

    doc.text('Subtotal:', rightColumnX, finalY);
    doc.text(formatPDFCurrency(bill.subtotal || 0), valueColumnX, finalY, { align: 'right' });

    const taxPercent = bill.subtotal > 0 ? Math.round((bill.taxAmount / bill.subtotal) * 100) : 0;
    doc.text(`Tax (${taxPercent}%):`, rightColumnX, finalY + 7);
    doc.text(formatPDFCurrency(bill.taxAmount || 0), valueColumnX, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', rightColumnX, finalY + 15);
    doc.text(formatPDFCurrency(bill.totalAmount || 0), valueColumnX, finalY + 15, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Thank you for choosing BillSoft!', pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`Invoice-${bill.billNumber || bill.id}.pdf`);
};
