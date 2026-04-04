
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({
    include: {
      parent: true,
      role: true,
      subUsers: true
    }
  });

  console.log('Total users in DB:', users.length);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, ParentID: ${u.parentId}, Role: ${u.role?.name || 'NONE'}`);
    if (u.subUsers.length > 0) {
      console.log(`  Sub-users: ${u.subUsers.map(su => su.email).join(', ')}`);
    }
  });
}

test().catch(console.error).finally(() => prisma.$disconnect());
