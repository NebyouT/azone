import crypto from 'crypto';
import CHAPA_CONFIG from './config';

// Encryption key from Chapa config
const ENCRYPTION_KEY = CHAPA_CONFIG.ENCRYPTION_KEY;

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string|number} data - Data to encrypt
 * @returns {string} - Encrypted data as hex string
 */
export const encrypt = (data) => {
  try {
    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : data.toString();
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher using the encryption key and IV
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data as a single hex string
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data that was encrypted with the encrypt function
 * @param {string} encryptedData - Encrypted data (IV:data format)
 * @returns {string} - Decrypted data
 */
export const decrypt = (encryptedData) => {
  try {
    // Split the IV and encrypted data
    const [ivHex, encryptedHex] = encryptedData.split(':');
    
    // Convert IV from hex to Buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Verify a Chapa transaction signature
 * @param {object} data - Transaction data
 * @param {string} signature - Signature from Chapa
 * @returns {boolean} - Whether the signature is valid
 */
export const verifySignature = (data, signature) => {
  try {
    // Create a string of all the data values
    const dataString = Object.values(data).join('');
    
    // Create HMAC using the encryption key
    const hmac = crypto.createHmac('sha256', ENCRYPTION_KEY);
    hmac.update(dataString);
    
    // Get the digest as hex
    const calculatedSignature = hmac.digest('hex');
    
    // Compare with the provided signature
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};
