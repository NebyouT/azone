import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getWallet, 
  addFunds as addFundsToWallet, 
  withdrawFunds as withdrawFromWallet, 
  getTransactions as fetchTransactions 
} from '../firebase/walletServices';
import { 
  createWithdrawalRequest,
  getWithdrawalRequests,
  WITHDRAWAL_METHODS
} from '../firebase/withdrawalServices';
import { initializeDeposit, handlePaymentVerification } from '../chapa/services';
import CHAPA_CONFIG from '../chapa/config';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  
  // Make a reference to refreshWallet available globally for refunds
  useEffect(() => {
    if (currentUser) {
      // Expose refresh function globally so it can be called after refunds
      window.refreshWalletData = () => {
        console.log('Global wallet refresh called');
        fetchWalletData();
      };
    }
    
    return () => {
      // Clean up global reference when component unmounts
      window.refreshWalletData = undefined;
    };
  }, [currentUser]);
  
  // Check for payment verification on component mount
  useEffect(() => {
    const verifyPayment = async () => {
      // Check if we're returning from a payment
      const urlParams = new URLSearchParams(window.location.search);
      const txRef = urlParams.get('tx_ref');
      
      // Check for both 'status' and 'satus' (to handle typo in URL)
      let status = urlParams.get('status');
      if (!status) {
        status = urlParams.get('satus'); // Handle typo in URL parameter
      }
      
      if (txRef && status) {
        console.log(`Detected return from Chapa payment. txRef: ${txRef}, status: ${status}`);
        setProcessingPayment(true);
        
        try {
          // Verify the payment with status
          const result = await handlePaymentVerification(txRef, status);
          
          if (result.success) {
            // Update wallet balance with the returned value if available
            if (result.balance !== undefined) {
              console.log(`Setting new balance from payment result: ${result.balance}`);
              setBalance(result.balance);
              
              // Force refresh wallet data to ensure everything is up to date
              setTimeout(() => {
                fetchWalletData();
              }, 1000);
            } else {
              // Otherwise refresh wallet data immediately
              console.log('No balance in result, refreshing wallet data immediately');
              await fetchWalletData();
            }
            
            // Also fetch transactions to show the new transaction
            await fetchTransactions(currentUser.uid).then(txs => {
              console.log('Updated transactions after payment:', txs.length);
              setTransactions(txs);
            }).catch(err => {
              console.error('Error fetching transactions after payment:', err);
            });
            
            // Navigate back to wallet page without query params
            window.history.replaceState({}, '', '/wallet');
            
            // Show success message
            setError(null);
            setSuccess(`Payment successful! Your wallet has been updated with ${result.amount || 'your deposit'} ETB.`);
            
            // Clear success message after 5 seconds
            setTimeout(() => {
              setSuccess('');
            }, 5000);
          } else {
            console.error('Payment verification failed:', result.message);
            setError(result.message || 'Payment verification failed. Please try again.');
            
            // Still refresh wallet data to ensure it's up-to-date
            await fetchWalletData();
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          setError('Payment verification failed. Please try again.');
          
          // Still refresh wallet data to ensure it's up-to-date
          await fetchWalletData();
        } finally {
          setProcessingPayment(false);
        }
      }
    };
    
    if (currentUser) {
      verifyPayment();
    }
  }, [currentUser]);
  
  // Fetch wallet data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchWalletData();
    } else {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
    }
  }, [currentUser]);
  
  const fetchWalletData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get wallet data
      const walletData = await getWallet(currentUser.uid);
      
      // Ensure we have a valid wallet with an ID
      if (!walletData || !walletData.id) {
        console.error('Invalid wallet data received:', walletData);
        throw new Error('Invalid wallet data');
      }
      
      console.log('Wallet data fetched successfully:', walletData.id);
      setBalance(walletData.balance);
      
      // Get transactions
      const txData = await fetchTransactions(currentUser.uid);
      
      // Sort transactions by timestamp in descending order (newest first)
      const sortedTransactions = txData.sort((a, b) => {
        // Handle cases where timestamp might be missing
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp;
      });
      
      setTransactions(sortedTransactions);
      
      // Get withdrawal requests
      const withdrawalData = await getWithdrawalRequests(currentUser.uid);
      setWithdrawalRequests(withdrawalData);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update wallet data - can be called after successful payment
  const updateWalletData = () => {
    console.log('Updating wallet data after payment');
    fetchWalletData();
  };
  
  const addFunds = async (amount) => {
    if (!currentUser) {
      setError('You must be logged in to add funds');
      return false;
    }
    
    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    
    setProcessingPayment(true);
    setError(null);
    
    try {
      console.log(`Initializing deposit of ${parsedAmount} ETB for user ${currentUser.uid}`);
      
      // Initialize deposit with Chapa
      const formData = await initializeDeposit(
        currentUser.uid,
        parsedAmount,
        currentUser.email || 'user@example.com',
        currentUser.displayName?.split(' ')[0] || 'User',
        currentUser.displayName?.split(' ')[1] || 'Name',
        currentUser.phoneNumber || '0912345678'
      );
      
      console.log('Deposit initialized successfully:', formData);
      
      // We no longer need to redirect here, just return the form data
      // The ChapaPaymentForm component will handle the actual payment submission
      
      // Return the form data for the component to handle
      return formData;
    } catch (err) {
      console.error('Error adding funds:', err);
      setError('Failed to initialize payment. Please try again.');
      setProcessingPayment(false);
      return false;
    }
  };
  
  const withdrawFunds = async (amount, method, bankDetails) => {
    if (!currentUser) {
      setError('You must be logged in to withdraw funds');
      return false;
    }
    
    if (amount > balance) {
      setError('Insufficient balance');
      return false;
    }
    
    if (!method || !Object.values(WITHDRAWAL_METHODS).includes(method)) {
      setError('Please select a valid withdrawal method');
      return false;
    }
    
    if (!bankDetails || !bankDetails.accountName || !bankDetails.accountNumber) {
      setError('Please provide all required bank details');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, reduce the wallet balance
      await withdrawFromWallet(currentUser.uid, amount);
      
      // Then create a withdrawal request
      await createWithdrawalRequest(currentUser.uid, amount, method, bankDetails);
      
      // Refresh wallet data
      await fetchWalletData();
      
      // Show success message
      setSuccess(`Withdrawal request for ${amount} ETB has been submitted and is pending approval`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError('Failed to withdraw funds. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Get withdrawal methods
  const getWithdrawalMethods = () => {
    return WITHDRAWAL_METHODS;
  };
  
  const resetCheckoutUrl = () => {
    setCheckoutUrl(null);
  };
  
  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        withdrawalRequests,
        loading,
        error,
        success,
        processingPayment,
        checkoutUrl,
        addFunds,
        withdrawFunds,
        updateWalletData,
        resetCheckoutUrl,
        refreshWallet: fetchWalletData,
        getWithdrawalMethods
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
