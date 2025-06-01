/**
 * Encryption utilities for sensitive data
 */

// Import crypto-js for encryption
import CryptoJS from 'crypto-js';

// Encryption key - in production, this should be stored in environment variables
// For development, we're using a hardcoded key
const ENCRYPTION_KEY = 'DireMart-wallet-encryption-key-9876543210';

/**
 * Encrypt a string
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
export const encrypt = (text) => {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} - Decrypted text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};
