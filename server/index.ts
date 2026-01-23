import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import customerRoutes from './routes/customers'
import productRoutes from './routes/products'
import billRoutes from './routes/bills'

// Load environment variables
dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 5000

// ============================
// 🔥 CORS FIX (ONE-LINE LOGIC FIX)
// ============================
app.use(cors({ origin: true, credentials: true }))

// ============================

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BillSoft API Server is running' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/bills', billRoutes)

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Server Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log('')
  console.log('🚀 BillSoft API Server started successfully!')
  console.log(`📡 Server running on: http://localhost:${PORT}`)
  console.log(`🌐 Health check: http://localhost:${PORT}/health`)
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`)
  console.log('')
  console.log('Available endpoints:')
  console.log('  🔐 Auth: /api/auth/{register,login,profile}')
  console.log('  👥 Customers: /api/customers')
  console.log('  📦 Products: /api/products')
  console.log('  🧾 Bills: /api/bills')
  console.log('')
})
