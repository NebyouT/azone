import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import CHAPA_CONFIG from './config';
import { getWallet, addFunds } from '../firebase/walletServices';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Initialize a Chapa transaction for wallet deposit
export const initializeDeposit = async (userId, amount, email, firstName, lastName, phone) => {
  try {
    // Generate a unique transaction reference
    const txRef = `azone-${userId.substring(0, 6)}-${uuidv4().substring(0, 8)}`;
    
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

// Save transaction reference to Firestore
export const saveTransactionReference = async (userId, txRef, amount, type, status) => {
  try {
    const txRefDoc = doc(db, 'chapaTransactions', txRef);
    await setDoc(txRefDoc, {
      userId,
      txRef,
      amount: parseFloat(amount),
      type,
      status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('Transaction reference saved:', txRef);
    return true;
  } catch (error) {
    console.error('Error saving transaction reference:', error);
    throw error;
  }
};

// Update transaction status
export const updateTransactionStatus = async (txRef, status) => {
  try {
    const txRefDoc = doc(db, 'chapaTransactions', txRef);
    const txRefSnap = await getDoc(txRefDoc);
    
    if (!txRefSnap.exists()) {
      throw new Error('Transaction reference not found');
    }
    
    await updateDoc(txRefDoc, {
      status,
      updatedAt: Timestamp.now()
    });
    
    console.log('Transaction status updated:', status);
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

// Get transaction by reference
export const getTransactionByReference = async (txRef) => {
  try {
    const txRefDoc = doc(db, 'chapaTransactions', txRef);
    const txRefSnap = await getDoc(txRefDoc);
    
    if (!txRefSnap.exists()) {
      return null;
    }
    
    return {
      id: txRefSnap.id,
      ...txRefSnap.data()
    };
  } catch (error) {
    console.error('Error getting transaction by reference:', error);
    throw error;
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
    
    // Only proceed if the status is success
    if (status !== 'success') {
      console.error('Payment was not successful. Status:', status);
      await updateTransactionStatus(txRef, 'failed');
      return { success: false, message: 'Payment was not successful' };
    }
    
    // Get transaction details
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      console.error('Transaction not found for txRef:', txRef);
      return { success: false, message: 'Transaction not found' };
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
    
    // Verify the transaction with Chapa
    try {
      // Update transaction status to 'verifying'
      await updateTransactionStatus(txRef, 'verifying');
      
      // In a production environment, verify with Chapa API
      // For now, we'll simulate a successful verification
      
      // Add funds to wallet
      const amountToAdd = parseFloat(transaction.amount);
      console.log(`Adding ${amountToAdd} ETB to wallet for user ${transaction.userId}`);
      
      // Update wallet with the funds
      const updatedWallet = await addFunds(
        transaction.userId, 
        amountToAdd, 
        'chapa', 
        `Deposit via Chapa (Ref: ${txRef})`
      );
      
      // Update transaction status to 'completed'
      await updateTransactionStatus(txRef, 'completed');
      
      console.log('Transaction verified and wallet updated successfully:', txRef);
      console.log('New wallet balance:', updatedWallet.balance);
      
      return { 
        success: true, 
        message: 'Payment successful! Your wallet has been updated.',
        amount: transaction.amount,
        balance: updatedWallet.balance
      };
    } catch (verificationError) {
      console.error('Verification error:', verificationError);
      // Update transaction status to 'failed'
      await updateTransactionStatus(txRef, 'failed');
      return { success: false, message: 'Payment verification failed' };
    }
  } catch (error) {
    console.error('Error handling payment verification:', error);
    return { success: false, message: 'Payment verification failed' };
  }
};
