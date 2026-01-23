import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed for 100 entries...')

  // 1. Demo User banana (Login ke liye)
  const hashedPassword = await hashPassword('demo123')
  const user = await prisma.user.upsert({
    where: { email: 'demo@billsoft.com' },
    update: {},
    create: {
      email: 'demo@billsoft.com',
      password: hashedPassword,
      companyName: 'BillSoft Demo Company'
    }
  })

  console.log('✅ Demo user ready: demo@billsoft.com')

  // 2. Loop chala kar 100 Customers banana
  console.log('⏳ Creating 100 customers...')
  for (let i = 1; i <= 100; i++) {
    await prisma.customer.create({
      data: {
        userId: user.id,
        name: `Test Customer ${i}`,
        email: `customer${i}@billsoft.com`,
        phone: `+91-9999999${i.toString().padStart(2, '0')}`,
        address: `${i} Business Street, Tech Park`,
        gstNumber: `27AAACR${i}123Z${i}`
      }
    })
  }

  // 3. Loop chala kar 100 Products banana
  console.log('⏳ Creating 100 products...')
  for (let i = 1; i <= 100; i++) {
    await prisma.product.create({
      data: {
        userId: user.id,
        name: `Service Package ${i}`,
        description: `High quality professional service number ${i}`,
        price: 1000 + (i * 10),
        taxRate: 0.18,
        stock: 50 + i,
        category: i % 2 === 0 ? 'Services' : 'Products',
        sku: `SKU-PROD-${i.toString().padStart(3, '0')}`
      }
    })
  }

  console.log('🎉 Done! 100 Customers and 100 Products created successfully!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })