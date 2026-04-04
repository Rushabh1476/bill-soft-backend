
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const admin = await prisma.user.findFirst({
    where: { email: 'flyingmehul@gmail.com' } // Assuming this is the admin
  });

  if (!admin) {
    console.error('Admin not found');
    return;
  }

  console.log('Testing as Admin:', admin.name, admin.email, admin.id);

  // Search for an existing role
  const role = await (prisma.role as any).findFirst();
  if (!role) {
    console.error('No roles found in DB');
    return;
  }

  const testEmail = `test_${Date.now()}@example.com`;

  console.log('Creating user...');
  const newUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: testEmail,
      password: 'password123',
      role: { connect: { id: role.id } },
      parent: { connect: { id: admin.id } }
    }
  });
  console.log('Created User ID:', newUser.id);

  console.log('Fetching users for Admin...');
  const allSubUsers = await prisma.user.findMany({
    where: {
      parent: { id: admin.id }
    }
  });

  console.log('Number of sub-users found:', allSubUsers.length);
  allSubUsers.forEach(u => console.log(`- ${u.email} (Parent ID: ${u.parentId})`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
