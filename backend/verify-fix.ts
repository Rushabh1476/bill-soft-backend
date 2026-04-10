import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying columns...');
  const customers = await prisma.customer.findMany({ take: 1, select: { isMarkedRed: true } });
  console.log('✅ Found isMarkedRed in customers:', customers);
  const products = await prisma.product.findMany({ take: 1, select: { isMarkedRed: true } });
  console.log('✅ Found isMarkedRed in products:', products);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Verification failed:', e.message);
    await prisma.$disconnect();
  });
