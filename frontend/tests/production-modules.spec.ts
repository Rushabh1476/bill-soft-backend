import { test, expect } from '@playwright/test';
import { TestHelpers, SUPER_USERS } from './helpers/test-helpers';

/**
 * UI Test Suite for Core Modules: Product, Purchase Orders, and Admin Panel
 */

test.describe('Module UI Testing - Product, PO, and Admin', () => {
  test.setTimeout(60000); // Increase timeout for core UI flows
  let helpers: TestHelpers;
  const testData = {
    productName: `Test Product ${Date.now()}`,
    supplierName: `Test Supplier ${Date.now()}`,
    sku: `SKU-${Math.floor(Math.random() * 10000)}`
  };

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Login as admin
    await helpers.login(SUPER_USERS[0].email, SUPER_USERS[0].password);
  });

  test('Module 1: Product Management', async ({ page }) => {
    console.log(`\n📦 Testing Product Module: ${testData.productName}`);
    
    await helpers.navigateToProducts();
    
    // Create a new product
    await helpers.createProduct({
      name: testData.productName,
      description: 'Automated test product description',
      price: 1500,
      taxRate: 18,
      stock: 100,
      category: 'Electronics',
      sku: testData.sku
    });
    
    // Verify product appears in the list
    await page.goto('/products');
    await expect(page.locator(`text=${testData.productName}`)).toBeVisible({ timeout: 10000 });
    console.log('✅ Product created and verified in UI');
  });

  test('Module 2: Purchase Orders', async ({ page }) => {
    console.log(`\n🛒 Testing Purchase Orders Module`);
    
    // First, ensure we have a supplier
    console.log(`   - Creating dependency: Supplier (${testData.supplierName})`);
    await helpers.createSupplier({
      name: testData.supplierName,
      email: `supplier-${Date.now()}@example.com`,
      phone: '9876543210',
      address: '123 Supply Lane, Industrial Area'
    });
    
    // Ensure we have a product (reusing from previous test if possible, but testing is independent)
    const poProductName = `PO Product ${Date.now()}`;
    await helpers.createProduct({
      name: poProductName,
      description: 'Product for PO test',
      price: 500,
      taxRate: 5,
      stock: 50,
      category: 'Raw Material',
      sku: `RAW-${Date.now()}`
    });

    console.log(`   - Creating Purchase Order`);
    await helpers.createPurchaseOrder({
      supplierName: testData.supplierName,
      productName: poProductName,
      quantity: 10
    });
    
    // Verify PO appears in list
    await page.goto('/purchase-orders');
    await expect(page.locator(`text=${testData.supplierName}`)).toBeVisible({ timeout: 10000 });
    console.log('✅ Purchase Order created and verified in UI');
  });

  test('Module 3: Admin Panel', async ({ page }) => {
    console.log(`\n⚙️ Testing Admin Panel`);
    
    // Navigate to Admin Users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Verify Admin title/header
    await expect(page.locator('h4:has-text("User Management"), h1:has-text("Admin")')).toBeVisible({ timeout: 10000 });
    
    // Verify at least one user (the current admin) is visible
    await expect(page.locator(`text=${SUPER_USERS[0].email}`)).toBeVisible();
    
    // Check for audit logs if available
    await page.goto('/admin/logs');
    const logsHeader = page.locator('h4:has-text("Audit Logs"), h1:has-text("Security")');
    if (await logsHeader.isVisible({ timeout: 5000 })) {
       console.log('✅ Audit Logs page verified');
    }

    console.log('✅ Admin Panel navigation and basic content verified');
  });

  test.afterEach(async () => {
    await helpers.logout();
  });
});
