import express from 'express';
import prisma from '../lib/prisma';
import { recordAuditLog } from '../lib/auditLog';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Generate PO Number
const generatePONumber = (): string => {
    return 'PO-' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
};

// Get all Purchase Orders
router.get('/', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
    try {
        const { search, status, supplierId } = req.query;
        const userId = req.user.orgId;

        const whereClause: any = { userId };
        if (status) whereClause.status = status;
        if (supplierId) whereClause.supplierId = supplierId;

        if (search) {
            whereClause.OR = [
                { poNumber: { contains: search } },
                { supplier: { name: { contains: search } } }
            ];
        }

        const orders = await prisma.purchaseOrder.findMany({
            where: whereClause,
            include: {
                supplier: { select: { name: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ orders });
    } catch (error) {
        console.error('Get purchase orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Purchase Order
router.post('/', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
    try {
        const { supplierId, orderDate, notes, items } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        if (!supplierId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Supplier and items are required' });
        }

        let totalAmount = 0;
        const poItems = items.map((item: any) => {
            const total = parseFloat(item.quantity) * parseFloat(item.price);
            totalAmount += total;
            return {
                productId: item.productId || null,
                itemName: item.itemName,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                total
            };
        });

        const order = await prisma.purchaseOrder.create({
            data: {
                userId,
                poNumber: generatePONumber(),
                supplierId,
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                status: 'DRAFT',
                totalAmount,
                notes: notes || null,
                items: {
                    create: poItems
                }
            },
            include: {
                supplier: true,
                items: true
            }
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'CREATE',
            entity: 'PurchaseOrder',
            entityId: order.id,
            description: `Purchase Order ${order.poNumber} created for ${order.supplier.name}`,
            req
        });

        res.status(201).json({ message: 'Purchase Order created successfully', order });
    } catch (error: any) {
        console.error('Create purchase order error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Update PO Status & Inventory
router.patch('/:id/status', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const order = await prisma.purchaseOrder.findFirst({
            where: { id, userId },
            include: { items: true, supplier: true }
        });

        if (!order) return res.status(404).json({ error: 'Purchase Order not found' });

        // Prevent redundant status updates if already received
        if (order.status === 'RECEIVED') {
            return res.status(400).json({ error: 'Purchase Order already received. Stock was updated.' });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.purchaseOrder.update({
                where: { id },
                data: { status },
                include: { supplier: true, items: true }
            });

            // Update Stock if status is RECEIVED
            if (status === 'RECEIVED') {
                for (const item of order.items) {
                    if (item.productId) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: {
                                    increment: item.quantity
                                }
                            }
                        });
                    }
                }
            }

            return updated;
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'UPDATE',
            entity: 'PurchaseOrder',
            entityId: id,
            description: `Purchase Order ${order.poNumber} status changed to ${status}`,
            req
        });

        res.status(200).json({ message: `Purchase Order status updated to ${status}`, order: updatedOrder });
    } catch (error: any) {
        console.error('Update purchase order status error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Get PO by ID
router.get('/:id', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.orgId;

        const order = await prisma.purchaseOrder.findFirst({
            where: { id, userId },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: { select: { name: true, sku: true } }
                    }
                }
            }
        });

        if (!order) return res.status(404).json({ error: 'Purchase Order not found' });
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Purchase Order
router.delete('/:id', authenticateToken, requirePermission('view_products'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const order = await prisma.purchaseOrder.findFirst({
            where: { id, userId }
        });

        if (!order) return res.status(404).json({ error: 'Purchase Order not found' });
        
        // Safety: only allow deleting drafts
        if (order.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only DRAFT orders can be deleted' });
        }

        await prisma.purchaseOrder.delete({
            where: { id }
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'DELETE',
            entity: 'PurchaseOrder',
            entityId: id,
            description: `Purchase Order ${order.poNumber} deleted`,
            req
        });

        res.status(200).json({ message: 'Purchase Order deleted successfully' });
    } catch (error: any) {
        console.error('Delete purchase order error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
