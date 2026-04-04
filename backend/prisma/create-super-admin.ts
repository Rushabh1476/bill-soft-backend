import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
    const emails = [
        'shubham@bill.com',
        'shubham@billsoft.com',
        'mehul@billsoft.com',
        'mahesh@billsoft.com',
        'subham@bill.com',
        'mehul@bill.com',
        'mahesh@bill.com'
    ]
    const password = 'Shubham@143'
    const hashedPassword = await hashPassword(password)

    console.log('🚀 Establishing Super Admin users...')

    // Ensure SUPER_ADMIN role exists
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' as any },
        update: {},
        create: {
            name: 'SUPER_ADMIN' as any,
            displayName: 'Super Administrator',
            description: 'Full global system access',
            isActive: true
        }
    })

    for (const email of emails) {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                roleId: superAdminRole.id as any
            },
            create: {
                email,
                password: hashedPassword,
                companyName: 'BillSoft Global',
                roleId: superAdminRole.id as any
            }
        })
        console.log(`✅ Super Admin established: ${user.email}`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Failed to create super admin users:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
