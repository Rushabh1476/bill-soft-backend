
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogos() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, logoUrl: true }
  });
  console.log('Users and their Logo URLs:');
  console.table(users);
  
  const bills = await prisma.bill.findMany({
    take: 5,
    select: { id: true, billNumber: true, userId: true }
  });
  console.log('Sample Bills:');
  console.table(bills);
}

checkLogos().catch(console.error).finally(() => prisma.$disconnect());
