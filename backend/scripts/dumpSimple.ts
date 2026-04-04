
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, parentId: true }
  });

  users.forEach(u => console.log(`${u.id}|${u.parentId}|${u.email}`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
