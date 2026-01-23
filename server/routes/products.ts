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

// Get all products
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const { search } = req.query
    const userId = req.user.userId

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search } }
      ]
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({ products })

  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create product
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { name, description, price, taxRate, stock, category, sku } = req.body
    const userId = req.user.userId

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' })
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' })
    }

    const product = await prisma.product.create({
      data: {
        userId,
        name,
        description: description || null,
        price: parseFloat(price),
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        stock: stock ? parseInt(stock) : 0,
        category: category || null,
        sku: sku || null
      }
    })

    res.status(201).json({ 
      message: 'Product created successfully',
      product 
    })

  } catch (error: any) {
    console.error('Create product error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this SKU already exists' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get, Update, Delete product routes similar to customers...
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const product = await prisma.product.findFirst({
      where: { id, userId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.status(200).json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const { name, description, price, taxRate, stock, category, sku } = req.body
    const userId = req.user.userId

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' })
    }

    const result = await prisma.product.updateMany({
      where: { id, userId },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        stock: stock ? parseInt(stock) : 0,
        category: category || null,
        sku: sku || null
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const product = await prisma.product.findFirst({
      where: { id, userId }
    })

    res.status(200).json({ 
      message: 'Product updated successfully',
      product 
    })
  } catch (error: any) {
    console.error('Update product error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product with this SKU already exists' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await prisma.product.deleteMany({
      where: { id, userId }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Delete product error:', error)
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete product with existing bill items' })
    }
    
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router