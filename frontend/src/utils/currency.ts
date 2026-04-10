/* eslint-disable */
/**
 * Currency utilities for Indian Rupee (INR) formatting
 */

export const CURRENCY_CONFIG = {
  symbol: '₹',
  code: 'INR',
  locale: 'en-IN',
  name: 'Indian Rupee'
};

/**
 * Format number as Indian Rupee with proper localization
 */
export const formatCurrency = (amount: number): string => {
  if (localStorage.getItem('hideFinancials') === 'true') {
     return `${amount < 0 ? '-' : ''}${CURRENCY_CONFIG.symbol}***`;
  }
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale)}`;
};

/**
 * Format number as Indian Rupee using Intl.NumberFormat for better precision
 */
export const formatCurrencyPrecise = (amount: number): string => {
  if (localStorage.getItem('hideFinancials') === 'true') {
     return `${amount < 0 ? '-' : ''}${CURRENCY_CONFIG.symbol}***`;
  }
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with currency symbol (simple format)
 */
export const formatAmount = (amount: number): string => {
  if (localStorage.getItem('hideFinancials') === 'true') {
     return `${amount < 0 ? '-' : ''}${CURRENCY_CONFIG.symbol}***`;
  }
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString()}`;
};

/**
 * Format number with professional suffixes (k for thousands, Lakh for lakhs).
 * Used for CURRENCY (price, revenue) values with ₹ prefix.
 *
 * Examples:
 *   999       → ₹999
 *   1000      → ₹1k
 *   1500      → ₹1.5k
 *   92000     → ₹92k
 *   100000    → ₹1 Lakh
 *   1000000   → ₹1M
 */
export const formatCompactCurrency = (amount: number): string => {
  if (localStorage.getItem('hideFinancials') === 'true') {
     return `${amount < 0 ? '-' : ''}${CURRENCY_CONFIG.symbol}***`;
  }
  if (amount === 0) return `${CURRENCY_CONFIG.symbol}0`;
  if (!amount || isNaN(amount)) return `${CURRENCY_CONFIG.symbol}0`;

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  // 10,000,000+ -> Crore
  if (abs >= 10_000_000) {
    const cr = abs / 10_000_000;
    const formatted = parseFloat(cr.toFixed(2)).toString();
    return `${sign}${CURRENCY_CONFIG.symbol}${formatted} Cr`;
  }

  // 100,000 - 9,999,999 -> Lakh
  if (abs >= 100_000) {
    const lakhs = abs / 100_000;
    const formatted = parseFloat(lakhs.toFixed(2)).toString();
    return `${sign}${CURRENCY_CONFIG.symbol}${formatted} Lakh`;
  }

  // 1,000 - 99,999 -> K
  if (abs >= 1_000) {
    const k = abs / 1_000;
    const formatted = parseFloat(k.toFixed(1)).toString();
    return `${sign}${CURRENCY_CONFIG.symbol}${formatted}K`;
  }

  // Below 1,000 -> Actual number
  return `${sign}${CURRENCY_CONFIG.symbol}${abs.toLocaleString(CURRENCY_CONFIG.locale)}`;
};

/**
 * Format a raw NUMBER (no currency symbol) with professional compact suffixes.
 */
export const formatCompactNumber = (value: number | null | undefined): string => {
  if (localStorage.getItem('hideFinancials') === 'true') {
     return `***`;
  }
  const n = Number(value);
  if (n === 0) return '0';
  if (!n || isNaN(n)) return '0';

  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  
  if (abs >= 10_000_000) {
    const cr = abs / 10_000_000;
    return `${sign}${parseFloat(cr.toFixed(2))} Cr`;
  }

  if (abs >= 100_000) {
    const lakhs = abs / 100_000;
    return `${sign}${parseFloat(lakhs.toFixed(2))} Lakh`;
  }

  if (abs >= 1_000) {
    const k = abs / 1_000;
    return `${sign}${parseFloat(k.toFixed(1))}K`;
  }

  return `${sign}${abs.toLocaleString('en-IN')}`;
};

/**
 * Parse currency string to number (removes currency symbol and commas)
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (): string => {
  return CURRENCY_CONFIG.symbol;
};

/**
 * Get currency code
 */
export const getCurrencyCode = (): string => {
  return CURRENCY_CONFIG.code;
};

/**
 * Convert number to Indian Rupee Words
 */
export const toWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{1})(\d{2})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Hundred ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Thousand ' : '';
  str += (Number(n[5]) != 0) ? (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'and ' : '';
  str += (Number(n[5]) != 0) ? (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  
  // Cleanup
  str = str.replace(/\s+/g, ' ').trim();
  return str ? str + ' Only' : 'Zero Only';
};

const currencyUtil = {
  format: formatCurrency,
  formatPrecise: formatCurrencyPrecise,
  formatAmount,
  formatCompact: formatCompactCurrency,
  formatCompactNumber,
  parse: parseCurrency,
  symbol: getCurrencySymbol,
  code: getCurrencyCode,
  toWords: toWords,
  config: CURRENCY_CONFIG
};

export default currencyUtil;
