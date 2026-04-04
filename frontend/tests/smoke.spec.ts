import { test, expect } from '@playwright/test';
import { TestHelpers, SUPER_USERS } from './helpers/test-helpers';

/**
 * Quick smoke test to verify the test setup is working
 */

test.describe('Smoke Test - Basic Setup Verification', () => {
  test('Can navigate to application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Billing|Invoice|Login/i);
    console.log('✅ Application is accessible');
  });

  test('Super user can login', async ({ page }) => {
    const helpers = new TestHelpers(page);
    const superUser = SUPER_USERS[0];
    
    console.log(`\n🔐 Testing login for: ${superUser.email}`);
    
    try {
      await helpers.login(superUser.email, superUser.password);
      await expect(page).toHaveURL(/dashboard|bills|customers/, { timeout: 15000 });
      console.log('✅ Super user logged in successfully');
      
      await helpers.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Login test failed:', error);
      throw error;
    }
  });

  test('Can navigate to main pages', async ({ page }) => {
    const helpers = new TestHelpers(page);
    
    await helpers.login(SUPER_USERS[0].email, SUPER_USERS[0].password);
    
    console.log('\n📄 Testing navigation...');
    
    // Test Bills page
    await helpers.navigateToBills();
    console.log('✅ Bills page accessible');
    
    // Test Customers page
    await helpers.navigateToCustomers();
    console.log('✅ Customers page accessible');
    
    // Test Products page
    await helpers.navigateToProducts();
    console.log('✅ Products page accessible');
    
    await helpers.logout();
    console.log('\n✅ All smoke tests passed!');
  });
});
