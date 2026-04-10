import axios from 'axios';
import { Bill } from '../types/bill';
import { Customer } from '../types/customer';
import { Product } from '../types/product';

import { API_URL as API_BASE_URL } from '../config/api';

// Configure axios with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (email: string, password: string, companyName?: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      companyName
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
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
