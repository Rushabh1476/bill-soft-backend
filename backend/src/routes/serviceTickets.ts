import express from 'express';
import prisma from '../lib/prisma';
import { recordAuditLog } from '../lib/auditLog';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Generate Ticket Number
const generateTicketNumber = (): string => {
    return 'TK-' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
};

// Generate Bill Number (Copied from bills.ts logic)
const generateBillNumber = (): string => {
    const prefix = 'INV'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
}

// Get all tickets
router.get('/', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { search, status, priority, customerId } = req.query;
        const userId = req.user.orgId;

        const whereClause: any = { userId };

        // If user is an employee and not an admin, show only their assigned tickets
        if (req.user.isEmployee && req.user.role?.name !== 'ADMIN') {
            whereClause.assignedTechnician = req.user.name;
        }

        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        if (customerId) whereClause.customerId = customerId;

        if (search) {
            whereClause.OR = [
                { ticketNumber: { contains: search } },
                { deviceInfo: { contains: search } },
                { assignedTechnician: { contains: search } },
                { customer: { name: { contains: search } } }
            ];
        }

        const tickets = await prisma.serviceTicket.findMany({
            where: whereClause,
            include: {
                customer: { select: { name: true, phone: true } },
                service: { select: { name: true, price: true } },
                serviceItems: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ tickets });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Ticket
router.post('/', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { customerId, serviceId, deviceInfo, problemDescription, assignedTechnician, priority, items } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        if (!customerId) return res.status(400).json({ error: 'Customer is required' });

        const ticket = await prisma.serviceTicket.create({
            data: {
                userId,
                ticketNumber: generateTicketNumber(),
                customerId,
                serviceId: serviceId || null,
                deviceInfo: deviceInfo || null,
                problemDescription: problemDescription || null,
                assignedTechnician: assignedTechnician || null,
                priority: priority || 'MEDIUM',
                status: 'OPEN',
                serviceItems: items ? {
                    create: items.map((item: any) => ({
                        itemName: item.itemName,
                        price: parseFloat(item.price)
                    }))
                } : undefined
            },
            include: {
                customer: true,
                service: true,
                serviceItems: true
            }
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'CREATE',
            entity: 'ServiceTicket',
            entityId: ticket.id,
            description: `Ticket ${ticket.ticketNumber} created for ${ticket.customer.name}`,
            req
        });

        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (error: any) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Update Ticket Status & Auto-Bill
router.patch('/:id/status', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const whereClause: any = { id, userId };
        if (req.user.isEmployee && req.user.role?.name !== 'ADMIN') {
            whereClause.assignedTechnician = req.user.name;
        }

        const ticket = await prisma.serviceTicket.findFirst({
            where: whereClause,
            include: { customer: true, service: true, serviceItems: true }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const updatedTicket = await prisma.$transaction(async (tx) => {
            const updated = await tx.serviceTicket.update({
                where: { id },
                data: { status },
                include: {
                    customer: { select: { name: true, phone: true } },
                    service: { select: { name: true, price: true } },
                    serviceItems: true
                }
            });

            // Auto-generate Bill if status is COMPLETED
            if (status === 'COMPLETED') {
                const billItems = [];
                let subtotal = 0;

                // Main Service
                if (ticket.service) {
                    billItems.push({
                        isService: true,
                        serviceId: ticket.serviceId,
                        productName: ticket.service.name,
                        quantity: 1,
                        price: ticket.service.price,
                        total: ticket.service.price,
                        taxRate: 0, // Simplified for now
                        taxAmount: 0
                    });
                    subtotal += ticket.service.price;
                }

                // Additional Items
                for (const item of ticket.serviceItems) {
                    billItems.push({
                        isService: true,
                        productName: item.itemName,
                        quantity: 1,
                        price: item.price,
                        total: item.price,
                        taxRate: 0,
                        taxAmount: 0
                    });
                    subtotal += item.price;
                }

                if (billItems.length > 0) {
                    await tx.bill.create({
                        data: {
                            userId,
                            customerId: ticket.customerId,
                            billNumber: generateBillNumber(),
                            customerName: ticket.customer.name,
                            customerEmail: ticket.customer.email,
                            status: 'PENDING',
                            subtotal,
                            taxAmount: 0,
                            totalAmount: subtotal,
                            notes: `Service Ticket #${ticket.ticketNumber} completed.`,
                            items: {
                                create: billItems
                            }
                        }
                    });
                }
            }

            return updated;
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'UPDATE',
            entity: 'ServiceTicket',
            entityId: id,
            description: `Ticket ${ticket.ticketNumber} status changed to ${status}`,
            req
        });

        res.status(200).json({ message: `Ticket status updated to ${status}`, ticket: updatedTicket });
    } catch (error: any) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Get Ticket by ID
router.get('/:id', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.orgId;

        const whereClause: any = { id, userId };
        if (req.user.isEmployee && req.user.role?.name !== 'ADMIN') {
            whereClause.assignedTechnician = req.user.name;
        }

        const ticket = await prisma.serviceTicket.findFirst({
            where: whereClause,
            include: {
                customer: true,
                service: true,
                serviceItems: true
            }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.status(200).json({ ticket });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Ticket
router.delete('/:id', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const whereClause: any = { id, userId };
        if (req.user.isEmployee && req.user.role?.name !== 'ADMIN') {
            whereClause.assignedTechnician = req.user.name;
        }

        const ticket = await prisma.serviceTicket.findFirst({
            where: whereClause
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        await prisma.serviceTicket.delete({
            where: { id }
        });

        await recordAuditLog({
            userId,
            subUserId: actorId,
            action: 'DELETE',
            entity: 'ServiceTicket',
            entityId: id,
            description: `Ticket ${ticket.ticketNumber} deleted`,
            req
        });

        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error: any) {
        console.error('Delete ticket error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
