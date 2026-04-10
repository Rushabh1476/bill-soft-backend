import { Customer } from '../types/customer';
import { Product } from '../types/product';
import { Bill } from '../types/bill';

// Sample Customers
export const sampleCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    phone: '+91 9876543210',
    address: '123 Business Park, Sector 5, Mumbai, Maharashtra 400001',
    createdAt: new Date('2024-09-15').toISOString(),
    updatedAt: new Date('2024-09-15').toISOString()
  },
  {
    id: 'cust-002',
    name: 'TechStart Solutions',
    email: 'hello@techstart.in',
    phone: '+91 8765432109',
    address: '456 Innovation Hub, Whitefield, Bangalore, Karnataka 560066',
    createdAt: new Date('2024-09-20').toISOString(),
    updatedAt: new Date('2024-09-20').toISOString()
  },
  {
    id: 'cust-003',
    name: 'Global Enterprises',
    email: 'info@globalent.com',
    phone: '+91 7654321098',
    address: '789 Commercial Complex, Connaught Place, New Delhi 110001',
    createdAt: new Date('2024-10-01').toISOString(),
    updatedAt: new Date('2024-10-01').toISOString()
  },
  {
    id: 'cust-004',
    name: 'Local Business Co.',
    email: 'contact@localbiz.in',
    phone: '+91 6543210987',
    address: '321 Market Street, Pune, Maharashtra 411001',
    createdAt: new Date('2024-10-05').toISOString(),
    updatedAt: new Date('2024-10-05').toISOString()
  },
  {
    id: 'cust-005',
    name: 'Digital Dynamics',
    email: 'team@digitaldynamics.com',
    phone: '+91 5432109876',
    address: '654 Tech Tower, Electronic City, Bangalore, Karnataka 560100',
    createdAt: new Date('2024-10-08').toISOString(),
    updatedAt: new Date('2024-10-08').toISOString()
  }
];

// Sample Products
export const sampleProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Web Development Service',
    description: 'Complete web development solution with modern technologies',
    price: 50000,
    stock: 10,
    createdAt: new Date('2024-09-01').toISOString(),
    updatedAt: new Date('2024-09-01').toISOString()
  },
  {
    id: 'prod-002',
    name: 'Mobile App Development',
    description: 'Cross-platform mobile application development',
    price: 75000,
    stock: 5,
    createdAt: new Date('2024-09-05').toISOString(),
    updatedAt: new Date('2024-09-05').toISOString()
  },
  {
    id: 'prod-003',
    name: 'UI/UX Design Service',
    description: 'Professional user interface and user experience design',
    price: 25000,
    stock: 15,
    createdAt: new Date('2024-09-10').toISOString(),
    updatedAt: new Date('2024-09-10').toISOString()
  },
  {
    id: 'prod-004',
    name: 'Digital Marketing Package',
    description: 'Comprehensive digital marketing and SEO services',
    price: 30000,
    stock: 8,
    createdAt: new Date('2024-09-12').toISOString(),
    updatedAt: new Date('2024-09-12').toISOString()
  },
  {
    id: 'prod-005',
    name: 'E-commerce Solution',
    description: 'Complete e-commerce platform setup and customization',
    price: 100000,
    stock: 3,
    createdAt: new Date('2024-09-18').toISOString(),
    updatedAt: new Date('2024-09-18').toISOString()
  },
  {
    id: 'prod-006',
    name: 'Cloud Infrastructure Setup',
    description: 'AWS/Azure cloud infrastructure configuration and deployment',
    price: 40000,
    stock: 12,
    createdAt: new Date('2024-09-25').toISOString(),
    updatedAt: new Date('2024-09-25').toISOString()
  }
];

// Sample Bills
export const sampleBills: Bill[] = [
  {
    id: 'bill-001',
    billNumber: 'INV-2024-001',
    customerName: 'Acme Corporation',
    customerId: 'cust-001',
    items: [
      {
        productId: 'prod-001',
        productName: 'Web Development Service',
        quantity: 1,
        price: 50000,
        total: 50000
      }
    ],
    subtotal: 50000,
    taxAmount: 9000, // 18% GST
    totalAmount: 59000,
    status: 'Paid',
    dueDate: new Date('2024-10-15').toISOString(),
    createdAt: new Date('2024-09-15').toISOString(),
    updatedAt: new Date('2024-09-16').toISOString()
  },
  {
    id: 'bill-002',
    billNumber: 'INV-2024-002',
    customerName: 'TechStart Solutions',
    customerId: 'cust-002',
    items: [
      {
        productId: 'prod-002',
        productName: 'Mobile App Development',
        quantity: 1,
        price: 75000,
        total: 75000
      },
      {
        productId: 'prod-003',
        productName: 'UI/UX Design Service',
        quantity: 1,
        price: 25000,
        total: 25000
      }
    ],
    subtotal: 100000,
    taxAmount: 18000, // 18% GST
    totalAmount: 118000,
    status: 'Pending',
    dueDate: new Date('2024-10-20').toISOString(),
    createdAt: new Date('2024-09-20').toISOString(),
    updatedAt: new Date('2024-09-20').toISOString()
  },
  {
    id: 'bill-003',
    billNumber: 'INV-2024-003',
    customerName: 'Global Enterprises',
    customerId: 'cust-003',
    items: [
      {
        productId: 'prod-005',
        productName: 'E-commerce Solution',
        quantity: 1,
        price: 100000,
        total: 100000
      },
      {
        productId: 'prod-004',
        productName: 'Digital Marketing Package',
        quantity: 2,
        price: 30000,
        total: 60000
      }
    ],
    subtotal: 160000,
    taxAmount: 28800, // 18% GST
    totalAmount: 188800,
    status: 'Overdue',
    dueDate: new Date('2024-10-01').toISOString(),
    createdAt: new Date('2024-09-01').toISOString(),
    updatedAt: new Date('2024-09-01').toISOString()
  },
  {
    id: 'bill-004',
    billNumber: 'INV-2024-004',
    customerName: 'Local Business Co.',
    customerId: 'cust-004',
    items: [
      {
        productId: 'prod-003',
        productName: 'UI/UX Design Service',
        quantity: 2,
        price: 25000,
        total: 50000
      }
    ],
    subtotal: 50000,
    taxAmount: 9000, // 18% GST
    totalAmount: 59000,
    status: 'Draft',
    dueDate: new Date('2024-11-05').toISOString(),
    createdAt: new Date('2024-10-05').toISOString(),
    updatedAt: new Date('2024-10-05').toISOString()
  },
  {
    id: 'bill-005',
    billNumber: 'INV-2024-005',
    customerName: 'Digital Dynamics',
    customerId: 'cust-005',
    items: [
      {
        productId: 'prod-006',
        productName: 'Cloud Infrastructure Setup',
        quantity: 1,
        price: 40000,
        total: 40000
      },
      {
        productId: 'prod-001',
        productName: 'Web Development Service',
        quantity: 1,
        price: 50000,
        total: 50000
      }
    ],
    subtotal: 90000,
    taxAmount: 16200, // 18% GST
    totalAmount: 106200,
    status: 'Paid',
    dueDate: new Date('2024-11-08').toISOString(),
    createdAt: new Date('2024-10-08').toISOString(),
    updatedAt: new Date('2024-10-09').toISOString()
  }
];

// Function to initialize test data
export const initializeTestData = () => {
  // Store in localStorage for persistence
  localStorage.setItem('billing-customers', JSON.stringify(sampleCustomers));
  localStorage.setItem('billing-products', JSON.stringify(sampleProducts));
  localStorage.setItem('billing-bills', JSON.stringify(sampleBills));
  
  console.log('Test data initialized successfully!');
  console.log(`- ${sampleCustomers.length} customers`);
  console.log(`- ${sampleProducts.length} products`);
  console.log(`- ${sampleBills.length} bills`);
};

// Function to clear test data
export const clearTestData = () => {
  localStorage.removeItem('billing-customers');
  localStorage.removeItem('billing-products');
  localStorage.removeItem('billing-bills');
  
  console.log('Test data cleared successfully!');
};

// Function to check if test data exists
export const hasTestData = () => {
  return !!(
    localStorage.getItem('billing-customers') &&
    localStorage.getItem('billing-products') &&
    localStorage.getItem('billing-bills')
  );
};
