import express from 'express';
import prisma from '../lib/prisma';
import { recordAuditLog } from '../lib/auditLog';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = express.Router();

// Get all services
router.get('/', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { search } = req.query;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const whereClause: any = { userId };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
            ];
        }

        const services = await (prisma as any).service.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[Services] GET / - Found ${services.length} services for userId: ${userId}`);
        services.forEach((s: any) => {
            console.log(`[Services]   - ID: ${s.id}, Name: ${s.name}, CreatedAt: ${s.createdAt}`);
        });

        res.status(200).json({ services });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create service
router.post('/', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        console.log('[Services] POST / request body:', req.body);
        console.log('[Services] User from req:', req.user);
        const { name, description, price, taxRate, category, duration, isActive } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        if (!name || name.trim().length < 3 || name.trim().length > 30) {
            return res.status(400).json({ error: 'Service name must be between 3 and 30 characters' });
        }

        const parsedPrice = parseFloat(price);
        if (price === undefined || price === null || isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Price must be a valid positive number or zero' });
        }

        const parsedTaxRate = taxRate ? parseFloat(taxRate) : 0;
        if (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
            return res.status(400).json({ error: 'Valid tax rate (0-100) is required' });
        }

        console.log('[Services] Checking for existing service...');
        // Check for duplicate name
        const existingService = await (prisma as any).service.findFirst({
            where: { userId, name: name.trim() }
        });

        if (existingService) {
            return res.status(400).json({ error: `Service with name "${name}" already exists.` });
        }

        console.log('[Services] Creating service in DB...');
        const service = await (prisma as any).service.create({
            data: {
                userId,
                name: name.trim(),
                description: description?.trim() || null,
                price: parsedPrice,
                taxRate: parsedTaxRate,
                category: category?.trim() || null,
                duration: duration?.trim() || null,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        console.log('[Services] Service created:', service);

        // Audit Log: Create
        console.log('[Services] Recording audit log...');
        await recordAuditLog({
            userId: userId,
            subUserId: actorId,
            action: 'CREATE',
            entity: 'Service',
            entityId: service.id,
            description: `Service: ${service.name} created`,
            req,
            newData: { name: service.name, price: service.price }
        });

        console.log('[Services] Success!');
        // Create Notification for the Tray
        await (prisma as any).notification.create({
            data: {
                userId,
                type: 'service',
                message: `New service added: ${service.name}`,
                isRead: false
            }
        });

        res.status(201).json({
            message: 'Service created successfully',
            service
        });

    } catch (error: any) {
        console.error('Create service error (DETAILED):', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message, 
            stack: error.stack,
            code: error.code
        });
    }
});

// Update service
router.put('/:id', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, taxRate, category, duration, isActive } = req.body;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        if (!name || name.trim().length < 3 || name.trim().length > 30) {
            return res.status(400).json({ error: 'Service name must be between 3 and 30 characters' });
        }

        const parsedPrice = parseFloat(price);
        if (price === undefined || price === null || isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Price must be a valid positive number or zero' });
        }

        const parsedTaxRate = taxRate ? parseFloat(taxRate) : 0;
        if (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
            return res.status(400).json({ error: 'Valid tax rate (0-100) is required' });
        }

        // Check for duplicate name excluding current service
        const existingService = await (prisma as any).service.findFirst({
            where: {
                userId,
                name: name.trim(),
                NOT: { id }
            }
        });

        if (existingService) {
            return res.status(400).json({ error: `Another service with name "${name}" already exists.` });
        }

        const result = await (prisma as any).service.updateMany({
            where: { id, userId },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                price: parsedPrice,
                taxRate: parsedTaxRate,
                category: category?.trim() || null,
                duration: duration?.trim() || null,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const service = await (prisma as any).service.findFirst({
            where: { id, userId }
        });

        // Audit Log: Update
        await recordAuditLog({
            userId: userId,
            subUserId: actorId,
            action: 'UPDATE',
            entity: 'Service',
            entityId: id,
            description: `Service: ${service?.name} updated`,
            req,
            newData: { name: service?.name, price: service?.price }
        });

        res.status(200).json({
            message: 'Service updated successfully',
            service
        });
    } catch (error: any) {
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete service
router.delete('/:id', authenticateToken, requirePermission('manage_services'), async (req: any, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.orgId;
        const actorId = req.user.id;

        const service = await (prisma as any).service.findFirst({
            where: { id, userId }
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await (prisma as any).service.delete({ where: { id } });

        await recordAuditLog({
            userId: userId,
            subUserId: actorId,
            action: 'DELETE',
            entity: 'Service',
            entityId: id,
            description: `Service: ${service.name} permanently deleted`,
            req,
            oldData: { name: service.name, price: service.price }
        });

        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
