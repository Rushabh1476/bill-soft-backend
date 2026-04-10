import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed for multiple industries...')

    // 1. Tech Startup Demo
    const techPassword = await hashPassword('tech123')
    const techUser = await prisma.user.upsert({
        where: { email: 'tech@billsoft.com' },
        update: {},
        create: {
            email: 'tech@billsoft.com',
            password: techPassword,
            companyName: 'Tech Innovations LLC'
        }
    })

    // 2. Retail Shop Demo
    const retailPassword = await hashPassword('retail123')
    const retailUser = await prisma.user.upsert({
        where: { email: 'retail@billsoft.com' },
        update: {},
        create: {
            email: 'retail@billsoft.com',
            password: retailPassword,
            companyName: 'General Goods Store'
        }
    })

    // 3. Healthcare Clinic Demo
    const healthPassword = await hashPassword('health123')
    const healthUser = await prisma.user.upsert({
        where: { email: 'health@billsoft.com' },
        update: {},
        create: {
            email: 'health@billsoft.com',
            password: healthPassword,
            companyName: 'City Care Clinic'
        }
    })

    console.log('✅ Created demo users for Tech, Retail, and Healthcare')

    // Create Customers for Tech
    const techCustomer = await prisma.customer.upsert({
        where: { id: 'tech-customer-1' },
        update: {},
        create: {
            id: 'tech-customer-1',
            userId: techUser.id,
            name: 'Startup Alpha',
            email: 'alpha@startup.com',
            phone: '+1-555-1001',
            address: '100 Tech Blvd',
        }
    })

    // Create Customers for Retail
    const retailCustomer = await prisma.customer.upsert({
        where: { id: 'retail-customer-1' },
        update: {},
        create: {
            id: 'retail-customer-1',
            userId: retailUser.id,
            name: 'Walk-in Customer',
            email: 'guest@walkin.com',
            phone: '+1-555-2001',
            address: 'N/A',
        }
    })

    // Create Customers for Health
    const healthCustomer = await prisma.customer.upsert({
        where: { id: 'health-customer-1' },
        update: {},
        create: {
            id: 'health-customer-1',
            userId: healthUser.id,
            name: 'John Doe',
            email: 'johndoe@patient.com',
            phone: '+1-555-3001',
            address: '123 Health Ave',
        }
    })

    console.log('✅ Created demo customers for each industry')

    // Create Products/Services
    const techProduct = await prisma.product.upsert({
        where: { id: 'tech-product-1' },
        update: {},
        create: {
            id: 'tech-product-1',
            userId: techUser.id,
            name: 'SaaS Subscription (Monthly)',
            price: 299.00,
            stock: 1000,
            category: 'Software',
            sku: 'SAAS-MO'
        }
    })

    const retailProduct = await prisma.product.upsert({
        where: { id: 'retail-product-1' },
        update: {},
        create: {
            id: 'retail-product-1',
            userId: retailUser.id,
            name: 'Premium Coffee Beans',
            price: 15.00,
            stock: 200,
            category: 'Groceries',
            sku: 'COF-001'
        }
    })

    const healthProduct = await prisma.product.upsert({
        where: { id: 'health-product-1' },
        update: {},
        create: {
            id: 'health-product-1',
            userId: healthUser.id,
            name: 'General Consultation',
            price: 150.00,
            stock: 10000,
            category: 'Services',
            sku: 'CONSULT-01'
        }
    })

    console.log('✅ Created demo products/services for each industry')

    // Create Bills
    await prisma.bill.upsert({
        where: { id: 'tech-bill-1' },
        update: {},
        create: {
            id: 'tech-bill-1',
            userId: techUser.id,
            customerId: techCustomer.id,
            billNumber: 'TECH-2024-001',
            customerName: techCustomer.name,
            status: 'PAID',
            subtotal: 299.00,
            taxAmount: 53.82,
            totalAmount: 352.82,
            dueDate: new Date(),
            items: {
                create: [{
                    productId: techProduct.id,
                    productName: techProduct.name,
                    quantity: 1,
                    price: 299.00,
                    total: 299.00
                }]
            }
        }
    })

    await prisma.bill.upsert({
        where: { id: 'retail-bill-1' },
        update: {},
        create: {
            id: 'retail-bill-1',
            userId: retailUser.id,
            customerId: retailCustomer.id,
            billNumber: 'RET-2024-001',
            customerName: retailCustomer.name,
            status: 'PAID',
            subtotal: 30.00,
            taxAmount: 1.50,
            totalAmount: 31.50,
            dueDate: new Date(),
            items: {
                create: [{
                    productId: retailProduct.id,
                    productName: retailProduct.name,
                    quantity: 2,
                    price: 15.00,
                    total: 30.00
                }]
            }
        }
    })

    await prisma.bill.upsert({
        where: { id: 'health-bill-1' },
        update: {},
        create: {
            id: 'health-bill-1',
            userId: healthUser.id,
            customerId: healthCustomer.id,
            billNumber: 'HLTH-2024-001',
            customerName: healthCustomer.name,
            status: 'PENDING',
            subtotal: 150.00,
            taxAmount: 0.00, // No tax on medical
            totalAmount: 150.00,
            dueDate: new Date(),
            items: {
                create: [{
                    productId: healthProduct.id,
                    productName: healthProduct.name,
                    quantity: 1,
                    price: 150.00,
                    total: 150.00
                }]
            }
        }
    })

    console.log('✅ Created demo bills for each industry')
    console.log('🎉 Multi-industry database seed completed!')
    console.log('')
    console.log('Credentials:')
    console.log('- tech@billsoft.com / tech123')
    console.log('- retail@billsoft.com / retail123')
    console.log('- health@billsoft.com / health123')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
