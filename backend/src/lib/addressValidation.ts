import { addressSchema, citySchema, stateSchema, pincodeSchema } from './validation';

/**
 * Validates address fields using the unified validation utility.
 * Maintained for backward compatibility.
 */
export const validateAddressFields = ({ address, city, state, pincode }: any) => {
  try {
    if (address) addressSchema.parse(address);
    if (city) citySchema.parse(city);
    if (state) stateSchema.parse(state);
    if (pincode) pincodeSchema.parse(pincode);
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.errors?.[0]?.message || 'Invalid address field' };
  }
};
