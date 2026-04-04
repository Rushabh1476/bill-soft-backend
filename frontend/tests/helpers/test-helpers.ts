import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: string;
  organizationId?: string;
}

export interface TestOrganization {
  id?: string;
  name: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  industry?: string;
}

export interface TestCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
}

export interface TestProduct {
  name: string;
  description: string;
  price: number;
  taxRate: number;
  stock: number;
  category: string;
  sku: string;
}

export interface TestBill {
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  dueDate?: string;
  notes?: string;
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export class TestHelpers {
  constructor(public page: Page) {}

  async login(email: string, password: string) {
    // Navigate specifically to login to ensure clear state
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for login form elements explicitly
    const emailInput = this.page.locator('input[name="email"], #email').first();
    const passwordInput = this.page.locator('input[name="password"], #password').first();
    const submitBtn = this.page.locator('button[type="submit"]').first();

    // Ensure elements are visible
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(passwordInput).toBeVisible({ timeout: 15000 });

    // Fill login form
    await emailInput.click();
    await emailInput.fill(email);
    
    await passwordInput.click();
    await passwordInput.fill(password);
    
    // Click login button
    await submitBtn.click();
    
    // Wait for a successful login indicator instead of a specific URL
    // All logged-in pages should have a user menu or logout button
    const logoutIndicator = this.page.locator('[aria-label*="account"], [aria-label*="user"], button:has-text("Logout")').first();
    
    try {
      await logoutIndicator.waitFor({ state: 'visible', timeout: 20000 });
      console.log(`   ✅ Login successful, current URL: ${this.page.url()}`);
    } catch (e) {
      console.error(`   ❌ Login failed or indicator not found. URL: ${this.page.url()}`);
      // Check for error message on the page
      const errorMsg = await this.page.locator('.MuiAlert-error, [role="alert"]').textContent().catch(() => null);
      if (errorMsg) console.error(`      Error on page: ${errorMsg}`);
      throw e;
    }
    
    // Additional wait for page content to stabilize
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    // Look for logout button or user menu
    const userMenuButton = this.page.locator('[aria-label*="account"], [aria-label*="user"], button:has-text("Logout")').first();
    if (await userMenuButton.isVisible({ timeout: 2000 })) {
      await userMenuButton.click();
      const logoutButton = this.page.locator('button:has-text("Logout"), [role="menuitem"]:has-text("Logout")').first();
      if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
      }
    }
    await this.page.waitForURL(/login|\/$/);
  }

  async navigateToCustomers() {
    await this.page.goto('/customers');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToProducts() {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToBills() {
    await this.page.goto('/bills');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAdmin() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async createCustomer(customer: TestCustomer) {
    await this.navigateToCustomers();
    
    // Click add customer button
    const addButton = this.page.locator('button:has-text("Add"), button:has-text("New Customer"), button:has-text("Create")').first();
    await addButton.click();
    
    // Fill customer form
    await this.page.locator('input[name="name"]').fill(customer.name);
    await this.page.locator('input[name="email"]').fill(customer.email);
    await this.page.locator('input[name="phone"]').fill(customer.phone);
    await this.page.locator('input[name="address"], textarea[name="address"]').fill(customer.address);
    
    if (customer.gstNumber) {
      const gstInput = this.page.locator('input[name="gstNumber"], input[name="gst_number"]');
      if (await gstInput.isVisible({ timeout: 1000 })) {
        await gstInput.fill(customer.gstNumber);
      }
    }
    
    // Submit form
    await this.page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button:has-text("Add Customer")').first().click();
    
    // Wait for success
    await this.page.waitForTimeout(1000);
  }

  async createProduct(product: TestProduct) {
    await this.navigateToProducts();
    
    // Click add product button
    const addButton = this.page.locator('button:has-text("Add"), button:has-text("New Product"), button:has-text("Create")').first();
    await addButton.click();
    
    // Fill product form
    await this.page.locator('input[name="name"]').fill(product.name);
    await this.page.locator('input[name="description"], textarea[name="description"]').fill(product.description);
    await this.page.locator('input[name="price"]').fill(product.price.toString());
    
    const taxRateInput = this.page.locator('input[name="taxRate"], input[name="tax_rate"]');
    if (await taxRateInput.isVisible({ timeout: 1000 })) {
      await taxRateInput.fill(product.taxRate.toString());
    }
    
    await this.page.locator('input[name="stock"]').fill(product.stock.toString());
    
    const categoryInput = this.page.locator('input[name="category"]');
    if (await categoryInput.isVisible({ timeout: 1000 })) {
      await categoryInput.fill(product.category);
    }
    
    const skuInput = this.page.locator('input[name="sku"]');
    if (await skuInput.isVisible({ timeout: 1000 })) {
      await skuInput.fill(product.sku);
    }
    
    // Submit form
    await this.page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button:has-text("Add Product")').first().click();
    
    // Wait for success
    await this.page.waitForTimeout(1000);
  }

  async createBill(bill: TestBill) {
    await this.navigateToBills();
    
    // Click add bill button
    const addButton = this.page.locator('button:has-text("Add"), button:has-text("New Bill"), button:has-text("Create"), button:has-text("Generate")').first();
    await addButton.click();
    
    await this.page.waitForTimeout(1000);
    
    // Select customer
    const customerSelect = this.page.locator('input[name="customerName"], input[placeholder*="customer"], select[name="customerId"]').first();
    await customerSelect.click();
    await this.page.waitForTimeout(500);
    await customerSelect.fill(bill.customerName);
    await this.page.waitForTimeout(500);
    
    // Select first match
    const customerOption = this.page.locator(`li:has-text("${bill.customerName}"), option:has-text("${bill.customerName}")`).first();
    if (await customerOption.isVisible({ timeout: 2000 })) {
      await customerOption.click();
    }
    
    // Add items
    for (let i = 0; i < bill.items.length; i++) {
      const item = bill.items[i];
      
      // Add item button (if not first item)
      if (i > 0) {
        const addItemButton = this.page.locator('button:has-text("Add Item"), button:has-text("Add Product")').first();
        if (await addItemButton.isVisible({ timeout: 1000 })) {
          await addItemButton.click();
          await this.page.waitForTimeout(500);
        }
      }
      
      // Fill item details
      const productInput = this.page.locator(`input[name="items[${i}].productName"], input[name="productName"]`).nth(i);
      await productInput.click();
      await productInput.fill(item.productName);
      await this.page.waitForTimeout(500);
      
      const productOption = this.page.locator(`li:has-text("${item.productName}"), option:has-text("${item.productName}")`).first();
      if (await productOption.isVisible({ timeout: 2000 })) {
        await productOption.click();
      }
      
      const quantityInput = this.page.locator(`input[name="items[${i}].quantity"], input[name="quantity"]`).nth(i);
      await quantityInput.fill(item.quantity.toString());
    }
    
    // Add notes if provided
    if (bill.notes) {
      const notesInput = this.page.locator('textarea[name="notes"], input[name="notes"]');
      if (await notesInput.isVisible({ timeout: 1000 })) {
        await notesInput.fill(bill.notes);
      }
    }
    
    // Submit form
    await this.page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button:has-text("Generate Bill")').first().click();
    
    // Wait for success
    await this.page.waitForTimeout(2000);
  }

  async createSupplier(supplier: { name: string; email: string; phone: string; address: string }) {
    await this.page.goto('/suppliers');
    await this.page.waitForLoadState('networkidle');

    const addButton = this.page.locator('button:has-text("Add"), button:has-text("New Supplier")').first();
    await addButton.click();

    await this.page.locator('input[name="name"]').fill(supplier.name);
    await this.page.locator('input[name="email"]').fill(supplier.email);
    await this.page.locator('input[name="phone"]').fill(supplier.phone);
    await this.page.locator('input[name="address"], textarea[name="address"]').fill(supplier.address);

    await this.page.locator('button[type="submit"]:has-text("Save"), button:has-text("Create")').first().click();
    await this.page.waitForTimeout(1000);
  }

  async createPurchaseOrder(po: { supplierName: string; productName: string; quantity: number }) {
    await this.page.goto('/purchase-orders');
    await this.page.waitForLoadState('networkidle');

    const addButton = this.page.locator('button:has-text("Create PO"), button:has-text("Add")').first();
    await addButton.click();

    // Select Supplier
    await this.page.locator('label:has-text("Supplier") + div').click();
    await this.page.locator(`li:has-text("${po.supplierName}")`).first().click();

    // Select Product
    await this.page.locator('label:has-text("Select Product") + div').click();
    await this.page.locator(`li:has-text("${po.productName}")`).first().click();

    // Set Quantity
    await this.page.locator('input[name="quantity"], label:has-text("Qty") + div input').fill(po.quantity.toString());

    // Click Add
    await this.page.locator('button:has-text("Add")').click();

    // Submit PO
    await this.page.locator('button:has-text("Create Purchase Order")').click();
    await this.page.waitForTimeout(2000);
  }

  async waitForSuccess(message?: string) {
    // Wait for success notification
    const successLocator = message 
      ? this.page.locator(`.MuiAlert-success:has-text("${message}"), .success:has-text("${message}")`)
      : this.page.locator('.MuiAlert-success, .success, [role="alert"]:has-text("Success")');
    
    await successLocator.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getRowCount(tableSelector: string = 'table') {
    const rows = await this.page.locator(`${tableSelector} tbody tr`).count();
    return rows;
  }

  generateRandomEmail(): string {
    return `test${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`;
  }

  generateRandomPhone(): string {
    return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  generateGSTNumber(): string {
    const stateCode = Math.floor(Math.random() * 35) + 1;
    const panNumber = Array(10).fill(0).map(() => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('').substring(0, 10);
    const entityCode = '1';
    const checkDigit = 'Z';
    const defaultCode = Math.floor(Math.random() * 10);
    
    return `${stateCode.toString().padStart(2, '0')}${panNumber}${entityCode}${checkDigit}${defaultCode}`;
  }
}

export const SUPER_USERS = [
  {
    email: 'flyingmehul@gmail.com',
    password: 'Shubham@143',
    name: 'Mehul'
  },
  {
    email: 'admin@admin.com',
    password: 'Shubham@143',
    name: 'Super Admin 1'
  }
];

export const ORGANIZATION_DATA: TestOrganization[] = [
  {
    name: 'TechCorp Solutions',
    adminEmail: 'admin@techcorp.com',
    adminPassword: 'Shubham@143',
    adminName: 'John Smith',
    industry: 'Technology'
  },
  {
    name: 'HealthCare Plus',
    adminEmail: 'admin@healthcare.com',
    adminPassword: 'Shubham@143',
    adminName: 'Sarah Johnson',
    industry: 'Healthcare'
  },
  {
    name: 'FinanceHub',
    adminEmail: 'admin@financehub.com',
    adminPassword: 'Shubham@143',
    adminName: 'Michael Brown',
    industry: 'Finance'
  },
  {
    name: 'RetailMart',
    adminEmail: 'admin@retailmart.com',
    adminPassword: 'Shubham@143',
    adminName: 'Emily Davis',
    industry: 'Retail'
  },
  {
    name: 'EduLearn Academy',
    adminEmail: 'admin@edulearn.com',
    adminPassword: 'Shubham@143',
    adminName: 'David Wilson',
    industry: 'Education'
  }
];

// Additional admin for one organization
export const ADDITIONAL_ADMIN = {
  organizationIndex: 0, // TechCorp Solutions
  email: 'admin2@techcorp.com',
  password: 'Shubham@143',
  name: 'Jane Doe'
};

export const USER_ROLES = ['ADMIN', 'FINANCE', 'OPERATOR', 'READONLY'];

export const SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Hospitality',
  'Transportation',
  'Entertainment',
  'Agriculture',
  'Energy',
  'Telecommunications',
  'Consulting',
  'Legal Services'
];
