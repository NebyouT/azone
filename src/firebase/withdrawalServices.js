import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { encrypt } from '../chapa/encryption';

// Withdrawal status constants
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

// Withdrawal method constants
export const WITHDRAWAL_METHODS = {
  CBE: 'cbe',
  TELEBIRR: 'telebirr',
  BANK_TRANSFER: 'bank_transfer'
};

/**
 * Create a withdrawal request
 * @param {string} userId - User ID
 * @param {number} amount - Amount to withdraw
 * @param {string} method - Withdrawal method (cbe, telebirr, bank_transfer)
 * @param {object} bankDetails - Bank details for the withdrawal
 * @returns {Promise<object>} - Created withdrawal request
 */
export const createWithdrawalRequest = async (userId, amount, method, bankDetails) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid withdrawal amount');
    }
    
    // Validate method
    if (!Object.values(WITHDRAWAL_METHODS).includes(method)) {
      throw new Error('Invalid withdrawal method');
    }
    
    // Validate bank details based on method
    if (method === WITHDRAWAL_METHODS.CBE && !bankDetails.accountNumber) {
      throw new Error('CBE account number is required');
    }
    
    if (method === WITHDRAWAL_METHODS.TELEBIRR && !bankDetails.phoneNumber) {
      throw new Error('Telebirr phone number is required');
    }
    
    if (!bankDetails.fullName) {
      throw new Error('Account holder full name is required');
    }
    
    // Encrypt sensitive data
    const encryptedAmount = encrypt(amount.toString());
    let encryptedDetails = {};
    
    // Encrypt different fields based on method
    if (method === WITHDRAWAL_METHODS.CBE) {
      encryptedDetails = {
        accountNumber: encrypt(bankDetails.accountNumber),
        fullName: encrypt(bankDetails.fullName)
      };
    } else if (method === WITHDRAWAL_METHODS.TELEBIRR) {
      encryptedDetails = {
        phoneNumber: encrypt(bankDetails.phoneNumber),
        fullName: encrypt(bankDetails.fullName)
      };
    }
    
    // Create withdrawal request
    const withdrawalData = {
      userId,
      amount, // Unencrypted for backward compatibility
      encryptedAmount,
      method,
      bankDetails: {
        ...bankDetails,
        // Store both encrypted and unencrypted for transition period
      },
      encryptedDetails,
      status: WITHDRAWAL_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: 'Withdrawal request created by user'
    };
    
    // Add to Firestore
    const withdrawalRef = await addDoc(collection(db, 'withdrawal_requests'), withdrawalData);
    
    return {
      id: withdrawalRef.id,
      ...withdrawalData
    };
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    throw error;
  }
};

/**
 * Get withdrawal requests for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of withdrawal requests
 */
export const getWithdrawalRequests = async (userId) => {
  try {
    const withdrawalQuery = query(
      collection(db, 'withdrawal_requests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(withdrawalQuery);
    const withdrawals = [];
    
    querySnapshot.forEach((doc) => {
      withdrawals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return withdrawals;
  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    throw error;
  }
};

/**
 * Update withdrawal request status
 * @param {string} withdrawalId - Withdrawal request ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes about the status change
 * @returns {Promise<void>}
 */
export const updateWithdrawalStatus = async (withdrawalId, status, notes) => {
  try {
    if (!Object.values(WITHDRAWAL_STATUS).includes(status)) {
      throw new Error('Invalid withdrawal status');
    }
    
    const withdrawalRef = doc(db, 'withdrawal_requests', withdrawalId);
    
    await updateDoc(withdrawalRef, {
      status,
      notes: notes || `Status updated to ${status}`,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    throw error;
  }
};
