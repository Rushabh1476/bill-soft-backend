import { addressSchema, citySchema, stateSchema, pincodeSchema, ADDRESS_REGEX, STATE_CITY_REGEX, PINCODE_REGEX } from './validation';

// Re-exports for backward compatibility
export { ADDRESS_REGEX, STATE_CITY_REGEX, PINCODE_REGEX };

export const addressValidationSchema = {
  address: addressSchema,
  state: stateSchema,
  city: citySchema,
  pincode: pincodeSchema
};

/**
 * Manual validation function for components not using Zod yet
 */
export const validateAddressField = (name: string, value: string): string | null => {
  try {
    switch (name) {
      case 'address':
        addressSchema.parse(value);
        break;
      case 'state':
        stateSchema.parse(value);
        break;
      case 'city':
        citySchema.parse(value);
        break;
      case 'pincode':
        pincodeSchema.parse(value);
        break;
    }
    return null;
  } catch (err: any) {
    return err.errors?.[0]?.message || `Invalid ${name}`;
  }
};
