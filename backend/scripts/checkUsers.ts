
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, parent: true }
  });
  console.log('Total Users:', users.length);
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) | Role: ${u.role?.name} | Parent: ${u.parent?.email || 'NONE'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
