import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to add missing columns...');
  
  const tables = ['products', 'customers', 'suppliers'];
  
  for (const table of tables) {
    try {
      console.log(`Checking table: ${table}`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN is_marked_red BOOLEAN NOT NULL DEFAULT 0`);
      console.log(`✅ Successfully added is_marked_red to ${table}`);
    } catch (error: any) {
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log(`ℹ️  Column is_marked_red already exists in ${table}`);
      } else {
        console.error(`❌ Error updating ${table}:`, error.message);
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Done.');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
