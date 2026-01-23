import express from 'express'
import prisma from '../../src/lib/prisma'
import { extractUserFromRequest } from '../../src/lib/auth'

const router = express.Router()

// Middleware to authenticate requests
const authenticateUser = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization
  const user = extractUserFromRequest(authHeader)
  
  if (!user) {
    return res.status(401).json({ error: 'Authorization required' })
  }
  
  req.user = user
  next()
}

// Helper function to generate bill number
const generateBillNumber = (): string => {
  const prefix = 'INV'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// Get all bills
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const { search, status, customerId } = req.query
    const userId = req.user.userId

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({ bills })

  } catch (error) {
    console.error('Get bills error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create bill
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { 
      customerId, 
      customerName, 
      customerEmail, 
      items, 
      status, 
      dueDate, 
      notes 
    } = req.body
    const userId = req.user.userId

    if (!customerId || !customerName || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Customer ID, customer name, and items are required' 
      })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const taxAmount = subtotal * 0.18 // 18% default tax
    const totalAmount = subtotal + taxAmount

    // Generate bill number
    const billNumber = generateBillNumber()

    const bill = await prisma.bill.create({
      data: {
        userId,
        customerId,
        billNumber,
        customerName,
        customerEmail: customerEmail || null,
        status: status?.toUpperCase() || 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      },
      include: {
        items: true
      }
    })

    res.status(201).json({ 
      message: 'Bill created successfully',
      bill 
    })

  } catch (error: any) {
    console.error('Create bill error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bill number already exists' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get, Update, Delete similar to other routes...
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const bill = await prisma.bill.findFirst({
      where: { id, userId },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    })

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' })
    }

    res.status(200).json({ bill })
  } catch (error) {
    console.error('Get bill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const { 
      customerId, 
      customerName, 
      customerEmail, 
      items, 
      status, 
      dueDate, 
      notes 
    } = req.body
    const userId = req.user.userId

    if (!customerId || !customerName || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Customer ID, customer name, and items are required' 
      })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const taxAmount = subtotal * 0.18
    const totalAmount = subtotal + taxAmount

    // Delete existing items
    await prisma.billItem.deleteMany({
      where: { billId: id }
    })

    // Update bill and create new items
    const bill = await prisma.bill.update({
      where: { id },
      data: {
        customerId,
        customerName,
        customerEmail: customerEmail || null,
        status: status?.toUpperCase() || 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      },
      include: {
        items: true
      }
    })

    res.status(200).json({ 
      message: 'Bill updated successfully',
      bill 
    })
  } catch (error: any) {
    console.error('Update bill error:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Bill not found' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Delete bill items first, then the bill
    await prisma.billItem.deleteMany({
      where: { billId: id }
    })

    const result = await prisma.bill.deleteMany({
      where: { id, userId }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: 'Bill not found' })
    }

    res.status(200).json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Delete bill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router