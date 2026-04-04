
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({
    where: { email: 'flyingmehul@gmail.com' }
  });

  console.log('User count for flyingmehul@gmail.com:', users.length);
  users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, ParentID: ${u.parentId}`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
