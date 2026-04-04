import axios from 'axios';
import { Bill } from '../types/bill';
import { Customer } from '../types/customer';
import { Product } from '../types/product';

import { API_URL as API_BASE_URL } from '../config/api';

// Configure axios with authentication
// Uses dynamic base URL — auto-resolves to the machine serving the frontend
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export { apiClient as api };

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
      // --- ROOT CAUSE REMOVAL: Delete the Auto-Logout Interceptor ---
      // Global API client will no longer force a redirect to login on 401/403.
      // This ensures that temporary DB locks or aborted requests do not kill the session.
      return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (email: string, password: string, companyName?: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      companyName
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (updates: any) => {
    const response = await apiClient.put('/auth/profile', updates);
    return response.data;
  },

  uploadLogo: async (file: File, position: string = 'left') => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('position', position);

    const response = await apiClient.post('/admin/logo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  uploadImage: async (file: File, type: string = 'general') => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post(`/upload?type=${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data; // { success: true, imageUrl: '...' }
  },

  updateLogoSettings: async (settings: { position?: string; width?: number; offsetX?: number; offsetY?: number }) => {
    const response = await apiClient.patch('/admin/logo/settings', settings);
    return response.data;
  }
};

// Bill API Functions
export const createBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> => {
  const response = await apiClient.post('/bills', billData);
  return response.data.bill;
};

export const fetchBills = async (): Promise<Bill[]> => {
  const response = await apiClient.get('/bills');
  return response.data.bills;
};

export const fetchBillById = async (billId: string): Promise<Bill> => {
  const response = await apiClient.get(`/bills/${billId}`);
  return response.data.bill;
};

export const updateBill = async (billId: string, billData: Partial<Bill>): Promise<Bill> => {
  const response = await apiClient.put(`/bills/${billId}`, billData);
  return response.data.bill;
};

export const deleteBill = async (billId: string): Promise<void> => {
  await apiClient.delete(`/bills/${billId}`);
};

// Customer API Functions
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  const response = await apiClient.post('/customers', customerData);
  return response.data.customer;
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const response = await apiClient.get('/customers');
  return response.data.customers;
};

export const fetchCustomerById = async (customerId: string): Promise<Customer> => {
  const response = await apiClient.get(`/customers/${customerId}`);
  return response.data.customer;
};

export const updateCustomer = async (customerId: string, customerData: Partial<Customer>): Promise<Customer> => {
  const response = await apiClient.put(`/customers/${customerId}`, customerData);
  return response.data.customer;
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  await apiClient.delete(`/customers/${customerId}`);
};

// Product API Functions
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const response = await apiClient.post('/products', productData);
  return response.data.product;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get('/products');
  return response.data.products;
};

export const fetchProductById = async (productId: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${productId}`);
  return response.data.product;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<Product> => {
  const response = await apiClient.put(`/products/${productId}`, productData);
  return response.data.product;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};

export const templateAPI = {
  fetchTemplates: async () => {
    const response = await apiClient.get('/templates');
    return response.data;
  },
  
  saveTemplateSettings: async (templateId: string, settings: any) => {
    const response = await apiClient.put(`/templates/${templateId}/settings`, { settings });
    return response.data;
  },
  
  fetchTemplateSettings: async (templateId: string) => {
    const response = await apiClient.get(`/templates/${templateId}/settings`);
    return response.data;
  },
  
  saveSettings: async (category: string, key: string, value: any) => {
    const response = await apiClient.put(`/templates/settings/${category}/${key}`, { value });
    return response.data;
  },
  
  fetchSettings: async (category: string, key: string) => {
    const response = await apiClient.get(`/templates/settings/${category}/${key}`);
    return response.data;
  }
};
