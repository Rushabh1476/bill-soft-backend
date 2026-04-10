import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.settings.deleteMany({
    where: { category: 'invoice' }
  });
}

main().then(() => console.log('Database reverted successfully')).catch(console.error);
