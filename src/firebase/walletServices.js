import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  increment,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  setDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { app } from './config';
import { getCurrentUser } from './services';
import { encrypt, decrypt } from '../chapa/encryption';

// Initialize Firestore
const db = getFirestore(app);

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PURCHASE: 'purchase',
  SALE: 'sale',
  REFUND: 'refund',
  TRANSFER: 'transfer',
  ESCROW: 'escrow',
  ESCROW_RELEASE: 'escrow_release'
};

// Transaction status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Initialize a wallet for a new user
 * @param {string} userId - The user ID
 * @param {string} role - The user role (buyer or seller)
 * @returns {Promise<object>} - The created wallet object
 */
export const initializeWallet = async (userId, role) => {
  try {
    // Check if wallet already exists
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      console.log('Wallet already exists for this user');
      const walletData = walletDoc.data();
      
      // If balance is encrypted, decrypt it for return value
      if (walletData.encryptedBalance) {
        return {
          id: walletDoc.id, // Ensure wallet ID is included
          ...walletData,
          balance: parseFloat(decrypt(walletData.encryptedBalance))
        };
      }
      
      return {
        id: walletDoc.id, // Ensure wallet ID is included
        ...walletData
      };
    }
    
    // Encrypt initial balance (0)
    const encryptedBalance = encrypt('0');
    
    // Generate a unique wallet ID (using userId as the document ID)
    const walletId = userId;
    
    // Create new wallet with encrypted balance
    const walletData = {
      id: walletId, // Add explicit wallet ID field
      userId,
      role,
      encryptedBalance,
      balance: 0, // For backward compatibility
      currency: 'ETB', // Ethiopian Birr
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      paymentMethods: [], // Array to store payment methods
      settings: {
        notificationsEnabled: true,
        lowBalanceAlert: false,
        lowBalanceThreshold: 100
      }
    };
    
    // Use setDoc instead of updateDoc for creating a new document
    await setDoc(walletRef, walletData);
    console.log('Wallet initialized successfully with ID:', walletId);
    
    return {
      ...walletData,
      id: walletId
    };
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw error;
  }
};

/**
 * Get a user's wallet
 * @param {string} userId - The user ID
 * @returns {Promise<object>} - The wallet object
 */
export const getWallet = async (userId) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);
    
    if (!walletDoc.exists()) {
      // Auto-initialize wallet if it doesn't exist
      console.log('Wallet not found, initializing new wallet for user:', userId);
      return await initializeWallet(userId, 'buyer');
    }
    
    const walletData = walletDoc.data();
    
    // If balance is encrypted, decrypt it for return value
    if (walletData.encryptedBalance) {
      return {
        id: walletDoc.id,
        ...walletData,
        balance: parseFloat(decrypt(walletData.encryptedBalance))
      };
    }
    
    return {
      id: walletDoc.id,
      ...walletData
    };
  } catch (error) {
    console.error('Error getting wallet:', error);
    throw error;
  }
};

/**
 * Get wallet balance
 * @param {string} userId - The user ID
 * @returns {Promise<number>} - The wallet balance
 */
export const getWalletBalance = async (userId) => {
  try {
    const wallet = await getWallet(userId);
    
    // If balance is encrypted, decrypt it
    if (wallet.encryptedBalance) {
      return parseFloat(decrypt(wallet.encryptedBalance));
    }
    
    return wallet.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
};

/**
 * Add funds to a user's wallet
 * @param {string} userId - The user ID
 * @param {number} amount - The amount to add
 * @param {string} method - The payment method
 * @param {string} description - Optional description
 * @returns {Promise<object>} - The updated wallet
 */
export const addFunds = async (userId, amount, method, description = 'Deposit via Chapa') => {
  try {
    // Validate inputs
    if (!userId) throw new Error('User ID is required');
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error('Valid amount is required');
    }
    
    const parsedAmount = parseFloat(amount);
    console.log(`Adding ${parsedAmount} ETB to wallet for user ${userId} via ${method}`);
    
    // Get current wallet data
    let walletData;
    try {
      walletData = await getWallet(userId);
    } catch (error) {
      // If wallet doesn't exist, initialize it
      if (error.message === 'Wallet not found') {
        walletData = await initializeWallet(userId, 'buyer');
      } else {
        throw error;
      }
    }
    
    // Get current balance
    const currentBalance = walletData.balance || 0;
    
    // Calculate new balance
    const newBalance = currentBalance + parsedAmount;
    console.log(`Current balance: ${currentBalance} ETB, New balance: ${newBalance} ETB`);
    
    // Encrypt new balance
    const encryptedBalance = encrypt(newBalance.toString());
    
    // Use a transaction to ensure atomicity
    return await runTransaction(db, async (transaction) => {
      // Update wallet with new balance
      const walletRef = doc(db, 'wallets', userId);
      
      transaction.update(walletRef, {
        encryptedBalance,
        balance: newBalance, // For backward compatibility
        updatedAt: serverTimestamp()
      });
      
      // Create transaction record
      const transactionData = {
        userId,
        walletId: userId, // Use userId as walletId
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: parsedAmount,
        method: method || 'chapa',
        description: description || `Deposit of ${parsedAmount} ETB via ${method || 'Chapa'}`,
        status: TRANSACTION_STATUS.COMPLETED,
        timestamp: serverTimestamp(),
        reference: `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        metadata: {
          previousBalance: currentBalance,
          newBalance: newBalance,
          paymentMethod: method || 'chapa'
        }
      };
      
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, transactionData);
      
      console.log(`Successfully added ${parsedAmount} ETB to wallet. New balance: ${newBalance} ETB`);
      
      // Return updated wallet data
      return {
        ...walletData,
        balance: newBalance,
        lastTransaction: {
          id: transactionRef.id,
          type: TRANSACTION_TYPES.DEPOSIT,
          amount: parsedAmount,
          timestamp: new Date()
        }
      };
    });
  } catch (error) {
    console.error('Error adding funds to wallet:', error);
    throw error;
  }
};

/**
 * Withdraw funds from a user's wallet
 * @param {string} userId - The user ID
 * @param {number} amount - The amount to withdraw
 * @param {string} method - The withdrawal method
 * @returns {Promise<object>} - The transaction object
 */
export const withdrawFunds = async (userId, amount, method) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    return await runTransaction(db, async (transaction) => {
      // Get wallet
      const walletRef = doc(db, 'wallets', userId);
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }
      
      const walletData = walletDoc.data();
      
      // Calculate new balance
      let currentBalance;
      
      // If balance is encrypted, decrypt it first
      if (walletData.encryptedBalance) {
        currentBalance = parseFloat(decrypt(walletData.encryptedBalance));
      } else {
        // Backward compatibility
        currentBalance = walletData.balance || 0;
      }
      
      // Check if sufficient funds
      if (currentBalance < amount) {
        throw new Error('Insufficient funds');
      }
      
      // Calculate new balance
      const newBalance = currentBalance - amount;
      
      // Encrypt the new balance
      const encryptedBalance = encrypt(newBalance.toString());
      
      // Update wallet with encrypted balance
      transaction.update(walletRef, {
        encryptedBalance,
        balance: newBalance, // For backward compatibility
        updatedAt: serverTimestamp()
      });
      
      // Create transaction record with encrypted amount
      const encryptedAmount = encrypt(amount.toString());
      const transactionData = {
        userId,
        type: TRANSACTION_TYPES.WITHDRAWAL,
        encryptedAmount,
        amount: -amount, // Negative for withdrawals (backward compatibility)
        currency: 'ETB',
        method: method || 'bank_transfer',
        status: TRANSACTION_STATUS.PENDING, 
        description: `Withdrawal of ${amount} ETB (pending approval)`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const transactionRef = collection(db, 'transactions');
      const newTransactionRef = doc(transactionRef);
      transaction.set(newTransactionRef, transactionData);
      
      return {
        id: newTransactionRef.id,
        ...transactionData,
        amount: -amount // Return unencrypted amount
      };
    });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
};

/**
 * Process a payment from buyer to seller
 * @param {string} buyerId - The buyer's user ID
 * @param {string} sellerId - The seller's user ID
 * @param {number} amount - The payment amount
 * @param {string} orderId - The order ID
 * @returns {Promise<object>} - The transaction object
 * @deprecated Use holdPaymentInEscrow instead for initial payment
 */
export const processPayment = async (buyerId, sellerId, amount, orderId) => {
  console.warn('processPayment is deprecated. Use holdPaymentInEscrow for initial payment and releasePaymentFromEscrow after delivery confirmation.');
  
  try {
    // Hold payment in escrow instead of direct transfer
    return await holdPaymentInEscrow(buyerId, amount, orderId);
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Hold payment in escrow for an order
 * @param {string} buyerId - The buyer's user ID
 * @param {number} amount - The total payment amount
 * @param {string} orderId - The order ID
 * @returns {Promise<object>} - The transaction object
 */
export const holdPaymentInEscrow = async (buyerId, amount, orderId) => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    // Get buyer wallet data
    const buyerWalletRef = doc(db, 'wallets', buyerId);
    const buyerWalletSnap = await getDoc(buyerWalletRef);
    
    if (!buyerWalletSnap.exists()) {
      throw new Error('Buyer wallet not found');
    }
    
    const buyerWalletData = buyerWalletSnap.data();
    
    // Calculate buyer balance
    let buyerCurrentBalance;
    if (buyerWalletData.encryptedBalance) {
      buyerCurrentBalance = parseFloat(decrypt(buyerWalletData.encryptedBalance));
    } else {
      buyerCurrentBalance = buyerWalletData.balance || 0;
    }
    
    // Check if sufficient funds
    if (buyerCurrentBalance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // Calculate new buyer balance
    const buyerNewBalance = buyerCurrentBalance - amount;
    const buyerEncryptedBalance = encrypt(buyerNewBalance.toString());
    
    // Prepare transaction data
    const encryptedAmount = encrypt(amount.toString());
    
    // Create escrow document
    const escrowData = {
      buyerId,
      orderId,
      encryptedAmount,
      amount, // For backward compatibility
      currency: 'ETB',
      status: 'held',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Perform all writes in a batch
    const batch = writeBatch(db);
    
    // Update buyer wallet
    batch.update(buyerWalletRef, {
      encryptedBalance: buyerEncryptedBalance,
      balance: buyerNewBalance,
      updatedAt: serverTimestamp()
    });
    
    // Create escrow record
    const escrowRef = doc(collection(db, 'escrow'));
    batch.set(escrowRef, escrowData);
    
    // Create buyer transaction record
    const buyerTransactionData = {
      userId: buyerId,
      type: TRANSACTION_TYPES.ESCROW,
      encryptedAmount,
      amount: -amount,
      currency: 'ETB',
      orderId,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Payment held in escrow for order #${orderId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const buyerTransactionRef = doc(collection(db, 'transactions'));
    batch.set(buyerTransactionRef, buyerTransactionData);
    
    // Commit all the writes
    await batch.commit();
    
    return {
      escrowId: escrowRef.id,
      buyerTransaction: {
        id: buyerTransactionRef.id,
        ...buyerTransactionData,
        amount: -amount // Return unencrypted amount
      }
    };
  } catch (error) {
    console.error('Error holding payment in escrow:', error);
    throw error;
  }
};

/**
 * Release payment from escrow to seller
 * @param {string} sellerId - The seller's user ID
 * @param {string} orderId - The order ID
 * @param {number} productAmount - The product price amount
 * @param {number} deliveryAmount - The delivery cost amount
 * @returns {Promise<object>} - The transaction object
 */
export const releasePaymentFromEscrow = async (sellerId, orderId, productAmount, deliveryAmount) => {
  try {
    console.log(`[IMMEDIATE PAYMENT] Starting immediate payment transfer to seller ${sellerId} for order ${orderId}`);
    
    // Find the escrow record for this order
    const escrowQuery = query(
      collection(db, 'escrow'),
      where('orderId', '==', orderId),
      where('status', '==', 'held')
    );
    
    const escrowSnap = await getDocs(escrowQuery);
    
    if (escrowSnap.empty) {
      console.warn(`[IMMEDIATE PAYMENT] No escrow record found for order ${orderId}. Creating direct payment.`);
      // If no escrow record exists, we'll still make the payment directly
      return await createDirectPaymentToSeller(sellerId, orderId, productAmount, deliveryAmount);
    }
    
    const escrowDoc = escrowSnap.docs[0];
    const escrowData = escrowDoc.data();
    const escrowRef = doc(db, 'escrow', escrowDoc.id);
    
    // Calculate the amount to release to seller (product + delivery, no tax)
    let releaseAmount = productAmount + deliveryAmount;
    console.log(`[IMMEDIATE PAYMENT] Releasing ${releaseAmount} ETB to seller ${sellerId}`);
    
    // Ensure we're not releasing more than what's in escrow
    const totalEscrowAmount = escrowData.amount;
    if (releaseAmount > totalEscrowAmount) {
      console.warn(`[IMMEDIATE PAYMENT] Release amount ${releaseAmount} exceeds escrow amount ${totalEscrowAmount}. Adjusting to escrow amount.`);
      // Instead of throwing an error, adjust to the available amount
      releaseAmount = totalEscrowAmount;
    }
    
    // Get seller wallet data - PRIORITY: IMMEDIATE TRANSFER
    const sellerWalletRef = doc(db, 'wallets', sellerId);
    const sellerWalletSnap = await getDoc(sellerWalletRef);
    
    // Calculate seller balance
    let sellerCurrentBalance = 0;
    if (sellerWalletSnap.exists()) {
      const sellerWalletData = sellerWalletSnap.data();
      if (sellerWalletData.encryptedBalance) {
        sellerCurrentBalance = parseFloat(decrypt(sellerWalletData.encryptedBalance));
      } else {
        sellerCurrentBalance = sellerWalletData.balance || 0;
      }
    }
    console.log(`[IMMEDIATE PAYMENT] Current seller balance: ${sellerCurrentBalance} ETB`);
    
    // Calculate new seller balance
    const sellerNewBalance = sellerCurrentBalance + releaseAmount;
    const sellerEncryptedBalance = encrypt(sellerNewBalance.toString());
    
    // Prepare transaction data
    const encryptedAmount = encrypt(releaseAmount.toString());
    
    // Perform all writes in a batch for ATOMIC operation
    const batch = writeBatch(db);
    
    // Update escrow status - IMMEDIATELY mark as released
    batch.update(escrowRef, {
      status: 'released',
      releasedAmount: releaseAmount,
      releasedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      immediateRelease: true // Flag to indicate this was an immediate release
    });
    
    // Update or create seller wallet - IMMEDIATE FUNDS TRANSFER
    if (sellerWalletSnap.exists()) {
      batch.update(sellerWalletRef, {
        encryptedBalance: sellerEncryptedBalance,
        balance: sellerNewBalance,
        updatedAt: serverTimestamp(),
        lastPaymentReceived: serverTimestamp()
      });
    } else {
      batch.set(sellerWalletRef, {
        userId: sellerId,
        encryptedBalance: sellerEncryptedBalance,
        balance: sellerNewBalance,
        currency: 'ETB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPaymentReceived: serverTimestamp(),
        isActive: true
      });
    }
    
    // Create seller transaction record with DETAILED information
    const orderNumber = orderId.substring(0, 8).toUpperCase();
    const sellerTransactionData = {
      userId: sellerId,
      relatedUserId: escrowData.buyerId,
      type: TRANSACTION_TYPES.ESCROW_RELEASE,
      encryptedAmount,
      amount: releaseAmount,
      currency: 'ETB',
      orderId,
      orderNumber,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Payment received for order #${orderNumber} (${productAmount} ETB product + ${deliveryAmount} ETB delivery)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      immediate: true // Flag this as an immediate payment
    };
    
    const sellerTransactionRef = doc(collection(db, 'transactions'));
    batch.set(sellerTransactionRef, sellerTransactionData);
    
    // Create a HIGH-PRIORITY notification for the seller
    const sellerNotificationRef = doc(collection(db, 'users', sellerId, 'notifications'));
    batch.set(sellerNotificationRef, {
      type: 'payment_received',
      priority: 'high',
      orderId: orderId,
      orderNumber,
      amount: releaseAmount,
      message: `🔔 Payment of ${releaseAmount} ETB has been immediately transferred to your wallet for order #${orderNumber}. Funds are available now!`,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Commit all the writes - IMMEDIATE EXECUTION
    console.log(`[IMMEDIATE PAYMENT] Committing transaction batch for immediate payment to seller ${sellerId}`);
    await batch.commit();
    console.log(`[IMMEDIATE PAYMENT] Successfully transferred ${releaseAmount} ETB to seller ${sellerId}`);
    
    // Verify the transfer happened
    const verifyWalletSnap = await getDoc(sellerWalletRef);
    if (verifyWalletSnap.exists()) {
      const verifyData = verifyWalletSnap.data();
      console.log(`[IMMEDIATE PAYMENT] Verified new seller balance: ${verifyData.balance} ETB`);
    }
    
    return {
      sellerTransaction: {
        id: sellerTransactionRef.id,
        ...sellerTransactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      releaseAmount,
      immediateTransfer: true
    };
  } catch (error) {
    console.error(`[IMMEDIATE PAYMENT] Error in immediate payment transfer:`, error);
    throw error;
  }
};

/**
 * Create a direct payment to seller when no escrow record exists
 * @param {string} sellerId - The seller's user ID
 * @param {string} orderId - The order ID
 * @param {number} productAmount - The product price amount
 * @param {number} deliveryAmount - The delivery cost amount
 * @returns {Promise<object>} - The transaction object
 */
const createDirectPaymentToSeller = async (sellerId, orderId, productAmount, deliveryAmount) => {
  try {
    console.log(`[DIRECT PAYMENT] Creating direct payment to seller ${sellerId} for order ${orderId}`);
    const releaseAmount = productAmount + deliveryAmount;
    
    // Get buyer ID from order
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found for direct payment`);
    }
    
    const orderData = orderSnap.data();
    const buyerId = orderData.userId;
    
    if (!buyerId) {
      throw new Error('Buyer ID not found in order data');
    }
    
    // Get seller wallet
    const sellerWalletRef = doc(db, 'wallets', sellerId);
    const sellerWalletSnap = await getDoc(sellerWalletRef);
    
    // Calculate seller balance
    let sellerCurrentBalance = 0;
    if (sellerWalletSnap.exists()) {
      const sellerWalletData = sellerWalletSnap.data();
      if (sellerWalletData.encryptedBalance) {
        sellerCurrentBalance = parseFloat(decrypt(sellerWalletData.encryptedBalance));
      } else {
        sellerCurrentBalance = sellerWalletData.balance || 0;
      }
    }
    
    // Calculate new seller balance
    const sellerNewBalance = sellerCurrentBalance + releaseAmount;
    const sellerEncryptedBalance = encrypt(sellerNewBalance.toString());
    
    // Prepare transaction data
    const encryptedAmount = encrypt(releaseAmount.toString());
    const orderNumber = orderId.substring(0, 8).toUpperCase();
    
    // Create batch
    const batch = writeBatch(db);
    
    // Update or create seller wallet
    if (sellerWalletSnap.exists()) {
      batch.update(sellerWalletRef, {
        encryptedBalance: sellerEncryptedBalance,
        balance: sellerNewBalance,
        updatedAt: serverTimestamp(),
        lastPaymentReceived: serverTimestamp()
      });
    } else {
      batch.set(sellerWalletRef, {
        userId: sellerId,
        encryptedBalance: sellerEncryptedBalance,
        balance: sellerNewBalance,
        currency: 'ETB',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPaymentReceived: serverTimestamp(),
        isActive: true
      });
    }
    
    // Create transaction record
    const sellerTransactionData = {
      userId: sellerId,
      relatedUserId: buyerId,
      type: TRANSACTION_TYPES.DIRECT_PAYMENT,
      encryptedAmount,
      amount: releaseAmount,
      currency: 'ETB',
      orderId,
      orderNumber,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Direct payment received for order #${orderNumber} (${productAmount} ETB product + ${deliveryAmount} ETB delivery)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      immediate: true
    };
    
    const sellerTransactionRef = doc(collection(db, 'transactions'));
    batch.set(sellerTransactionRef, sellerTransactionData);
    
    // Create high priority notification
    const sellerNotificationRef = doc(collection(db, 'users', sellerId, 'notifications'));
    batch.set(sellerNotificationRef, {
      type: 'payment_received',
      priority: 'high',
      orderId: orderId,
      orderNumber,
      amount: releaseAmount,
      message: `🔔 Payment of ${releaseAmount} ETB has been immediately transferred to your wallet for order #${orderNumber}. Funds are available now!`,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Commit batch
    await batch.commit();
    console.log(`[DIRECT PAYMENT] Successfully transferred ${releaseAmount} ETB directly to seller ${sellerId}`);
    
    return {
      sellerTransaction: {
        id: sellerTransactionRef.id,
        ...sellerTransactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      releaseAmount,
      directPayment: true
    };
  } catch (error) {
    console.error(`[DIRECT PAYMENT] Error in direct payment:`, error);
    throw error;
  }
};

/**
 * Get transaction history for a user
 * @param {string} userId - The user ID
 * @param {number} limitCount - Maximum number of transactions to return
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactionHistory = async (userId, limitCount = 50) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    try {
      // Try to use the composite index query first
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(transactionsQuery);
      const transactions = [];
      
      querySnapshot.forEach((doc) => {
        const transactionData = doc.data();
        
        // If amount is encrypted, decrypt it for return value
        if (transactionData.encryptedAmount) {
          transactions.push({
            id: doc.id,
            ...transactionData,
            amount: parseFloat(decrypt(transactionData.encryptedAmount))
          });
        } else {
          transactions.push({
            id: doc.id,
            ...transactionData
          });
        }
      });
      
      return transactions;
    } catch (indexError) {
      // If index error occurs, use a simpler query without ordering
      console.warn('Firestore index not found. Using fallback query without ordering.');
      console.warn('Please create the required index: https://console.firebase.google.com/v1/r/project/mulu-c4fc4/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9tdWx1LWM0ZmM0L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg');
      
      // Fallback query without ordering
      const fallbackQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        limit(limitCount)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackTransactions = [];
      
      fallbackSnapshot.forEach((doc) => {
        const transactionData = doc.data();
        
        // If amount is encrypted, decrypt it for return value
        if (transactionData.encryptedAmount) {
          fallbackTransactions.push({
            id: doc.id,
            ...transactionData,
            amount: parseFloat(decrypt(transactionData.encryptedAmount))
          });
        } else {
          fallbackTransactions.push({
            id: doc.id,
            ...transactionData
          });
        }
      });
      
      // Sort the results in memory (not as efficient, but works without index)
      return fallbackTransactions.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA; // Descending order
      });
    }
  } catch (error) {
    console.error('Error getting transaction history:', error);
    throw error;
  }
};

/**
 * Get transactions for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactions = async (userId) => {
  try {
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    );
    
    const transactionsSnap = await getDocs(transactionsQuery);
    
    return transactionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

/**
 * Transfer funds between users
 * @param {string} senderId - The sender's user ID
 * @param {string} recipientId - The recipient's user ID
 * @param {number} amount - The amount to transfer
 * @param {string} description - Description of the transfer
 * @returns {Promise<object>} - The transaction object
 */
export const transferFunds = async (senderId, recipientId, amount, description) => {
  try {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    if (senderId === recipientId) {
      throw new Error('Cannot transfer to yourself');
    }
    
    return await runTransaction(db, async (transaction) => {
      // Get sender wallet
      const senderWalletRef = doc(db, 'wallets', senderId);
      const senderWalletDoc = await transaction.get(senderWalletRef);
      
      if (!senderWalletDoc.exists()) {
        throw new Error('Sender wallet not found');
      }
      
      const senderWalletData = senderWalletDoc.data();
      
      // Calculate new balance
      let senderCurrentBalance;
      
      // If balance is encrypted, decrypt it first
      if (senderWalletData.encryptedBalance) {
        senderCurrentBalance = parseFloat(decrypt(senderWalletData.encryptedBalance));
      } else {
        // Backward compatibility
        senderCurrentBalance = senderWalletData.balance || 0;
      }
      
      // Check if sufficient funds
      if (senderCurrentBalance < amount) {
        throw new Error('Insufficient funds');
      }
      
      // Calculate new balance
      const senderNewBalance = senderCurrentBalance - amount;
      
      // Encrypt the new balance
      const senderEncryptedBalance = encrypt(senderNewBalance.toString());
      
      // Update sender wallet with encrypted balance
      transaction.update(senderWalletRef, {
        encryptedBalance: senderEncryptedBalance,
        balance: senderNewBalance, // For backward compatibility
        updatedAt: serverTimestamp()
      });
      
      // Get recipient wallet
      const recipientWalletRef = doc(db, 'wallets', recipientId);
      const recipientWalletDoc = await transaction.get(recipientWalletRef);
      
      if (!recipientWalletDoc.exists()) {
        throw new Error('Recipient wallet not found');
      }
      
      const recipientWalletData = recipientWalletDoc.data();
      
      // Calculate new balance
      let recipientCurrentBalance;
      
      // If balance is encrypted, decrypt it first
      if (recipientWalletData.encryptedBalance) {
        recipientCurrentBalance = parseFloat(decrypt(recipientWalletData.encryptedBalance));
      } else {
        // Backward compatibility
        recipientCurrentBalance = recipientWalletData.balance || 0;
      }
      
      // Calculate new balance
      const recipientNewBalance = recipientCurrentBalance + amount;
      
      // Encrypt the new balance
      const recipientEncryptedBalance = encrypt(recipientNewBalance.toString());
      
      // Update recipient wallet with encrypted balance
      transaction.update(recipientWalletRef, {
        encryptedBalance: recipientEncryptedBalance,
        balance: recipientNewBalance, // For backward compatibility
        updatedAt: serverTimestamp()
      });
      
      // Create sender transaction record with encrypted amount
      const encryptedAmount = encrypt(amount.toString());
      const senderTransactionData = {
        userId: senderId,
        relatedUserId: recipientId,
        type: TRANSACTION_TYPES.TRANSFER,
        encryptedAmount,
        amount: -amount, // Negative for sender (backward compatibility)
        currency: 'ETB',
        status: TRANSACTION_STATUS.COMPLETED,
        description: description || `Transfer to user ${recipientId}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const senderTransactionRef = doc(collection(db, 'transactions'));
      transaction.set(senderTransactionRef, senderTransactionData);
      
      // Create recipient transaction record with encrypted amount
      const recipientTransactionData = {
        userId: recipientId,
        relatedUserId: senderId,
        type: TRANSACTION_TYPES.TRANSFER,
        encryptedAmount,
        amount, // Positive for recipient (backward compatibility)
        currency: 'ETB',
        status: TRANSACTION_STATUS.COMPLETED,
        description: description || `Transfer from user ${senderId}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const recipientTransactionRef = doc(collection(db, 'transactions'));
      transaction.set(recipientTransactionRef, recipientTransactionData);
      
      return {
        senderTransaction: {
          id: senderTransactionRef.id,
          ...senderTransactionData,
          amount: -amount // Return unencrypted amount
        },
        recipientTransaction: {
          id: recipientTransactionRef.id,
          ...recipientTransactionData,
          amount // Return unencrypted amount
        }
      };
    });
  } catch (error) {
    console.error('Error transferring funds:', error);
    throw error;
  }
};

/**
 * Transfer funds to seller when an order is completed
 * This function is called when an order status is changed to 'completed'
 * @param {string} orderId - The order ID
 * @param {string} sellerId - The seller's user ID
 * @returns {Promise<boolean>} - True if successful
 */
export const transferFundsToSellerForCompletedOrder = async (orderId, sellerId) => {
  try {
    // Get the order details from sellerOrders collection
    const sellerOrdersRef = collection(db, 'sellerOrders');
    const q = query(sellerOrdersRef, where('mainOrderId', '==', orderId), where('sellerId', '==', sellerId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`No seller order found for orderId: ${orderId} and sellerId: ${sellerId}`);
      return false;
    }
    
    // Get the first matching seller order
    const sellerOrderDoc = querySnapshot.docs[0];
    const sellerOrderData = sellerOrderDoc.data();
    
    // Check if the order is already completed and funds transferred
    if (sellerOrderData.fundsTransferred) {
      console.log(`Funds already transferred for order: ${orderId}`);
      return true;
    }
    
    // Get the buyer ID and total amount
    const { buyerId, total } = sellerOrderData;
    
    if (!buyerId || !total) {
      console.error(`Missing buyerId or total in seller order: ${sellerOrderDoc.id}`);
      return false;
    }
    
    try {
      // Process the payment from buyer to seller
      await processPayment(buyerId, sellerId, total, orderId);
      
      // Mark the seller order as funds transferred
      await updateDoc(doc(db, 'sellerOrders', sellerOrderDoc.id), {
        fundsTransferred: true,
        fundsTransferredAt: serverTimestamp()
      });
      
      console.log(`Funds transferred successfully for order: ${orderId}`);
      return true;
    } catch (paymentError) {
      // If the payment fails, check if it's due to insufficient funds
      if (paymentError.message === 'Insufficient funds') {
        console.warn(`Buyer has insufficient funds for order: ${orderId}. Will retry later.`);
        
        // Update the order with a note about the failed payment
        await updateDoc(doc(db, 'sellerOrders', sellerOrderDoc.id), {
          paymentFailureReason: 'insufficient_funds',
          lastPaymentAttempt: serverTimestamp()
        });
      } else {
        console.error(`Payment processing error for order: ${orderId}`, paymentError);
        
        // Update the order with a note about the general payment error
        await updateDoc(doc(db, 'sellerOrders', sellerOrderDoc.id), {
          paymentFailureReason: 'processing_error',
          lastPaymentAttempt: serverTimestamp()
        });
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error transferring funds for completed order: ${orderId}`, error);
    return false;
  }
};
