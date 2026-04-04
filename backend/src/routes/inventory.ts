import express from 'express'
import prisma from '../lib/prisma'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = express.Router()

// Apply common middleware
router.use(authenticateToken)

// Get unified global alerts and notifications
router.get('/alerts', requirePermission('view_products'), async (req: any, res: any) => {
    try {
        const userId = req.user.orgId

        // 1. Fetch unread bills (Standard behavior for bills)
        const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        const recentBills = await prisma.bill.findMany({
            where: {
                userId,
                createdAt: { gte: oneDayAgo },
                isNotificationRead: false
            },
            select: {
                id: true,
                billNumber: true,
                totalAmount: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        // 2. Fetch ALL unread persistent notifications (Products, Tickets, etc.)
        const notifications = await (prisma as any).notification.findMany({
            where: {
                userId,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        // 3. Fetch ACTUAL low stock products (For the Dashboard Widget - Permanent until restocked)
        const lowStockProducts = await prisma.product.findMany({
            where: {
                userId,
                stock: { lte: 10 }
            },
            orderBy: { stock: 'asc' },
            take: 20
        });

        // 4. Fetch expiring soon products (For the Dashboard Widget)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const expiringProducts = await prisma.product.findMany({
            where: {
                userId,
                expiryDate: {
                    lte: sevenDaysFromNow,
                    gte: new Date()
                }
            },
            take: 10
        });

        res.status(200).json({
            // DASHBOARD WIDGET: Real-time inventory status (ignores "read" status)
            lowStock: lowStockProducts.map((p: any) => ({
                id: p.id,
                name: p.name,
                stock: Number(p.stock),
                minStockLevel: p.minStockLevel,
                type: 'stock',
                date: p.updatedAt
            })),
            // TRAY: Recent bills
            recentBills: recentBills.map((b: any) => ({
                id: b.id,
                name: `New bill generated: #${b.billNumber || b.id.slice(0, 8)}`,
                amount: b.totalAmount,
                date: b.createdAt,
                type: 'bill'
            })),
            // TRAY: All other unread notifications (including 'stock' notifications for new alerts)
            notifications: notifications.map((n: any) => ({
                id: n.id,
                name: n.message,
                type: n.type,
                date: n.createdAt
            })),
            expiringSoon: expiringProducts.map((p: any) => ({
                id: p.id,
                name: p.name,
                expiryDate: p.expiryDate,
                type: 'expiry'
            }))
        })

    } catch (error) {
        console.error('Get unified alerts error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Mark notification as read (Permanent Dismissal - handles both bills and notifications)
router.post('/notifications/:id/read', requirePermission('view_bills'), async (req: any, res: any) => {
    try {
        const { id } = req.params
        const userId = req.user.orgId

        // Try marking a persistent notification first
        try {
            const notification = await (prisma as any).notification.findFirst({
                where: { id, userId }
            })
            if (notification) {
                await (prisma as any).notification.update({
                    where: { id },
                    data: { isRead: true }
                })
                return res.status(200).json({ success: true, message: 'Notification marked as read' })
            }
        } catch (e) {
            // Notification table lookup failed, fall through to bill
        }

        // Fall back to bill notification
        const bill = await prisma.bill.findFirst({
            where: { id, userId }
        })

        if (!bill) {
            return res.status(404).json({ error: 'Notification not found' })
        }

        await prisma.bill.update({
            where: { id },
            data: { isNotificationRead: true }
        })

        res.status(200).json({ success: true, message: 'Notification marked as read' })
    } catch (error) {
        console.error('Mark notification read error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Mark all notifications as read (Global)
router.post('/notifications/read-all', requirePermission('view_products'), async (req: any, res: any) => {
    try {
        const userId = req.user.orgId

        // 1. Mark bills as read for this organization
        await prisma.bill.updateMany({
            where: { userId, isNotificationRead: false },
            data: { isNotificationRead: true }
        })

        // 2. Mark ALL persistent notifications as read (Unified Global)
        await (prisma as any).notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        })

        res.status(200).json({ success: true, message: 'All notifications marked as read' })
    } catch (error) {
        console.error('Mark all read error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Duplicate for PUT compatibility as requested
router.put('/notifications/mark-all-read', requirePermission('view_products'), async (req: any, res: any) => {
    try {
        const userId = req.user.orgId
        await prisma.bill.updateMany({
            where: { userId, isNotificationRead: false },
            data: { isNotificationRead: true }
        })
        await (prisma as any).notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        })
        res.status(200).json({ success: true, message: 'All notifications marked as read' })
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
