import express from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Get all custom columns for a user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.orgId
    const { entity } = req.query
    
    const where: any = { userId, isActive: true }
    if (entity) {
      where.entity = entity
    }

    const columns = await (prisma as any).custom_columns.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    })
    res.status(200).json({ columns })
  } catch (error: any) {
    console.error('Get custom columns error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Create a new custom column
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.orgId
    const { name, label, dataType, entity, required } = req.body

    if (!name || !label || !entity) {
      return res.status(400).json({ error: 'Name, label, and entity are required' })
    }

    // Check if column with same name already exists for this entity
    const existing = await (prisma as any).custom_columns.findFirst({
      where: { userId, name, entity }
    })

    if (existing) {
      return res.status(400).json({ error: `Column '${label}' already exists for this entity` })
    }

    const column = await (prisma as any).custom_columns.create({
      data: {
        userId,
        name: name.toLowerCase().replace(/\s+/g, '_'),
        label,
        dataType: dataType || 'text',
        entity,
        required: !!required
      }
    })

    res.status(201).json({ column })
  } catch (error: any) {
    console.error('Create custom column error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Update a custom column
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.orgId
    const { id } = req.params
    const { label, dataType, required, isActive } = req.body

    const column = await (prisma as any).custom_columns.updateMany({
      where: { id, userId },
      data: {
        label,
        dataType,
        required,
        isActive
      }
    })

    res.status(200).json({ message: 'Column updated successfully' })
  } catch (error: any) {
    console.error('Update custom column error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Delete a custom column
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.orgId
    const { id } = req.params

    await (prisma as any).custom_columns.deleteMany({
      where: { id, userId }
    })

    res.status(200).json({ message: 'Column deleted successfully' })
  } catch (error: any) {
    console.error('Delete custom column error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
