import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const roleIdToCheck = 'cmmw157ai0008uaqco6p9x256';
  const role = await prisma.role.findUnique({ where: { id: roleIdToCheck } });
  console.log(`Role ${roleIdToCheck} exists:`, !!role);
  if (!role) {
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    console.log('Current ADMIN Role ID:', adminRole?.id);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
