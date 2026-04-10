import express from 'express'
import prisma from '../lib/prisma'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = express.Router()

// Get all expenses
router.get('/', authenticateToken, requirePermission('view_expenses'), async (req: any, res) => {
    try {
        const userId = req.user.orgId
        const actorId = req.user.id;
        const expenses = await (prisma as any).expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        })

        // Calculate category breakdown
        const breakdown = expenses.reduce((acc: any, exp: any) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount
            return acc
        }, {})

        res.status(200).json({ expenses, categoryBreakdown: breakdown })
    } catch (error) {
        console.error('Get expenses error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// Create expense
router.post('/', authenticateToken, requirePermission('manage_expenses'), async (req: any, res) => {
    try {
        const userId = req.user.orgId
        const actorId = req.user.id;
        const { title, category, amount, gstAmount, description, date } = req.body

        if (!title || !category || !amount) {
            return res.status(400).json({ error: 'Title, category, and amount are required' })
        }

        const expense = await (prisma as any).expense.create({
            data: {
                userId,
                title,
                category,
                amount: Number(amount),
                gstAmount: Number(gstAmount) || 0,
                description,
                date: date ? new Date(date) : new Date()
            }
        })

        res.status(201).json(expense)
    } catch (error: any) {
        console.error('Create expense error:', error)
        res.status(500).json({ error: error.message || 'Internal server error' })
    }
})

export default router
