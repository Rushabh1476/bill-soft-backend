import express from 'express'
import prisma from '../../src/lib/prisma'
import { hashPassword, verifyPassword, createAuthResponse } from '../../src/lib/auth'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        companyName: companyName || null
      }
    })

    const authResponse = createAuthResponse(user)
    
    res.status(201).json({
      message: 'User created successfully',
      ...authResponse
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const authResponse = createAuthResponse(user)
    
    res.status(200).json({
      message: 'Login successful',
      ...authResponse
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const token = authHeader.substring(7)
    const { extractUserFromRequest } = await import('../../src/lib/auth')
    const user = extractUserFromRequest(authHeader)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Get user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        companyName: true,
        logoUrl: true,
        createdAt: true
      }
    })

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ user: userProfile })

  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router