/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: 'ETB' for Ethiopian Birr)
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'ETB', locale = 'en-US') => {
  // Handle null or undefined values
  if (amount === null || amount === undefined) {
    return '';
  }
  
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numericAmount)) {
    return '';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyCode} ${numericAmount.toFixed(2)}`;
  }
};

/**
 * Format a date to a readable string
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date to include time
 * @param {Date|string|number} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: 'en-US')
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
};

/**
 * Format a number with commas
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) {
    return '';
  }
  
  const numericValue = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(numericValue)) {
    return '';
  }
  
  try {
    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return numericValue.toString();
  }
};

/**
 * Format file size in bytes to a human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};
