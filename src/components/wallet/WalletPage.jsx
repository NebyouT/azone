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
  Modal
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
  Close as CloseIcon
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
  if (!timestamp) return 'N/A';
  
  // Check if it's a Firebase timestamp
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000) 
    : new Date(timestamp);
    
  return date.toLocaleString('en-ET', {
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
    case TRANSACTION_TYPES.PURCHASE:
      return <RemoveIcon color="error" />;
    case TRANSACTION_TYPES.SALE:
      return <AddIcon color="success" />;
    case TRANSACTION_TYPES.REFUND:
      return <RefreshIcon color="info" />;
    case TRANSACTION_TYPES.TRANSFER:
      return <MoneyIcon color="primary" />;
    default:
      return <ReceiptIcon />;
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
  const [activeTab, setActiveTab] = useState(0);
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('chapa');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');
  const [openDepositDialog, setOpenDepositDialog] = useState(false);
  const [openWithdrawDialog, setOpenWithdrawDialog] = useState(false);
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chapaRedirectUrl, setChapaRedirectUrl] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [showChapaForm, setShowChapaForm] = useState(false);
  const [chapaPaymentData, setChapaPaymentData] = useState(null);
  
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
  
  // Load wallet data on component mount
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    fetchWalletData();
  }, [currentUser, navigate]);
  
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
      
      await withdrawFunds(currentUser.uid, amountValue, withdrawalMethod);
      
      // Refresh wallet data
      await fetchWalletData();
      
      // Close dialog and reset form
      setOpenWithdrawDialog(false);
      setAmount('');
      setWithdrawalMethod('bank_transfer');
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError('Failed to withdraw funds. Please try again.');
    } finally {
      setProcessingWithdrawal(false);
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
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
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
                <Typography variant="h6" gutterBottom>
                  Transaction History
                </Typography>
                
                {transactions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No transactions yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {transactions.map((transaction) => (
                      <ListItem
                        key={transaction.id}
                        divider
                        sx={{
                          borderLeft: 3,
                          borderColor: getTransactionColor(transaction.amount),
                          mb: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ mr: 2 }}>
                          {getTransactionIcon(transaction.type)}
                        </Box>
                        <ListItemText
                          primary={transaction.description}
                          secondary={formatDate(transaction.createdAt)}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography
                              variant="body1"
                              color={getTransactionColor(transaction.amount)}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {formatCurrency(transaction.amount)}
                            </Typography>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status)}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
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
      <Dialog 
        open={openWithdrawDialog} 
        onClose={() => setOpenWithdrawDialog(false)}
        aria-labelledby="withdraw-dialog-title"
        disableEnforceFocus
        keepMounted
      >
        <DialogTitle id="withdraw-dialog-title">Withdraw Funds</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Amount (ETB)"
              value={amount}
              onChange={handleAmountChange}
              margin="normal"
              type="text"
              InputProps={{
                startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
              }}
              helperText={`Available balance: ${formatCurrency(wallet?.balance || 0)}`}
              autoFocus
            />
            
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Withdrawal Method
              </Typography>
              <RadioGroup
                value={withdrawalMethod}
                onChange={(e) => setWithdrawalMethod(e.target.value)}
              >
                <FormControlLabel
                  value="bank_transfer"
                  control={<Radio />}
                  label="Bank Transfer"
                />
                <FormControlLabel
                  value="mobile_money"
                  control={<Radio />}
                  label="Mobile Money"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWithdrawDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawal}
            variant="contained"
            color="primary"
            disabled={processingWithdrawal || !amount || parseFloat(amount) > (wallet?.balance || 0)}
          >
            {processingWithdrawal ? <CircularProgress size={24} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Chapa Payment Form Modal */}
      {renderChapaFormModal()}
    </Container>
  );
};

export default WalletPage;
