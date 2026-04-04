import express from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// Apply authentication to the entire router
router.use(authenticateToken);

router.get('/gst-export', requirePermission('tax_gst_reports'), async (req, res) => {
    try {
        const userId = req.user?.orgId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch bills for GST export
        const bills = await prisma.bill.findMany({
            where: { userId },
            include: {
                items: true,
                customer: true,
            },
        });

        const gstData = bills.map(bill => ({
            invoiceNumber: bill.billNumber,
            date: bill.createdAt.toISOString(),
            customerName: bill.customerName,
            subtotal: bill.subtotal,
            taxAmount: bill.taxAmount,
            total: bill.totalAmount,
            items: bill.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                taxAmount: item.taxAmount
            }))
        }));

        res.json({
            success: true,
            exportedAt: new Date().toISOString(),
            summary: {
                totalInvoices: bills.length,
                totalTax: bills.reduce((sum, b) => sum + b.taxAmount, 0)
            },
            data: gstData
        });
    } catch (error: any) {
        console.error('Error generating GST export:', error);
        res.status(500).json({ error: 'Failed to generate GST export' });
    }
});

router.get('/inactive-customers', requirePermission('view_reports'), async (req: any, res) => {
    try {
        const userId = req.user?.orgId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find customers where no bills exist with createdAt >= 30 days ago
        const inactiveCustomers = await prisma.customer.findMany({
            where: {
                userId,
                bills: {
                    none: {
                        createdAt: { gte: thirtyDaysAgo }
                    }
                }
            },
            include: {
                bills: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true }
                }
            }
        });

        const reportData = inactiveCustomers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            city: customer.city,
            state: customer.state,
            loyaltyPoints: customer.loyaltyPoints,
            lastBillDate: customer.bills.length > 0 ? customer.bills[0].createdAt : null,
            daysInactive: customer.bills.length > 0 
                ? Math.floor((new Date().getTime() - new Date(customer.bills[0].createdAt).getTime()) / (1000 * 3600 * 24))
                : Math.floor((new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 3600 * 24))
        }));

        res.json({
            success: true,
            data: reportData,
            summary: {
                totalInactive: inactiveCustomers.length,
                threshold: '30 days'
            }
        });
    } catch (error: any) {
        console.error('Error fetching inactive customers report:', error);
        res.status(500).json({ error: 'Failed to fetch inactive customers report' });
    }
});

export default router;
