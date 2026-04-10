/**
 * Unified Validation Utility for BillSoft SaaS
 * Includes Address, Email, State, City, and Pincode validation rules (Backend).
 */

import { z } from 'zod';

// ==========================================
// 1. REGEX DEFINITIONS (Low-level Rules)
// ==========================================

export const NAME_REGEX = /^[a-zA-Z\s.,&'/\-()]{3,100}$/;
export const PERSON_NAME_REGEX = /^[a-zA-Z\s.\-]{3,50}$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/;
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const ADDRESS_REGEX = /^[A-Za-z0-9\s,\/:\-&.()#+;']+$/;
export const STATE_CITY_REGEX = /^[a-zA-Z\s.-]+$/;
export const PINCODE_REGEX = /^[0-9]{6}$/;

// ==========================================
// 2. ZOD SCHEMAS (Backend Shared)
// ==========================================

export const nameSchema = z.string()
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(100, 'Name must be 100 characters or less')
  .regex(NAME_REGEX, 'Name must contain only alphabets and common symbols (no numbers).');

export const personalNameSchema = z.string()
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(50, 'Name must be 50 characters or less')
  .regex(PERSON_NAME_REGEX, 'Name contains invalid characters. Use letters, spaces, dots or hyphens.');

export const mobileSchema = z.string()
  .trim()
  .regex(MOBILE_REGEX, 'Mobile must be 10 digits and start with 6, 7, 8, or 9');

export const emailSchema = z.string()
  .trim()
  .email('Invalid email format')
  .toLowerCase()
  .refine((email) => {
    const [username] = email.split('@');
    return /[a-zA-Z]/.test(username);
  }, { message: 'Email username must contain at least one letter' });

export const addressSchema = z.string()
  .trim()
  .min(8, 'Address must be between 8 and 80 characters')
  .max(80, 'Address must be between 8 and 80 characters')
  .refine(val => /[A-Za-z]/.test(val), 'Address must contain at least one letter')
  .refine(val => ADDRESS_REGEX.test(val), 'Address contains invalid characters');

export const citySchema = z.string()
  .trim()
  .min(2, 'City must be at least 2 characters')
  .max(50, 'City must be 50 characters or less')
  .regex(STATE_CITY_REGEX, 'City contains invalid characters');

export const stateSchema = z.string()
  .trim()
  .min(2, 'State must be at least 2 characters')
  .max(50, 'State must be 50 characters or less')
  .regex(STATE_CITY_REGEX, 'State contains invalid characters');

export const pincodeSchema = z.string()
  .trim()
  .regex(PINCODE_REGEX, 'Pincode must be exactly 6 digits');

// ==========================================
// 3. HELPER FUNCTIONS (For manual validation)
// ==========================================

export const validateEmail = (email: string) => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid email' };
  }
};

export const validateMobile = (mobile: string) => {
  try {
    mobileSchema.parse(mobile);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid mobile' };
  }
};

export const validateName = (name: string) => {
  try {
    nameSchema.parse(name);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid name' };
  }
};
