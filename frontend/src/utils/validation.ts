/**
 * Unified Validation Utility for BillSoft SaaS
 * Includes Address, Email, State, City, and Pincode validation rules (Frontend).
 */

import { z } from 'zod';

// ==========================================
// 1. REGEX DEFINITIONS (Low-level Rules)
// ==========================================

/**
 * NAME: Used for Customers and Suppliers. 
 * Allows letters, spaces, and common symbols (&, ., -, /, etc). NO DIGITS.
 */
export const NAME_REGEX = /^[a-zA-Z\s.,&'/\-()]{3,100}$/;

// eslint-disable-next-line no-useless-escape
export const PERSON_NAME_REGEX = /^[a-zA-Z\s.\-]{3,50}$/;

/**
 * MOBILE: Numeric only. Must be exactly 10 digits and start with 6, 7, 8, or 9 (Indian Standard).
 */
export const MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * STREET ADDRESS: Alphanumeric with common separators
 */
// eslint-disable-next-line no-useless-escape
export const ADDRESS_REGEX = /^[A-Za-z0-9\s,\/:\-&.()#+;']+$/;

/**
 * STATE/CITY: Letters, spaces, dots, and hyphens only
 */
export const STATE_CITY_REGEX = /^[a-zA-Z\s.-]+$/;

/**
 * PINCODE: Exactly 6 digits
 */
export const PINCODE_REGEX = /^[0-9]{6}$/;

/**
 * GSTIN: Exactly 15 alphanumeric characters.
 * Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit, 1 letter (Z), 1 digit/letter.
 */
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * PAN: 10 alphanumeric. 5 letters, 4 digits, 1 letter
 */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ==========================================
// 2. ZOD SCHEMAS (Frontend Shared)
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

export const gstSchema = z.string()
  .trim()
  .toUpperCase()
  .regex(GST_REGEX, 'Invalid GST format (Example: 22AAAAA0000A1Z5)');

export const panSchema = z.string()
  .trim()
  .toUpperCase()
  .regex(PAN_REGEX, 'Invalid PAN format (Example: ABCDE1234F)');

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

export const validateEmail = (email: string) => {
  if (!email) return { isValid: false, error: 'Email is required' };
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid email' };
  }
};

export const validateMobile = (mobile: string) => {
  if (!mobile) return { isValid: false, error: 'Mobile is required' };
  try {
    mobileSchema.parse(mobile);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid mobile' };
  }
};

export const validateName = (name: string) => {
  if (!name) return { isValid: false, error: 'Name is required' };
  try {
    nameSchema.parse(name);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid name' };
  }
};

export const validatePersonalName = (name: string) => {
  if (!name) return { isValid: false, error: 'Name is required' };
  try {
    personalNameSchema.parse(name);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid name' };
  }
};

export const validateGST = (gst: string) => {
  if (!gst) return { isValid: true }; // GST is usually optional
  try {
    gstSchema.parse(gst);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid GST number' };
  }
};

export const validatePAN = (pan: string) => {
  if (!pan) return { isValid: true };
  try {
    panSchema.parse(pan);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid PAN number' };
  }
};
