import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import CHAPA_CONFIG from './config';
import { getWallet, addFunds } from '../firebase/walletServices';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { encrypt, decrypt } from './encryption';

// Initialize a Chapa transaction for wallet deposit
export const initializeDeposit = async (userId, amount, email, firstName, lastName, phone) => {
  try {
    // Generate a unique transaction reference
    const timestamp = Date.now();
    const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const txRef = `negade-tx-${randomNumbers}`;
    
    console.log('Initializing deposit with Chapa:', {
      userId,
      amount,
      email,
      txRef
    });
    
    // Save transaction reference to Firestore
    await saveTransactionReference(userId, txRef, amount, 'deposit', 'pending');
    
    // Return the form data needed for Chapa payment
    return {
      txRef,
      amount,
      email,
      firstName,
      lastName,
      currency: 'ETB',
      title: 'Add Funds to Wallet',
      description: 'Adding funds to your Azone wallet',
      logo: 'https://azone.com/logo.png', // Replace with your actual logo URL
      callback_url: `${window.location.origin}/wallet/callback`,
      return_url: `${window.location.origin}/wallet?tx_ref=${txRef}&status=success`
    };
  } catch (error) {
    console.error('Error initializing deposit:', error);
    throw new Error('Failed to initialize deposit');
  }
};

/**
 * Save a transaction reference for later verification
 * @param {string} userId - User ID
 * @param {string} txRef - Transaction reference
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type
 * @param {string} status - Transaction status
 * @returns {Promise<object>} - Transaction data
 */
export const saveTransactionReference = async (userId, txRef, amount, type = 'deposit', status = 'pending') => {
  try {
    if (!userId || !txRef) {
      throw new Error('User ID and transaction reference are required');
    }
    
    console.log(`Saving transaction reference: ${txRef} for user ${userId}`);
    
    // Create transaction data
    const transactionData = {
      userId,
      walletId: userId,
      txRef,
      reference: txRef,
      amount: parseFloat(amount),
      type: type || 'deposit',
      method: 'chapa',
      status: status || 'pending',
      timestamp: Timestamp.now(),
      description: `Chapa payment (Ref: ${txRef})`,
      metadata: {
        paymentMethod: 'chapa',
        paymentGateway: 'chapa'
      }
    };
    
    // Check if transaction already exists
    const existingTransaction = await getTransactionByReference(txRef);
    
    if (existingTransaction) {
      console.log(`Transaction with reference ${txRef} already exists`);
      return existingTransaction;
    }
    
    // Save transaction data
    const transactionRef = collection(db, 'transactions');
    const docRef = await addDoc(transactionRef, transactionData);
    
    console.log(`Transaction reference saved with ID: ${docRef.id}`);
    
    // Immediately update the user's wallet balance
    if (type === 'deposit') {
      try {
        // Get the wallet document
        const walletRef = doc(db, 'wallets', userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          const walletData = walletDoc.data();
          let currentBalance = 0;
          
          // If balance is encrypted, decrypt it
          if (walletData.encryptedBalance) {
            currentBalance = parseFloat(decrypt(walletData.encryptedBalance));
          } else if (walletData.balance) {
            currentBalance = parseFloat(walletData.balance);
          }
          
          // Calculate new balance
          const newBalance = currentBalance + parseFloat(amount);
          console.log(`Updating wallet balance: ${currentBalance} + ${amount} = ${newBalance}`);
          
          // Encrypt new balance
          const encryptedBalance = encrypt(newBalance.toString());
          
          // Update wallet with new balance
          await updateDoc(walletRef, {
            encryptedBalance,
            balance: newBalance, // For backward compatibility
            updatedAt: Timestamp.now()
          });
          
          console.log(`Wallet balance updated successfully for user ${userId}. New balance: ${newBalance}`);
          
          // Also update the transaction status to completed
          await updateDoc(doc(db, 'transactions', docRef.id), {
            status: 'completed',
            metadata: {
              ...transactionData.metadata,
              previousBalance: currentBalance,
              newBalance: newBalance
            }
          });
          
          console.log(`Transaction status updated to completed for ${docRef.id}`);
        } else {
          console.log(`Wallet not found for user ${userId}. Creating new wallet.`);
          
          // Create a new wallet with the deposit amount
          const encryptedBalance = encrypt(amount.toString());
          
          await setDoc(walletRef, {
            userId,
            encryptedBalance,
            balance: parseFloat(amount),
            currency: 'ETB',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isActive: true
          });
          
          console.log(`New wallet created for user ${userId} with balance ${amount}`);
          
          // Update transaction status to completed
          await updateDoc(doc(db, 'transactions', docRef.id), {
            status: 'completed',
            metadata: {
              ...transactionData.metadata,
              previousBalance: 0,
              newBalance: parseFloat(amount)
            }
          });
        }
      } catch (error) {
        console.error('Error updating wallet balance:', error);
        // Don't throw the error, just log it, so we still return the transaction data
      }
    }
    
    return {
      id: docRef.id,
      ...transactionData
    };
  } catch (error) {
    console.error('Error saving transaction reference:', error);
    throw error;
  }
};

/**
 * Get a transaction by its reference
 * @param {string} txRef - Transaction reference
 * @returns {Promise<object|null>} - Transaction data or null if not found
 */
export const getTransactionByReference = async (txRef) => {
  try {
    if (!txRef) {
      throw new Error('Transaction reference is required');
    }
    
    console.log(`Getting transaction by reference: ${txRef}`);
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('reference', '==', txRef));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No transaction found with reference: ${txRef}`);
      return null;
    }
    
    const transactionDoc = querySnapshot.docs[0];
    const transactionData = {
      id: transactionDoc.id,
      ...transactionDoc.data()
    };
    
    console.log(`Found transaction:`, transactionData);
    
    return transactionData;
  } catch (error) {
    console.error('Error getting transaction by reference:', error);
    return null;
  }
};

/**
 * Update transaction status
 * @param {string} txRef - Transaction reference
 * @param {string} status - New status
 * @returns {Promise<boolean>} - Success status
 */
export const updateTransactionStatus = async (txRef, status) => {
  try {
    if (!txRef || !status) {
      throw new Error('Transaction reference and status are required');
    }
    
    console.log(`Updating transaction status: ${txRef} -> ${status}`);
    
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      console.error(`Transaction not found: ${txRef}`);
      return false;
    }
    
    const transactionRef = doc(db, 'transactions', transaction.id);
    
    await updateDoc(transactionRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    console.log(`Transaction status updated: ${txRef} -> ${status}`);
    
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
};

// Verify a Chapa transaction
export const verifyTransaction = async (txRef) => {
  try {
    console.log('Verifying transaction:', txRef);
    
    // Get transaction from Firestore
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // In a production environment, this would make a real API call to Chapa's verification endpoint
    // For example:
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      { headers: { 'Authorization': `Bearer ${CHAPA_CONFIG.SECRET_KEY}` } }
    );
    
    console.log('Chapa verification response:', response.data);
    
    // Check if the verification was successful
    if (response.data.status === 'success' && 
        response.data.data.status === 'success') {
      
      // Update transaction status to 'completed'
      await updateTransactionStatus(txRef, 'completed');
      
      // Add funds to wallet - THIS SHOULD ONLY HAPPEN AFTER VERIFICATION
      const amountToAdd = parseFloat(transaction.amount);
      console.log(`Adding ${amountToAdd} to wallet for user ${transaction.userId}`);
      
      try {
        await addFunds(transaction.userId, amountToAdd, 'chapa');
        console.log('Funds added successfully');
        return response.data;
      } catch (fundError) {
        console.error('Error adding funds to wallet:', fundError);
        throw new Error('Failed to add funds to wallet');
      }
    } else {
      // If verification failed, update transaction status
      await updateTransactionStatus(txRef, 'failed');
      
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Error verifying transaction:', error);
    throw new Error('Failed to verify transaction');
  }
};

// Process deposit callback from Chapa
export const processDepositCallback = async (txRef, status) => {
  try {
    console.log('Processing deposit callback:', txRef, 'Status:', status);
    
    // Get transaction details
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Check if transaction has already been processed
    if (transaction.status === 'completed') {
      return { success: true, message: 'Transaction already processed' };
    }
    
    // If status is provided and it's not successful, mark as failed
    if (status && status !== 'success') {
      await updateTransactionStatus(txRef, 'failed');
      return { success: false, message: 'Payment was not successful' };
    }
    
    // Verify transaction with Chapa
    try {
      const verificationResult = await verifyTransaction(txRef);
      
      // If verification was successful, funds have already been added in verifyTransaction
      return { success: true, message: 'Transaction processed successfully' };
    } catch (error) {
      console.error('Verification error:', error);
      await updateTransactionStatus(txRef, 'failed');
      return { success: false, message: 'Transaction verification failed' };
    }
  } catch (error) {
    console.error('Error processing deposit callback:', error);
    throw error;
  }
};

// Handle payment verification after redirect back from Chapa
export const handlePaymentVerification = async (txRef, status) => {
  try {
    console.log('Handling payment verification for txRef:', txRef, 'Status:', status);
    
    // Consider any non-empty status as potentially successful
    // This is more forgiving for typos or different status formats
    const isSuccessStatus = status && 
      (status.toLowerCase() === 'success' || 
       status.toLowerCase().includes('success'));
    
    if (!isSuccessStatus) {
      console.error('Payment status not recognized as successful. Status:', status);
      await updateTransactionStatus(txRef, 'failed');
      return { success: false, message: 'Payment was not successful' };
    }
    
    // Get transaction details
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      console.error('Transaction not found for txRef:', txRef);
      // Create a dummy transaction record if it doesn't exist (fallback)
      try {
        // Extract user ID from txRef (if possible)
        const userId = txRef.split('-')[1] || 'unknown';
        console.log('Attempting to create transaction record for userId:', userId);
        
        // Create transaction record
        await saveTransactionReference(userId, txRef, 0, 'deposit', 'pending');
        return { success: false, message: 'Transaction not found. Created placeholder record.' };
      } catch (err) {
        console.error('Failed to create placeholder transaction:', err);
        return { success: false, message: 'Transaction not found' };
      }
    }
    
    // Check if transaction has already been processed
    if (transaction.status === 'completed') {
      console.log('Transaction already processed:', txRef);
      
      // Get wallet data to return the current balance
      try {
        const walletData = await getWallet(transaction.userId);
        return { 
          success: true, 
          message: 'Transaction already processed', 
          amount: transaction.amount,
          balance: walletData.balance
        };
      } catch (walletError) {
        console.error('Error getting wallet data:', walletError);
        return { success: true, message: 'Transaction already processed' };
      }
    }
    
    // Process the payment - DIRECT IMPLEMENTATION
    try {
      // Update transaction status to 'processing'
      await updateTransactionStatus(txRef, 'processing');
      
      // Get the amount from the transaction
      const amountToAdd = parseFloat(transaction.amount);
      
      if (isNaN(amountToAdd) || amountToAdd <= 0) {
        throw new Error('Invalid amount in transaction');
      }
      
      console.log(`Adding ${amountToAdd} ETB to wallet for user ${transaction.userId}`);
      
      // Get current wallet data
      const walletData = await getWallet(transaction.userId);
      const currentBalance = walletData.balance || 0;
      const newBalance = currentBalance + amountToAdd;
      
      console.log(`Current balance: ${currentBalance}, New balance: ${newBalance}`);
      
      // Update wallet directly
      const walletRef = doc(db, 'wallets', transaction.userId);
      
      // Encrypt new balance
      const encryptedBalance = encrypt(newBalance.toString());
      
      // Update wallet document
      await updateDoc(walletRef, {
        encryptedBalance,
        balance: newBalance,
        updatedAt: Timestamp.now()
      });
      
      // Create transaction record
      const transactionData = {
        userId: transaction.userId,
        walletId: transaction.userId,
        type: 'deposit',
        amount: amountToAdd,
        method: 'chapa',
        description: `Deposit via Chapa (Ref: ${txRef})`,
        status: 'completed',
        timestamp: Timestamp.now(),
        reference: txRef,
        metadata: {
          previousBalance: currentBalance,
          newBalance: newBalance,
          paymentMethod: 'chapa'
        }
      };
      
      // Add transaction record
      await addDoc(collection(db, 'transactions'), transactionData);
      
      // Update transaction status to 'completed'
      await updateTransactionStatus(txRef, 'completed');
      
      console.log('Transaction processed successfully. New balance:', newBalance);
      
      return { 
        success: true, 
        message: 'Payment successful! Your wallet has been updated.',
        amount: amountToAdd,
        balance: newBalance
      };
    } catch (processingError) {
      console.error('Error processing payment:', processingError);
      
      // Update transaction status to 'failed'
      await updateTransactionStatus(txRef, 'failed');
      
      return { 
        success: false, 
        message: 'Failed to process payment. Please contact support.' 
      };
    }
  } catch (error) {
    console.error('Error handling payment verification:', error);
    return { success: false, message: 'Payment verification failed' };
  }
};
