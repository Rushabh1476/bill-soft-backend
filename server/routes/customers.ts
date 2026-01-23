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

// Get all customers
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const { search } = req.query
    const userId = req.user.userId

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { name, email, phone, address, gstNumber } = req.body
    const userId = req.user.userId

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' })
    }

    const customer = await prisma.customer.create({
      data: {
        userId,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        gstNumber: gstNumber || null
      }
    })

    res.status(201).json({ 
      message: 'Customer created successfully',
      customer 
    })

  } catch (error: any) {
    console.error('Create customer error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer with this email already exists' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get customer by ID
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const customer = await prisma.customer.findFirst({
      where: { 
        id: id,
        userId: userId
      }
    })

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.status(200).json({ customer })

  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update customer
router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, address, gstNumber } = req.body
    const userId = req.user.userId

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' })
    }

    const customer = await prisma.customer.updateMany({
      where: { 
        id: id,
        userId: userId
      },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        gstNumber: gstNumber || null
      }
    })

    if (customer.count === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Fetch the updated customer
    const updatedCustomer = await prisma.customer.findFirst({
      where: { 
        id: id,
        userId: userId
      }
    })

    res.status(200).json({ 
      message: 'Customer updated successfully',
      customer: updatedCustomer 
    })

  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete customer
router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const customer = await prisma.customer.deleteMany({
      where: { 
        id: id,
        userId: userId
      }
    })

    if (customer.count === 0) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    res.status(200).json({ message: 'Customer deleted successfully' })

  } catch (error: any) {
    console.error('Delete customer error:', error)
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete customer with existing bills' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router