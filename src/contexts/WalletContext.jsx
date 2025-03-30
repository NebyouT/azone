import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getWallet, 
  addFunds as addFundsToWallet, 
  withdrawFunds as withdrawFromWallet, 
  getTransactions as fetchTransactions 
} from '../firebase/walletServices';
import { initializeDeposit, handlePaymentVerification } from '../chapa/services';
import CHAPA_CONFIG from '../chapa/config';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  
  // Check for payment verification on component mount
  useEffect(() => {
    const verifyPayment = async () => {
      // Check if we're returning from a payment
      const urlParams = new URLSearchParams(window.location.search);
      const txRef = urlParams.get('tx_ref');
      const status = urlParams.get('status');
      
      if (txRef && status) {
        setProcessingPayment(true);
        try {
          // Verify the payment with status
          const result = await handlePaymentVerification(txRef, status);
          
          if (result.success) {
            // Update wallet balance with the returned value if available
            if (result.balance) {
              setBalance(result.balance);
            } else {
              // Otherwise refresh wallet data
              await fetchWalletData();
            }
            
            // Navigate back to wallet page without query params
            window.history.replaceState({}, '', '/wallet');
            
            // Show success message
            setError(null);
            setSuccess(`Payment successful! Your wallet has been updated with ${result.amount} ETB.`);
            
            // Clear success message after 5 seconds
            setTimeout(() => {
              setSuccess('');
            }, 5000);
          } else {
            setError(result.message || 'Payment verification failed. Please try again.');
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          setError('Payment verification failed. Please try again.');
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
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get wallet balance
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
  
  const withdrawFunds = async (amount) => {
    if (!currentUser) {
      setError('You must be logged in to withdraw funds');
      return false;
    }
    
    if (amount > balance) {
      setError('Insufficient balance');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Withdraw funds from wallet
      await withdrawFromWallet(currentUser.uid, amount);
      
      // Refresh wallet data
      await fetchWalletData();
      
      // Show success message
      setSuccess(`Successfully withdrew $${amount} from your wallet`);
      
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
  
  const resetCheckoutUrl = () => {
    setCheckoutUrl(null);
  };
  
  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        loading,
        error,
        success,
        processingPayment,
        checkoutUrl,
        addFunds,
        withdrawFunds,
        updateWalletData,
        resetCheckoutUrl,
        refreshWallet: fetchWalletData
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
