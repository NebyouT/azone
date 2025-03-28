import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { encrypt, decrypt, verifySignature } from './encryption';
import CHAPA_CONFIG from './config';
import axios from 'axios';

/**
 * Verify a Chapa transaction with their API
 * @param {string} txRef - Transaction reference
 * @returns {Promise<object>} - Verified transaction data
 */
export const verifyTransaction = async (txRef) => {
  try {
    const response = await axios.get(
      `${CHAPA_CONFIG.BASE_URL}${CHAPA_CONFIG.VERIFY_URL}/${txRef}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error verifying transaction with Chapa:', error);
    throw new Error('Failed to verify transaction with Chapa');
  }
};

/**
 * Process a successful Chapa payment and update wallet balance
 * @param {string} userId - User ID
 * @param {string} txRef - Transaction reference
 * @param {number} amount - Transaction amount
 * @param {object} verificationData - Data from Chapa verification
 * @returns {Promise<object>} - Updated wallet data
 */
export const processSuccessfulPayment = async (userId, txRef, amount, verificationData) => {
  try {
    // Check if transaction already processed
    const existingTx = await getTransactionByReference(txRef);
    if (existingTx && existingTx.status === 'completed') {
      console.log('Transaction already processed:', txRef);
      return { success: true, message: 'Transaction already processed' };
    }
    
    // Get user's wallet
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    
    if (!walletDoc.exists()) {
      throw new Error('Wallet not found');
    }
    
    // Get current wallet data
    const walletData = walletDoc.data();
    
    // Calculate new balance
    let currentBalance = 0;
    
    // Try to get balance from encrypted value first
    if (walletData.encryptedBalance) {
      try {
        currentBalance = parseFloat(decrypt(walletData.encryptedBalance));
      } catch (decryptError) {
        console.warn('Could not decrypt balance, falling back to unencrypted balance:', decryptError);
        // Fallback to unencrypted balance
        currentBalance = parseFloat(walletData.balance || 0);
      }
    } else {
      // Use unencrypted balance if no encrypted balance exists
      currentBalance = parseFloat(walletData.balance || 0);
    }
    
    // Ensure amount is a number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount: ' + amount);
    }
    
    // Calculate new balance
    const newBalance = currentBalance + parsedAmount;
    
    // Encrypt the new balance
    const encryptedBalance = encrypt(newBalance.toString());
    
    // Update wallet with encrypted balance
    await updateDoc(walletRef, {
      encryptedBalance,
      balance: newBalance, // Keep unencrypted balance for backward compatibility
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create transaction record with encrypted amount
    const encryptedAmount = encrypt(parsedAmount.toString());
    const transactionData = {
      userId,
      txRef,
      encryptedAmount,
      amount: parsedAmount, // Keep unencrypted amount for backward compatibility
      paymentMethod: 'chapa',
      type: 'deposit',
      status: 'completed',
      description: `Deposit via Chapa (${txRef})`,
      metadata: {
        chapaVerification: JSON.stringify(verificationData)
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add transaction to Firestore
    const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
    
    console.log('Payment processed successfully:', {
      userId,
      txRef,
      amount: parsedAmount,
      newBalance
    });
    
    return {
      success: true,
      transactionId: transactionRef.id,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Handle Chapa webhook callback
 * @param {object} callbackData - Data from Chapa webhook
 * @returns {Promise<object>} - Processing result
 */
export const handleChapaCallback = async (callbackData) => {
  try {
    // Verify the callback signature
    const signature = callbackData.signature;
    if (!signature || !verifySignature(callbackData.data, signature)) {
      throw new Error('Invalid callback signature');
    }
    
    const { tx_ref, status, amount, customer } = callbackData.data;
    
    // Verify transaction with Chapa API
    const verificationResult = await verifyTransaction(tx_ref);
    
    if (verificationResult.status === 'success' && status === 'success') {
      // Extract user ID from tx_ref (assuming format: azone-{userId}-{random})
      const userId = tx_ref.split('-')[1];
      
      // Process the payment
      return await processSuccessfulPayment(
        userId,
        tx_ref,
        amount,
        verificationResult
      );
    } else {
      // Save failed transaction
      await saveFailedTransaction(tx_ref, callbackData.data);
      throw new Error('Transaction verification failed');
    }
  } catch (error) {
    console.error('Error handling Chapa callback:', error);
    throw error;
  }
};

/**
 * Get transaction by reference
 * @param {string} txRef - Transaction reference
 * @returns {Promise<object|null>} - Transaction data or null
 */
const getTransactionByReference = async (txRef) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('txRef', '==', txRef), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
};

/**
 * Save failed transaction
 * @param {string} txRef - Transaction reference
 * @param {object} data - Transaction data
 */
const saveFailedTransaction = async (txRef, data) => {
  try {
    const transactionData = {
      txRef,
      status: 'failed',
      data: JSON.stringify(data),
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'failed_transactions'), transactionData);
  } catch (error) {
    console.error('Error saving failed transaction:', error);
  }
};
