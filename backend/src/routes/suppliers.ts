
import express from 'express'
import prisma from '../lib/prisma'
import { extractUserFromRequest } from '../lib/auth'
import { recordAuditLog } from '../lib/auditLog'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = express.Router()

// Apply authentication to the entire router
router.use(authenticateToken)
router.use(requirePermission('manage_customers'))

// Get all suppliers
router.get('/', async (req: any, res) => {
    try {
        const { search } = req.query
        const userId = req.user.orgId
        const actorId = req.user.id;

        const whereClause: any = { userId }

        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { contact: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
            ]
        }

        const suppliers = await (prisma as any).supplier.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { products: true, bills: true }
                }
            }
        })

        res.status(200).json({ suppliers })

    } catch (error) {
        console.error('Get suppliers error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Create supplier
router.post('/', async (req: any, res) => {
    try {
        const { name, contact, phone, email, address, state, city, pincode, balance, gstNumber, isActive, isMarkedRed } = req.body
        const userId = req.user.orgId
        const actorId = req.user.id;

        const { validateAddressFields } = require('../lib/addressValidation');
        const addressValidation = validateAddressFields({ address, city, state, pincode });
        if (!addressValidation.isValid) {
            return res.status(400).json({ error: addressValidation.error });
        }

        if (email) {
            const { validateEmail } = require('../lib/validation');
            const emailValidation = validateEmail(email);
            if (!emailValidation.isValid) {
                return res.status(400).json({ error: emailValidation.error });
            }
        }

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' })
        }

        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' })
        }

        // Check for duplicate name (case-insensitive) for this user
        const existingSupplier = await (prisma as any).supplier.findFirst({
            where: {
                userId,
                name: name
            }
        })

        if (existingSupplier) {
            return res.status(400).json({ error: `Supplier with name "${name}" already exists.` })
        }

        const parsedBalance = parseFloat(balance || '0')
        if (isNaN(parsedBalance) || parsedBalance < 0) {
            return res.status(400).json({ error: 'Valid positive opening balance is required' })
        }

        const supplier = await (prisma as any).supplier.create({
            data: {
                userId,
                name,
                contact: contact || null,
                phone: phone || null,
                email: email || null,
                address: address || null,
                state: state || null,
                city: city || null,
                pincode: pincode || null,
                gstNumber: gstNumber || null,
                isActive: isActive !== undefined ? isActive : true,
                isMarkedRed: isMarkedRed !== undefined ? isMarkedRed : false,
                balance: parsedBalance
            }
        })

        // Audit Log: Create
        await recordAuditLog({
            userId: userId,
            subUserId: actorId,
            action: 'CREATE',
            entity: 'Supplier',
            entityId: supplier.id,
            description: `Supplier: ${supplier.name} created`,
            req, // Pass request for IP
            newData: { name: supplier.name, contact: supplier.contact }
        });

        // Welcome email disabled by user request

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        })

    } catch (error: any) {
        console.error('Create supplier error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Get supplier by ID
router.get('/:id', async (req: any, res) => {
    try {
        const { id } = req.params
        const userId = req.user.orgId

        const supplier = await (prisma as any).supplier.findFirst({
            where: {
                id: id,
                userId: userId
            },
            include: {
                products: true,
                bills: true
            }
        })

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' })
        }

        res.status(200).json({ supplier })

    } catch (error) {
        console.error('Get supplier error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Update supplier
router.put('/:id', async (req: any, res) => {
    handleUpdate(req, res)
})

router.patch('/:id', async (req: any, res) => {
    handleUpdate(req, res)
})

async function handleUpdate(req: any, res: any) {
    try {
        const { id } = req.params
        const { name, contact, phone, email, address, state, city, pincode, balance, gstNumber, isActive, isMarkedRed } = req.body
        const userId = req.user.orgId

        const { validateAddressFields } = require('../lib/addressValidation');
        const addressValidation = validateAddressFields({ address, city, state, pincode });
        if (!addressValidation.isValid) {
            return res.status(400).json({ error: addressValidation.error });
        }

        // Only enforce name if it's a PUT (full update) or if it's provided in PATCH
        if (req.method === 'PUT' && !name) {
            return res.status(400).json({ error: 'Supplier name is required for full update' })
        }

        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' })
        }

        if (name) {
            // Check for duplicate name (case-insensitive) excluding current supplier
            const existingSupplier = await (prisma as any).supplier.findFirst({
                where: {
                    userId,
                    name: name,
                    NOT: { id }
                }
            })

            if (existingSupplier) {
                return res.status(400).json({ error: `Another supplier with name "${name}" already exists.` })
            }
        }

        const data: any = {}
        if (name !== undefined) data.name = name
        if (contact !== undefined) data.contact = contact
        if (phone !== undefined) data.phone = phone
        if (email !== undefined) data.email = email
        if (address !== undefined) data.address = address
        if (state !== undefined) data.state = state
        if (city !== undefined) data.city = city
        if (pincode !== undefined) data.pincode = pincode
        if (gstNumber !== undefined) data.gstNumber = gstNumber
        if (isActive !== undefined) data.isActive = isActive
        if (isMarkedRed !== undefined) data.isMarkedRed = isMarkedRed
        if (balance !== undefined) {
            const parsedBalance = parseFloat(balance)
            if (isNaN(parsedBalance) || parsedBalance < 0) {
                return res.status(400).json({ error: 'Valid positive balance is required' })
            }
            data.balance = parsedBalance
        }

        const supplier = await (prisma as any).supplier.updateMany({
            where: {
                id: id,
                userId: userId
            },
            data
        })

        if (supplier.count === 0) {
            return res.status(404).json({ error: 'Supplier not found' })
        }

        const updatedSupplier = await (prisma as any).supplier.findFirst({
            where: {
                id: id,
                userId: userId
            }
        })

        res.status(200).json({
            message: 'Supplier updated successfully',
            supplier: updatedSupplier
        })

    } catch (error) {
        console.error('Update supplier error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

// Delete supplier
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params
        const userId = req.user.orgId
        const actorId = req.user.id;

        // Fetch supplier before deletion
        const supplier = await (prisma as any).supplier.findFirst({
            where: { id, userId }
        });

        const result = await (prisma as any).supplier.deleteMany({
            where: {
                id: id,
                userId: userId
            }
        })

        if (result.count === 0) {
            return res.status(404).json({ error: 'Supplier not found' })
        }

        // Audit Log: Delete
        if (supplier) {
            await recordAuditLog({
                userId: userId,
                subUserId: actorId,
                action: 'DELETE',
                entity: 'Supplier',
                entityId: id,
                description: `Supplier: ${supplier.name} deleted`,
                req, // Pass request for IP
                oldData: { name: supplier.name, contact: supplier.contact }
            });
        }

        res.status(200).json({ message: 'Supplier deleted successfully' })

    } catch (error: any) {
        console.error('Delete supplier error:', error)

        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Cannot delete supplier with associated products or bills' })
        }

        res.status(500).json({ error: 'Internal server error' })
    }
})

export default router
