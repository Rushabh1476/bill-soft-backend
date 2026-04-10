import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING SCHEMA PATCH ---');
  
  const tables = ['products', 'customers', 'suppliers'];
  
  for (const table of tables) {
    console.log(`\nProcessing: ${table}`);
    try {
      // Different SQLite versions have different behaviors for ADD COLUMN
      // but "ALTER TABLE ... ADD COLUMN ..." is standard.
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN is_marked_red BOOLEAN NOT NULL DEFAULT 0`);
      console.log(`✅ SUCCESS: Added is_marked_red to ${table}`);
    } catch (error: any) {
      const msg = error.message.toLowerCase();
      if (msg.includes('duplicate') || msg.includes('already exists')) {
        console.log(`ℹ️  INFO: Column already exists in ${table}`);
      } else {
        console.error(`❌ ERROR in ${table}: ${error.message}`);
      }
    }
  }
  console.log('\n--- PATCH COMPLETE ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
