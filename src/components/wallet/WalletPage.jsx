import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Grid,
  Modal,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  CreditCard as CardIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
  AccountBalance as BankIcon,
  Phone as PhoneIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  getWallet,
  getWalletBalance,
  getTransactionHistory,
  addFunds,
  withdrawFunds,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  initializeWallet
} from '../../firebase/walletServices';
import { verifyTransaction } from '../../chapa/services';
import { processSuccessfulPayment } from '../../chapa/transactionHandler';
import { 
  createWithdrawalRequest, 
  WITHDRAWAL_METHODS, 
  WITHDRAWAL_STATUS,
  getWithdrawalRequests
} from '../../firebase/withdrawalServices';
import ChapaPaymentForm from './ChapaPaymentForm';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
};

// Helper function to format date
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to get transaction icon
const getTransactionIcon = (type) => {
  switch (type) {
    case TRANSACTION_TYPES.DEPOSIT:
      return <ArrowDownwardIcon color="success" />;
    case TRANSACTION_TYPES.WITHDRAWAL:
      return <ArrowUpwardIcon color="error" />;
    case TRANSACTION_TYPES.PAYMENT:
      return <PaymentIcon color="primary" />;
    case TRANSACTION_TYPES.REFUND:
      return <ReceiptIcon color="secondary" />;
    default:
      return <HistoryIcon />;
  }
};

// Helper function to get transaction color
const getTransactionColor = (amount) => {
  if (amount > 0) return 'success';
  if (amount < 0) return 'error';
  return 'default';
};

// Helper function to get transaction status color
const getStatusColor = (status) => {
  switch (status) {
    case TRANSACTION_STATUS.COMPLETED:
      return 'success';
    case TRANSACTION_STATUS.PENDING:
      return 'warning';
    case TRANSACTION_STATUS.FAILED:
      return 'error';
    case TRANSACTION_STATUS.CANCELLED:
      return 'default';
    default:
      return 'default';
  }
};

const WalletPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userDetails } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('chapa');
  const [withdrawalMethod, setWithdrawalMethod] = useState(WITHDRAWAL_METHODS.CBE);
  const [openDepositDialog, setOpenDepositDialog] = useState(false);
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chapaRedirectUrl, setChapaRedirectUrl] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [showChapaForm, setShowChapaForm] = useState(false);
  const [chapaPaymentData, setChapaPaymentData] = useState(null);
  
  // State for checkout redirection
  const [returnToCheckout, setReturnToCheckout] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [sufficientFundsForCheckout, setSufficientFundsForCheckout] = useState(false);
  
  // Withdrawal form state
  const [withdrawalStep, setWithdrawalStep] = useState(0);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    phoneNumber: '',
    fullName: ''
  });
  
  // Check for transaction reference in URL (for Chapa callback)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const txRef = queryParams.get('txRef');
    
    if (txRef) {
      // Handle Chapa payment callback
      handleChapaCallback(txRef);
    }
  }, [location]);
  
  // Handle Chapa callback
  const handleChapaCallback = async (txRef) => {
    try {
      setLoading(true);
      
      // Verify the transaction with Chapa
      const verificationResult = await verifyTransaction(txRef);
      
      if (verificationResult.status === 'success') {
        // Process the payment
        const { data } = verificationResult;
        
        // Extract user ID from tx_ref (format: azone-{userId}-{random})
        // The txRef format may vary, so we need to be more flexible
        let userId = currentUser.uid;
        
        // If the txRef contains user metadata, use it
        if (data && data.metadata && data.metadata.userId) {
          userId = data.metadata.userId;
        } else if (txRef.includes('-')) {
          // Try to extract from txRef format (fallback)
          const parts = txRef.split('-');
          if (parts.length >= 2 && parts[0] === 'azone') {
            // Use the longest part that's not 'azone' as the potential userId
            // This is more robust than assuming a specific position
            userId = parts.slice(1).reduce((longest, part) => 
              part.length > longest.length ? part : longest, '');
          }
        }
        
        console.log('Processing payment for user:', userId, 'Current user:', currentUser.uid);
        
        // Always process the payment for the current user regardless of the txRef
        // This is more secure since we're already verifying with Chapa
        await processSuccessfulPayment(
          currentUser.uid,
          txRef,
          data.amount,
          verificationResult
        );
        
        // Refresh wallet data
        await fetchWalletData();
        
        // Show success message
        setDepositSuccess(true);
        setTimeout(() => setDepositSuccess(false), 5000);
      } else {
        console.error('Transaction verification failed:', verificationResult);
        setError('Transaction verification failed');
      }
    } catch (error) {
      console.error('Error handling Chapa callback:', error);
      setError('Failed to process payment callback');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      setError('');
      
      try {
        // Try to get existing wallet
        const walletData = await getWallet(currentUser.uid);
        setWallet(walletData);
      } catch (walletError) {
        // If wallet doesn't exist, initialize a new one
        if (walletError.message === 'Wallet not found') {
          // Get user role from userDetails
          const role = userDetails?.role || 'buyer';
          
          // Initialize wallet
          const newWallet = await initializeWallet(currentUser.uid, role);
          setWallet(newWallet);
        } else {
          // If it's a different error, rethrow it
          throw walletError;
        }
      }
      
      // Get transaction history
      const transactionHistory = await getTransactionHistory(currentUser.uid);
      setTransactions(transactionHistory);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch all data
  const fetchAllData = async () => {
    await fetchWalletData();
    await fetchTransactionHistory();
    await fetchWithdrawalRequests();
  };
  
  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      const transactionHistory = await getTransactionHistory(currentUser.uid);
      setTransactions(transactionHistory);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };
  
  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    try {
      if (!currentUser) return;
      
      const requests = await getWithdrawalRequests(currentUser.uid);
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };
  
  // Load wallet data on component mount
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    fetchAllData();
    
    // Check if redirected from checkout page
    if (location.state?.returnToCheckout) {
      setReturnToCheckout(true);
      setRequiredAmount(location.state.requiredAmount || 0);
      // Open deposit dialog automatically
      setOpenDepositDialog(true);
      // Set amount to the required amount
      setAmount(String(location.state.requiredAmount || 0));
    }
  }, [currentUser, navigate, location.state]);
  
  // Check if wallet balance is sufficient for checkout after wallet data is loaded
  useEffect(() => {
    if (returnToCheckout && wallet && requiredAmount > 0) {
      const hasEnoughFunds = wallet.balance >= requiredAmount;
      setSufficientFundsForCheckout(hasEnoughFunds);
      
      // If user now has enough funds, show a notification
      if (hasEnoughFunds && !sufficientFundsForCheckout) {
        setDepositSuccess(true);
        setTimeout(() => setDepositSuccess(false), 5000);
      }
    }
  }, [wallet, returnToCheckout, requiredAmount, sufficientFundsForCheckout]);

  // Return to checkout if funds are sufficient
  const handleReturnToCheckout = () => {
    navigate('/checkout');
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle amount change
  const handleAmountChange = (e) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  // Handle deposit
  const handleDeposit = async () => {
    try {
      setProcessingDeposit(true);
      setError('');
      
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        setProcessingDeposit(false);
        return;
      }
      
      if (depositMethod === 'chapa') {
        // For Chapa payment, prepare the payment data and show the form
        setChapaPaymentData({
          amount: amount.toString(),
          email: currentUser.email || 'user@example.com',
          firstName: currentUser.displayName?.split(' ')[0] || 'Azone',
          lastName: currentUser.displayName?.split(' ')[1] || 'User',
          userId: currentUser.uid
        });
        
        // Close the deposit dialog and show the Chapa form
        setOpenDepositDialog(false);
        setShowChapaForm(true);
      } else {
        // Use traditional deposit method
        await addFunds(currentUser.uid, amountValue, depositMethod);
        
        // Refresh wallet data
        await fetchWalletData();
        
        // Close dialog and reset form
        setOpenDepositDialog(false);
        setAmount('');
        setDepositMethod('chapa');
      }
    } catch (err) {
      console.error('Error depositing funds:', err);
      setError('Failed to deposit funds. Please try again.');
    } finally {
      setProcessingDeposit(false);
    }
  };
  
  // Handle withdrawal
  const handleWithdrawal = async () => {
    try {
      setProcessingWithdrawal(true);
      setError('');
      
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        setProcessingWithdrawal(false);
        return;
      }
      
      if (amountValue > wallet.balance) {
        setError('Insufficient balance');
        setProcessingWithdrawal(false);
        return;
      }
      
      // Validate bank details based on method
      if (withdrawalMethod === WITHDRAWAL_METHODS.CBE && !bankDetails.accountNumber) {
        setError('Please enter your CBE account number');
        setProcessingWithdrawal(false);
        return;
      }
      
      if (withdrawalMethod === WITHDRAWAL_METHODS.TELEBIRR && !bankDetails.phoneNumber) {
        setError('Please enter your Telebirr phone number');
        setProcessingWithdrawal(false);
        return;
      }
      
      if (!bankDetails.fullName) {
        setError('Please enter the full name on your account');
        setProcessingWithdrawal(false);
        return;
      }
      
      // Create withdrawal request
      await createWithdrawalRequest(
        currentUser.uid,
        amountValue,
        withdrawalMethod,
        bankDetails
      );
      
      // Deduct funds from wallet
      await withdrawFunds(currentUser.uid, amountValue, withdrawalMethod);
      
      // Refresh data
      await fetchAllData();
      
      // Show success message
      setWithdrawalSuccess(true);
      setTimeout(() => setWithdrawalSuccess(false), 5000);
      
      // Close dialog and reset form
      setOpenWithdrawDialog(false);
      setAmount('');
      setWithdrawalMethod(WITHDRAWAL_METHODS.CBE);
      setBankDetails({
        accountNumber: '',
        phoneNumber: '',
        fullName: ''
      });
      setWithdrawalStep(0);
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError('Failed to withdraw funds. Please try again.');
    } finally {
      setProcessingWithdrawal(false);
    }
  };
  
  // Handle withdrawal step changes
  const handleNextWithdrawalStep = () => {
    // Validate current step
    if (withdrawalStep === 0) {
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (amountValue > wallet.balance) {
        setError('Insufficient balance');
        return;
      }
      
      setError('');
    } else if (withdrawalStep === 1) {
      // Validate bank details based on method
      if (withdrawalMethod === WITHDRAWAL_METHODS.CBE && !bankDetails.accountNumber) {
        setError('Please enter your CBE account number');
        return;
      }
      
      if (withdrawalMethod === WITHDRAWAL_METHODS.TELEBIRR && !bankDetails.phoneNumber) {
        setError('Please enter your Telebirr phone number');
        return;
      }
      
      setError('');
    } else if (withdrawalStep === 2) {
      if (!bankDetails.fullName) {
        setError('Please enter the full name on your account');
        return;
      }
      
      setError('');
    }
    
    // Move to next step
    setWithdrawalStep(withdrawalStep + 1);
  };
  
  const handlePreviousWithdrawalStep = () => {
    setWithdrawalStep(withdrawalStep - 1);
    setError('');
  };
  
  // Handle bank details change
  const handleBankDetailsChange = (e) => {
    setBankDetails({
      ...bankDetails,
      [e.target.name]: e.target.value
    });
  };
  
  // Group transactions by type
  const groupTransactionsByType = (transactions) => {
    return transactions.reduce((groups, transaction) => {
      // Determine the group based on transaction type and direction
      let group = 'other';
      
      if (transaction.type === TRANSACTION_TYPES.DEPOSIT) {
        group = 'deposits';
      } else if (transaction.type === TRANSACTION_TYPES.PAYMENT) {
        if (transaction.amount < 0) {
          group = 'payments';
        } else {
          group = 'earnings';
        }
      } else if (transaction.type === TRANSACTION_TYPES.WITHDRAWAL) {
        group = 'withdrawals';
      } else if (transaction.type === TRANSACTION_TYPES.REFUND) {
        group = 'refunds';
      }
      
      if (!groups[group]) {
        groups[group] = [];
      }
      
      groups[group].push(transaction);
      return groups;
    }, {});
  };

  // Get transaction group title
  const getTransactionGroupTitle = (groupName) => {
    switch (groupName) {
      case 'deposits':
        return 'Deposits';
      case 'payments':
        return 'Payments for Orders';
      case 'earnings':
        return 'Earnings from Sales';
      case 'withdrawals':
        return 'Withdrawals';
      case 'refunds':
        return 'Refunds';
      default:
        return 'Other Transactions';
    }
  };

  // Get transaction group icon
  const getTransactionGroupIcon = (groupName) => {
    switch (groupName) {
      case 'deposits':
        return <ArrowDownwardIcon color="success" />;
      case 'payments':
        return <PaymentIcon color="primary" />;
      case 'earnings':
        return <MoneyIcon color="success" />;
      case 'withdrawals':
        return <ArrowUpwardIcon color="error" />;
      case 'refunds':
        return <ReceiptIcon color="secondary" />;
      default:
        return <HistoryIcon />;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Deposit dialog content
  const renderDepositDialog = () => (
    <Dialog open={openDepositDialog} onClose={() => setOpenDepositDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Deposit Funds</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Add funds to your wallet using your preferred payment method.
        </Typography>
        
        <TextField
          label="Amount (ETB)"
          value={amount}
          onChange={handleAmountChange}
          fullWidth
          margin="normal"
          type="text"
          InputProps={{
            startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
          }}
        />
        
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Payment Method
          </Typography>
          <RadioGroup
            value={depositMethod}
            onChange={(e) => setDepositMethod(e.target.value)}
          >
            <FormControlLabel 
              value="chapa" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CardIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>Chapa (Credit/Debit Card)</Typography>
                </Box>
              } 
            />
            <FormControlLabel 
              value="bank_transfer" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentIcon sx={{ mr: 1 }} />
                  <Typography>Bank Transfer</Typography>
                </Box>
              } 
            />
            <FormControlLabel 
              value="telebirr" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography>TeleBirr</Typography>
                </Box>
              } 
            />
          </RadioGroup>
        </FormControl>
        
        {depositMethod === 'chapa' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You will be redirected to Chapa's secure payment page to complete your transaction.
          </Alert>
        )}
        
        {depositMethod === 'bank_transfer' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Bank Transfer Instructions:
            </Typography>
            <Typography variant="body2">
              1. Transfer the amount to our bank account<br />
              2. Use your user ID as reference<br />
              3. Upload the receipt below
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Bank Details:
            </Typography>
            <Typography variant="body2">
              Bank: Commercial Bank of Ethiopia<br />
              Account Name: Azone E-commerce<br />
              Account Number: 1000123456789<br />
              Reference: {currentUser?.uid?.substring(0, 8)}
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDepositDialog(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleDeposit} 
          variant="contained" 
          color="primary"
          disabled={processingDeposit || !amount}
        >
          {processingDeposit ? <CircularProgress size={24} /> : 'Deposit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Render Chapa payment form modal
  const renderChapaFormModal = () => (
    <Modal
      open={showChapaForm}
      onClose={() => setShowChapaForm(false)}
      aria-labelledby="chapa-payment-modal"
      aria-describedby="chapa-payment-form"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="chapa-payment-modal" variant="h6" component="h2">
            Processing Payment
          </Typography>
          <IconButton onClick={() => setShowChapaForm(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />
        
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          You will be redirected to Chapa's secure payment page.
        </Typography>
        
        {chapaPaymentData && (
          <ChapaPaymentForm
            amount={chapaPaymentData.amount}
            email={chapaPaymentData.email}
            firstName={chapaPaymentData.firstName}
            lastName={chapaPaymentData.lastName}
            userId={chapaPaymentData.userId}
            onSuccess={() => {
              setShowChapaForm(false);
              fetchWalletData();
            }}
            onCancel={() => {
              setShowChapaForm(false);
            }}
          />
        )}
      </Box>
    </Modal>
  );
  
  // Render withdrawal dialog
  const renderWithdrawDialog = () => (
    <Dialog
      open={openWithdrawDialog}
      onClose={() => {
        setOpenWithdrawDialog(false);
        setWithdrawalStep(0);
        setError('');
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Withdraw Funds
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpenWithdrawDialog(false);
            setWithdrawalStep(0);
            setError('');
          }}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={withdrawalStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Amount</StepLabel>
          </Step>
          <Step>
            <StepLabel>Method</StepLabel>
          </Step>
          <Step>
            <StepLabel>Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirm</StepLabel>
          </Step>
        </Stepper>
        
        {/* Step 1: Enter amount */}
        {withdrawalStep === 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Enter withdrawal amount
            </Typography>
            
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    ETB
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Available balance: {formatCurrency(wallet?.balance || 0)} ETB
            </Typography>
          </>
        )}
        
        {/* Step 2: Select withdrawal method */}
        {withdrawalStep === 1 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Select withdrawal method
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={withdrawalMethod}
                onChange={(e) => setWithdrawalMethod(e.target.value)}
              >
                <FormControlLabel
                  value={WITHDRAWAL_METHODS.CBE}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BankIcon sx={{ mr: 1 }} />
                      <Typography>Commercial Bank of Ethiopia (CBE)</Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                
                <FormControlLabel
                  value={WITHDRAWAL_METHODS.TELEBIRR}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon sx={{ mr: 1 }} />
                      <Typography>Telebirr</Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
              </RadioGroup>
            </FormControl>
            
            {/* CBE Account Number */}
            {withdrawalMethod === WITHDRAWAL_METHODS.CBE && (
              <TextField
                label="CBE Account Number"
                name="accountNumber"
                value={bankDetails.accountNumber}
                onChange={handleBankDetailsChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BankIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
            
            {/* Telebirr Phone Number */}
            {withdrawalMethod === WITHDRAWAL_METHODS.TELEBIRR && (
              <TextField
                label="Telebirr Phone Number"
                name="phoneNumber"
                value={bankDetails.phoneNumber}
                onChange={handleBankDetailsChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
          </>
        )}
        
        {/* Step 3: Enter account holder details */}
        {withdrawalStep === 2 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Enter account holder details
            </Typography>
            
            <TextField
              label="Full Name (as it appears on your account)"
              name="fullName"
              value={bankDetails.fullName}
              onChange={handleBankDetailsChange}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please ensure the name matches exactly as it appears on your {withdrawalMethod === WITHDRAWAL_METHODS.CBE ? 'bank account' : 'Telebirr account'}.
            </Typography>
          </>
        )}
        
        {/* Step 4: Confirmation */}
        {withdrawalStep === 3 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Confirm withdrawal details
            </Typography>
            
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(amount)} ETB
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Method:</strong> {withdrawalMethod === WITHDRAWAL_METHODS.CBE ? 'Commercial Bank of Ethiopia (CBE)' : 'Telebirr'}
              </Typography>
              
              {withdrawalMethod === WITHDRAWAL_METHODS.CBE && (
                <Typography variant="body1" gutterBottom>
                  <strong>Account Number:</strong> {bankDetails.accountNumber}
                </Typography>
              )}
              
              {withdrawalMethod === WITHDRAWAL_METHODS.TELEBIRR && (
                <Typography variant="body1" gutterBottom>
                  <strong>Phone Number:</strong> {bankDetails.phoneNumber}
                </Typography>
              )}
              
              <Typography variant="body1">
                <strong>Account Holder:</strong> {bankDetails.fullName}
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Funds will be transferred to your account within 24 hours. Your withdrawal request will be marked as pending until processed.
            </Alert>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        {withdrawalStep > 0 && (
          <Button 
            onClick={handlePreviousWithdrawalStep}
            disabled={processingWithdrawal}
          >
            Back
          </Button>
        )}
        
        {withdrawalStep < 3 ? (
          <Button 
            onClick={handleNextWithdrawalStep}
            variant="contained" 
            color="primary"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleWithdrawal}
            variant="contained"
            color="primary"
            disabled={processingWithdrawal}
            startIcon={processingWithdrawal && <CircularProgress size={20} color="inherit" />}
          >
            {processingWithdrawal ? 'Processing...' : 'Confirm Withdrawal'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
  
  // Render transaction history
  const renderTransactionHistory = () => {
    // Group transactions by type
    const groupedTransactions = groupTransactionsByType(transactions);
    const groups = Object.keys(groupedTransactions);
    
    return (
      <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HistoryIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Transaction History
          </Typography>
        </Box>
        
        {transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
            <ReceiptIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              No transactions found
            </Typography>
          </Box>
        ) : (
          <Box>
            {groups.map((group) => (
              <Box key={group} sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  pb: 1, 
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  {getTransactionGroupIcon(group)}
                  <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
                    {getTransactionGroupTitle(group)} ({groupedTransactions[group].length})
                  </Typography>
                </Box>
                
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {groupedTransactions[group].map((transaction) => (
                    <ListItem 
                      key={transaction.id} 
                      divider
                      sx={{
                        borderLeft: 3,
                        borderColor: transaction.amount > 0 ? 'success.main' : 'error.main',
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'background.default',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Box sx={{ mr: 2 }}>
                        {getTransactionIcon(transaction.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            {transaction.description || 
                              (transaction.type === TRANSACTION_TYPES.PAYMENT && transaction.amount < 0 
                                ? 'Payment for Order' 
                                : transaction.type === TRANSACTION_TYPES.PAYMENT && transaction.amount > 0
                                  ? 'Earnings from Sale'
                                  : transaction.type === TRANSACTION_TYPES.DEPOSIT
                                    ? 'Deposit to Wallet'
                                    : transaction.type === TRANSACTION_TYPES.WITHDRAWAL
                                      ? 'Withdrawal from Wallet'
                                      : transaction.type === TRANSACTION_TYPES.REFUND
                                        ? 'Refund'
                                        : 'Transaction')}
                            {transaction.method && ` via ${transaction.method}`}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(transaction.createdAt)}
                            </Typography>
                            {transaction.orderId && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Order ID: {transaction.orderId.substring(0, 8)}
                              </Typography>
                            )}
                            {transaction.reference && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Ref: {transaction.reference}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography
                            variant="body1"
                            color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)} ETB
                          </Typography>
                          
                          {/* Show status chip for withdrawals */}
                          {transaction.type === TRANSACTION_TYPES.WITHDRAWAL && (
                            <Chip
                              label={transaction.status}
                              color={getStatusColor(transaction.status)}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  };
  
  // Render withdrawal requests
  const renderWithdrawalRequests = () => (
    <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <BankIcon sx={{ mr: 1 }} />
        <Typography variant="h6">
          Withdrawal Requests
        </Typography>
      </Box>
      
      {withdrawalRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
          <RemoveIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No withdrawal requests found
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1, 
            pb: 1, 
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <ArrowUpwardIcon color="error" />
            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
              Pending Withdrawals ({withdrawalRequests.filter(r => r.status === TRANSACTION_STATUS.PENDING).length})
            </Typography>
          </Box>
          
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 3 }}>
            {withdrawalRequests
              .filter(r => r.status === TRANSACTION_STATUS.PENDING)
              .map((request) => (
                <ListItem 
                  key={request.id} 
                  divider
                  sx={{
                    borderLeft: 3,
                    borderColor: 'warning.main',
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    <ArrowUpwardIcon color="error" />
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        Withdrawal Request {request.method && `via ${request.method}`}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(request.createdAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {request.method === WITHDRAWAL_METHODS.CBE 
                            ? `Account: ${request.bankDetails?.accountNumber}` 
                            : `Phone: ${request.bankDetails?.phoneNumber}`}
                        </Typography>
                        {request.bankDetails?.fullName && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Name: {request.bankDetails.fullName}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography
                        variant="body1"
                        color="error.main"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {formatCurrency(request.amount)} ETB
                      </Typography>
                      <Chip
                        size="small"
                        label={request.status}
                        color={getStatusColor(request.status)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
          
          {withdrawalRequests.some(r => r.status !== TRANSACTION_STATUS.PENDING) && (
            <>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1, 
                pb: 1, 
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <HistoryIcon color="action" />
                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
                  Past Withdrawal Requests ({withdrawalRequests.filter(r => r.status !== TRANSACTION_STATUS.PENDING).length})
                </Typography>
              </Box>
              
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {withdrawalRequests
                  .filter(r => r.status !== TRANSACTION_STATUS.PENDING)
                  .map((request) => (
                    <ListItem 
                      key={request.id} 
                      divider
                      sx={{
                        borderLeft: 3,
                        borderColor: request.status === TRANSACTION_STATUS.COMPLETED ? 'success.main' : 'error.main',
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        opacity: 0.8
                      }}
                    >
                      <Box sx={{ mr: 2 }}>
                        <ArrowUpwardIcon color={request.status === TRANSACTION_STATUS.COMPLETED ? 'success' : 'error'} />
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="medium">
                            Withdrawal Request {request.method && `via ${request.method}`}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(request.createdAt)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {request.method === WITHDRAWAL_METHODS.CBE 
                                ? `Account: ${request.bankDetails?.accountNumber}` 
                                : `Phone: ${request.bankDetails?.phoneNumber}`}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography
                            variant="body1"
                            color={request.status === TRANSACTION_STATUS.COMPLETED ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 'bold' }}
                          >
                            {formatCurrency(request.amount)} ETB
                          </Typography>
                          <Chip
                            size="small"
                            label={request.status}
                            color={getStatusColor(request.status)}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Success messages */}
      {depositSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {returnToCheckout && sufficientFundsForCheckout ? 
            'You now have sufficient funds to complete your checkout!' : 
            'Funds added to your wallet successfully!'}
          {returnToCheckout && sufficientFundsForCheckout && (
            <Button 
              variant="contained" 
              color="success" 
              size="small" 
              sx={{ ml: 2 }}
              onClick={handleReturnToCheckout}
            >
              Return to Checkout
            </Button>
          )}
        </Alert>
      )}
      
      {withdrawalSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Withdrawal request submitted successfully!
        </Alert>
      )}
      
      {/* Checkout redirection message */}
      {returnToCheckout && !sufficientFundsForCheckout && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" gutterBottom>
              You need to add at least {formatCurrency(requiredAmount - (wallet?.balance || 0))} more to your wallet to complete your purchase.
            </Typography>
            {wallet && (
              <Typography variant="body2">
                Current balance: {formatCurrency(wallet.balance)} | Required: {formatCurrency(requiredAmount)}
              </Typography>
            )}
          </Box>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WalletIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            My Wallet
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={fetchWalletData} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          mb: 3,
          p: 2,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: 2
        }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Current Balance
            </Typography>
            <Typography variant="h3" component="div">
              {formatCurrency(wallet?.balance || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: { xs: 2, md: 0 }
          }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => setOpenDepositDialog(true)}
            >
              Add Funds
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RemoveIcon />}
              onClick={() => setOpenWithdrawDialog(true)}
              disabled={!wallet?.balance || wallet.balance <= 0}
            >
              Withdraw
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<HistoryIcon />} label="Transactions" />
            <Tab icon={<InfoIcon />} label="Wallet Info" />
          </Tabs>
          
          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <Box>
                {renderTransactionHistory()}
                {renderWithdrawalRequests()}
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Wallet Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Wallet ID
                      </Typography>
                      <Typography variant="body1">
                        {wallet?.id || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {wallet?.role || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Currency
                      </Typography>
                      <Typography variant="body1">
                        {wallet?.currency || 'ETB'} (Ethiopian Birr)
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created On
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(wallet?.createdAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Payment Methods
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    You can add or withdraw funds using the following methods:
                  </Alert>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1">
                          Bank Transfer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Transfer funds directly from your bank account
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1">
                          Mobile Money
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Use telecom services like M-BIRR or HelloCash
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Deposit Dialog */}
      {renderDepositDialog()}
      
      {/* Withdraw Dialog */}
      {renderWithdrawDialog()}
      
      {/* Chapa Payment Form Modal */}
      {renderChapaFormModal()}
    </Container>
  );
};

export default WalletPage;
