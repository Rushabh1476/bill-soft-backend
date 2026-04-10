import express from 'express'
import prisma from '../lib/prisma'
import { recordAuditLog } from '../lib/auditLog'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = express.Router()

// Get all customers
router.get('/', authenticateToken, requirePermission('view_customers'), async (req: any, res) => {
  try {
    const { search } = req.query
    const userId = req.user.orgId
    const actorId = req.user.id;

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({ customers })

  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create customer
router.post('/', authenticateToken, requirePermission('create_customers'), async (req: any, res) => {
  try {
    const { name, email, phone, address, state, city, pincode, gstNumber, isMarkedRed } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id;

    const { validateAddressFields } = require('../lib/addressValidation');
    const addressValidation = validateAddressFields({ address, city, state, pincode });
    if (!addressValidation.isValid) {
      return res.status(400).json({ error: addressValidation.error });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    if (normalizedEmail) {
      const { validateEmail } = require('../lib/validation');
      const emailValidation = validateEmail(normalizedEmail);
      if (!emailValidation.isValid) {
        return res.status(400).json({ error: emailValidation.error });
      }

      // Check for email uniqueness per organization
      const emailExists = await prisma.customer.findFirst({
        where: { userId, email: normalizedEmail }
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' })
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' })
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { userId, name }
    })

    if (existingCustomer) {
      return res.status(400).json({ error: `Customer with name "${name}" already exists.` })
    }

    const customer = await (prisma.customer as any).create({
      data: {
        userId,
        name,
        email: normalizedEmail,
        phone: phone || null,
        address: address || null,
        state: state || null,
        city: city || null,
        pincode: pincode || null,
        gstNumber: gstNumber || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        isMarkedRed: isMarkedRed !== undefined ? isMarkedRed : false
      }
    })

    // Audit Log: Create
    await recordAuditLog({
      userId: userId,
      subUserId: actorId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      description: `Customer: ${customer.name} added to CRM`,
      req,
      newData: { name: customer.name, email: customer.email }
    });

    // Create Notification for the Tray
    await (prisma as any).notification.create({
      data: {
        userId,
        type: 'customer',
        message: `New customer added: ${customer.name}`,
        isRead: false
      }
    });

    // Welcome email disabled by user request

    res.status(201).json({ message: 'Customer created successfully', customer })

  } catch (error: any) {
    console.error('Create customer error:', error)
    if (error.code === 'P2002') return res.status(400).json({ error: 'Customer with this email already exists' })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get customer by ID
router.get('/:id', authenticateToken, requirePermission('view_customers'), async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.orgId
    const actorId = req.user.id;
    const customer = await prisma.customer.findFirst({
      where: { id, userId },
      include: {
        bills: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, billNumber: true, totalAmount: true, status: true, paymentStatus: true, createdAt: true }
        }
      }
    })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.status(200).json({ customer })
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update customer
router.put('/:id', authenticateToken, requirePermission('edit_customers'), async (req: any, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, address, state, city, pincode, gstNumber, isActive, isMarkedRed } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id;

    const { validateAddressFields } = require('../lib/addressValidation');
    const addressValidation = validateAddressFields({ address, city, state, pincode });
    if (!addressValidation.isValid) {
      return res.status(400).json({ error: addressValidation.error });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    if (normalizedEmail) {
      const { validateEmail } = require('../lib/validation');
      const emailValidation = validateEmail(normalizedEmail);
      if (!emailValidation.isValid) {
        return res.status(400).json({ error: emailValidation.error });
      }

      // Check for email uniqueness per organization
      const emailExists = await prisma.customer.findFirst({
        where: { userId, email: normalizedEmail, NOT: { id } }
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    if (!name) return res.status(400).json({ error: 'Customer name is required' })

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' })
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: { userId, name, NOT: { id } }
    })
    if (existingCustomer) return res.status(400).json({ error: `Another customer with name "${name}" already exists.` })

    const customer = await (prisma.customer as any).update({
      where: { id },
      data: { 
        name, 
        email: normalizedEmail, 
        phone: phone || null, 
        address: address || null, 
        state: state || null, 
        city: city || null, 
        pincode: pincode || null, 
        gstNumber: gstNumber || null,
        isActive: isActive !== undefined ? isActive : undefined,
        isMarkedRed: isMarkedRed !== undefined ? isMarkedRed : undefined
      }
    })

    const updatedCustomer = await prisma.customer.findFirst({ where: { id, userId } })
    if (!updatedCustomer) return res.status(404).json({ error: 'Customer not found' })

    // Audit Log: Update
    await recordAuditLog({
      userId: userId,
      subUserId: actorId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      description: `Customer: ${updatedCustomer.name} details updated`,
      req,
      newData: { name: updatedCustomer.name, email: updatedCustomer.email }
    });

    res.status(200).json({ message: 'Customer updated successfully', customer: updatedCustomer })
  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, requirePermission('delete_customers'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.orgId;
    const actorId = req.user.id;
    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    const customer = await prisma.customer.findFirst({
      where: userRole === 'ADMIN' ? { id } : { id, userId }
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    await prisma.customer.delete({ where: { id } });

    // Audit Log: Delete
    await recordAuditLog({
      userId: userId,
      subUserId: actorId,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
      description: `Customer: ${customer.name} removed from system`,
      req,
      oldData: { name: customer.name }
    });

    res.status(200).json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete customer due to an existing record constraint. Please contact support.' })
    }
    res.status(500).json({ error: 'Internal server error while removing customer' })
  }
})

export default router
