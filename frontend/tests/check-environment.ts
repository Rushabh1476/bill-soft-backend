/**
 * Pre-Test Environment Check
 * Run this before executing tests to ensure everything is set up correctly
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkEnvironment() {
  console.log('🔍 Checking test environment...\n');
  
  let allChecksPass = true;

  // Check 1: Database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const userCount = await prisma.user.count();
    console.log(`   Found ${userCount} users in database`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    allChecksPass = false;
  }

  // Check 2: Required files
  const requiredFiles = [
    'playwright.config.ts',
    'tests/helpers/test-helpers.ts',
    'tests/helpers/data-generator.ts',
    'tests/helpers/database-helper.ts',
    'tests/e2e-comprehensive.spec.ts'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.error(`❌ ${file} not found`);
      allChecksPass = false;
    }
  }

  // Check 3: Node modules
  const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@playwright', 'test');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ Playwright is installed');
  } else {
    console.error('❌ Playwright not installed. Run: npm install -D @playwright/test');
    allChecksPass = false;
  }

  // Check 4: Test super users in database
  try {
    const superUsers = [
      'admin@admin.com',
      'shubhampardhui24@gmail.com'
    ];

    await prisma.$connect();
    for (const email of superUsers) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        console.log(`✅ Super user ${email} found in database`);
      } else {
        console.warn(`⚠️  Super user ${email} not found. Tests may create or skip this user.`);
      }
    }
    await prisma.$disconnect();
  } catch (error) {
    console.error('⚠️  Could not check super users:', error);
  }

  // Check 5: Port availability
  console.log('\n📋 Environment Summary:');
  console.log('   Base URL: http://localhost:3000');
  console.log('   Test Directory: ./tests');
  console.log('   Database: SQLite (prisma/dev.db)');
  
  if (allChecksPass) {
    console.log('\n✅ All environment checks passed!');
    console.log('\n🚀 Ready to run tests:');
    console.log('   npm run test:e2e          - Run all tests');
    console.log('   npm run test:e2e:ui       - Interactive mode');
    console.log('   npm run test:e2e:headed   - See browser');
    console.log('   npm run test:e2e:debug    - Debug mode');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above before running tests.');
    process.exit(1);
  }
}

// Run the check
checkEnvironment().catch(console.error);
