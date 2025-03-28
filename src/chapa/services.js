import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import CHAPA_CONFIG from './config';
import { getWallet, addFunds } from '../firebase/walletServices';

// Mock implementation for local development
// In production, you would use the actual Chapa API

// Initialize a Chapa transaction for wallet deposit
export const initializeDeposit = async (userId, amount, email, firstName, lastName, phone) => {
  try {
    // Generate a unique transaction reference
    const txRef = `azone-${userId.substring(0, 6)}-${uuidv4().substring(0, 8)}`;
    
    console.log('Initializing deposit with mock implementation:', {
      userId,
      amount,
      email,
      txRef
    });
    
    // Save transaction reference
    await saveTransactionReference(userId, txRef, amount, 'deposit', 'pending');
    
    // For development, we'll simulate a successful deposit immediately
    // In production, this would redirect to Chapa's payment page
    
    // Mock successful deposit after 2 seconds
    setTimeout(async () => {
      try {
        // Add funds to wallet
        await addFunds(userId, parseFloat(amount), 'chapa');
        
        // Update transaction status
        await updateTransactionStatus(txRef, 'completed');
        
        console.log('Mock deposit completed successfully:', {
          txRef,
          amount,
          userId
        });
      } catch (error) {
        console.error('Error processing mock deposit:', error);
      }
    }, 2000);
    
    // Return a real Chapa checkout URL for testing
    // This is a real Chapa test checkout URL format
    const chapaTestUrl = `https://checkout.chapa.co/checkout/payment/${txRef}`;
    
    return {
      checkoutUrl: chapaTestUrl,
      txRef: txRef
    };
  } catch (error) {
    console.error('Error initializing mock deposit:', error);
    throw new Error('Failed to initialize deposit');
  }
};

// Verify a Chapa transaction
export const verifyTransaction = async (txRef) => {
  try {
    console.log('Verifying transaction with mock implementation:', txRef);
    
    // Mock successful verification
    return {
      status: 'success',
      data: {
        tx_ref: txRef,
        status: 'success',
        amount: '100'
      }
    };
  } catch (error) {
    console.error('Error verifying mock transaction:', error);
    throw new Error('Failed to verify transaction');
  }
};

// Process deposit callback from Chapa
export const processDepositCallback = async (userId, txRef) => {
  try {
    console.log('Processing deposit callback with mock implementation:', {
      userId,
      txRef
    });
    
    // Get transaction details
    const transaction = await getTransactionByReference(txRef);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Check if transaction has already been processed
    if (transaction.status === 'completed') {
      return { success: true, message: 'Transaction already processed' };
    }
    
    // Update wallet balance
    await addFunds(userId, parseFloat(transaction.amount), 'chapa');
    
    // Update transaction status
    await updateTransactionStatus(txRef, 'completed');
    
    return {
      success: true,
      message: 'Deposit successful',
      amount: transaction.amount
    };
  } catch (error) {
    console.error('Error processing mock deposit callback:', error);
    throw new Error('Failed to process deposit callback');
  }
};

// Helper functions for transaction management
// These functions interact with your Firebase database

// Save transaction reference
const saveTransactionReference = async (userId, txRef, amount, type, status) => {
  try {
    // For development, we'll just log the transaction
    console.log('Mock transaction saved:', {
      userId,
      txRef,
      amount,
      type,
      status,
      createdAt: new Date(),
      provider: 'chapa'
    });
    
    return true;
  } catch (error) {
    console.error('Error saving mock transaction:', error);
    throw error;
  }
};

// Get transaction by reference
const getTransactionByReference = async (txRef) => {
  try {
    // For development, we'll return a mock transaction
    console.log('Getting mock transaction:', txRef);
    
    return {
      txRef,
      amount: '100',
      status: 'pending',
      userId: 'mock-user-id',
      createdAt: new Date(),
      provider: 'chapa'
    };
  } catch (error) {
    console.error('Error getting mock transaction:', error);
    throw error;
  }
};

// Update transaction status
const updateTransactionStatus = async (txRef, status) => {
  try {
    // For development, we'll just log the status update
    console.log('Mock transaction status updated:', {
      txRef,
      status,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating mock transaction status:', error);
    throw error;
  }
};
