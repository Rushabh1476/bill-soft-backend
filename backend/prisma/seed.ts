import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo user
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

  console.log('✅ Created demo user:', user.email)

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        userId: user.id,
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        address: '123 Business St, Tech City, TC 12345',
        gstNumber: 'GST123456789'
      }
    }),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        userId: user.id,
        name: 'TechStart Inc',
        email: 'billing@techstart.com',
        phone: '+1-555-0456',
        address: '456 Startup Ave, Innovation Hub, IH 67890',
        gstNumber: 'GST987654321'
      }
    }),
    prisma.customer.upsert({
      where: { id: 'customer-3' },
      update: {},
      create: {
        id: 'customer-3',
        userId: user.id,
        name: 'Global Solutions Ltd',
        email: 'finance@globalsolutions.com',
        phone: '+1-555-0789',
        address: '789 Enterprise Blvd, Business Park, BP 11111'
      }
    })
  ])

  console.log('✅ Created demo customers:', customers.length)

  // Create demo products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        userId: user.id,
        name: 'Web Development Service',
        description: 'Custom website development and design',
        price: 2500.00,
        taxRate: 0.18,
        stock: 100,
        category: 'Services',
        sku: 'WEB-DEV-001'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        userId: user.id,
        name: 'Mobile App Development',
        description: 'iOS and Android app development',
        price: 5000.00,
        taxRate: 0.18,
        stock: 50,
        category: 'Services',
        sku: 'MOB-DEV-001'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        userId: user.id,
        name: 'Digital Marketing Package',
        description: 'SEO, Social Media, and Content Marketing',
        price: 1500.00,
        taxRate: 0.18,
        stock: 25,
        category: 'Marketing',
        sku: 'DIG-MKT-001'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-4' },
      update: {},
      create: {
        id: 'product-4',
        userId: user.id,
        name: 'Consulting Hours',
        description: 'Technical consulting and strategy sessions',
        price: 150.00,
        taxRate: 0.18,
        stock: 1000,
        category: 'Consulting',
        sku: 'CON-HRS-001'
      }
    })
  ])

  console.log('✅ Created demo products:', products.length)

  // Create demo bills
  const bills = await Promise.all([
    prisma.bill.upsert({
      where: { id: 'bill-1' },
      update: {},
      create: {
        id: 'bill-1',
        userId: user.id,
        customerId: customers[0].id,
        billNumber: 'INV-2024-001',
        customerName: customers[0].name,
        customerEmail: customers[0].email,
        status: 'PAID',
        subtotal: 2500.00,
        taxAmount: 450.00,
        totalAmount: 2950.00,
        dueDate: new Date('2024-12-15'),
        notes: 'Website development project completed successfully',
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              quantity: 1,
              price: 2500.00,
              total: 2500.00
            }
          ]
        }
      }
    }),
    prisma.bill.upsert({
      where: { id: 'bill-2' },
      update: {},
      create: {
        id: 'bill-2',
        userId: user.id,
        customerId: customers[1].id,
        billNumber: 'INV-2024-002',
        customerName: customers[1].name,
        customerEmail: customers[1].email,
        status: 'PENDING',
        subtotal: 6500.00,
        taxAmount: 1170.00,
        totalAmount: 7670.00,
        dueDate: new Date('2024-12-30'),
        notes: 'Mobile app development and consulting package',
        items: {
          create: [
            {
              productId: products[1].id,
              productName: products[1].name,
              quantity: 1,
              price: 5000.00,
              total: 5000.00
            },
            {
              productId: products[3].id,
              productName: products[3].name,
              quantity: 10,
              price: 150.00,
              total: 1500.00
            }
          ]
        }
      }
    }),
    prisma.bill.upsert({
      where: { id: 'bill-3' },
      update: {},
      create: {
        id: 'bill-3',
        userId: user.id,
        customerId: customers[2].id,
        billNumber: 'INV-2024-003',
        customerName: customers[2].name,
        customerEmail: customers[2].email,
        status: 'DRAFT',
        subtotal: 1500.00,
        taxAmount: 270.00,
        totalAmount: 1770.00,
        dueDate: new Date('2024-12-20'),
        notes: 'Digital marketing campaign setup',
        items: {
          create: [
            {
              productId: products[2].id,
              productName: products[2].name,
              quantity: 1,
              price: 1500.00,
              total: 1500.00
            }
          ]
        }
      }
    })
  ])

  console.log('✅ Created demo bills:', bills.length)

  // Create all roles from UserRole enum
  console.log('🌱 Seeding roles...')
  const roles = [
    { name: 'ADMIN', displayName: 'Administrator', description: 'Full system access' },
    { name: 'MANAGER', displayName: 'Manager', description: 'Can manage team and data' },
    { name: 'ACCOUNTANT', displayName: 'Accountant', description: 'Financial data access' },
    { name: 'VIEWER', displayName: 'Viewer', description: 'Read-only access' },
    { name: 'FINANCE', displayName: 'Finance', description: 'Finance specific access' },
    { name: 'OPERATOR', displayName: 'Operator', description: 'Standard operator access' },
    { name: 'READONLY', displayName: 'Read Only', description: 'View only access' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name as any },
      update: {},
      create: {
        name: role.name as any,
        displayName: role.displayName,
        description: role.description,
        isActive: true
      }
    });
  }
  console.log('✅ Created roles:', roles.length)

  // Seed Security Settings
  console.log('🌱 Seeding security settings...')
  const securitySettings = [
    { key: 'password_strength', category: 'security', value: 'strong', valueType: 'STRING', displayName: 'Password Strength', group: 'System' },
    { key: 'login_attempts_limit', category: 'security', value: '5', valueType: 'NUMBER', displayName: 'Login Attempts Limit', group: 'System' },
    { key: 'session_timeout', category: 'security', value: '30', valueType: 'NUMBER', displayName: 'Session Timeout', group: 'System' }
  ];

  for (const s of securitySettings) {
    await prisma.settings.upsert({
      where: { category_key: { category: s.category, key: s.key } },
      update: {},
      create: {
        category: s.category,
        key: s.key,
        value: s.value,
        valueType: s.valueType as any,
        displayName: s.displayName,
        group: s.group,
        isSystemSetting: true
      }
    });
  }
  console.log('✅ Created security settings')

  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('Demo login credentials:')
  console.log('Email: demo@billsoft.com')
  console.log('Password: demo123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
