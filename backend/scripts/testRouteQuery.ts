
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const adminId = 'cmn4fhow30001uaa04at1o46o'; // flyingmehul@gmail.com
  console.log('Testing GET /admin/users for Admin:', adminId);

  const users = await prisma.user.findMany({
    where: {
      parent: { id: adminId }
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      isEmployee: true,
      role: {
        select: {
          name: true
        }
      },
      createdAt: true,
      lastLoginAt: true,
      permissions: true
    }
  });

  console.log('Results found:', users.length);
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role?.name})`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
