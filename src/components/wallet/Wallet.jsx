import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  History as HistoryIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';
import { glassmorphism } from '../../theme/futuristicTheme';
import CHAPA_CONFIG from '../../chapa/config';
import ChapaPaymentForm from './ChapaPaymentForm'; // Import the ChapaPaymentForm component

const Wallet = () => {
  const { 
    balance, 
    transactions, 
    loading, 
    error, 
    success,
    addFunds, 
    withdrawFunds, 
    processingPayment,
    checkoutUrl,
    resetCheckoutUrl
  } = useWallet();
  const { t } = useLanguage();
  const theme = useTheme();
  
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [chapaFormData, setChapaFormData] = useState(null);
  
  // Handle redirect to Chapa checkout
  useEffect(() => {
    if (checkoutUrl) {
      // This is kept for backward compatibility
      window.location.href = checkoutUrl;
    }
  }, [checkoutUrl]);
  
  // Handle form submission to Chapa
  useEffect(() => {
    if (chapaFormData) {
      console.log('Chapa form data ready:', chapaFormData);
      // The ChapaPaymentForm component will handle the submission
    }
  }, [chapaFormData]);
  
  const handleOpenDeposit = () => {
    setOpenDeposit(true);
    setAmount('');
    setLocalError('');
  };
  
  const handleCloseDeposit = () => {
    setOpenDeposit(false);
  };
  
  const handleOpenWithdraw = () => {
    setOpenWithdraw(true);
    setAmount('');
    setLocalError('');
  };
  
  const handleCloseWithdraw = () => {
    setOpenWithdraw(false);
  };
  
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and a single decimal point
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
      setLocalError('');
    }
  };
  
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }
    
    setProcessing(true);
    try {
      // Make sure amount is parsed as a float
      const amountToAdd = parseFloat(amount);
      console.log('Initializing deposit with amount:', amountToAdd);
      
      // Get Chapa form data
      const formData = await addFunds(amountToAdd);
      if (formData) {
        console.log('Received form data from Chapa:', formData);
        setChapaFormData(formData);
        handleCloseDeposit(); // Close the deposit dialog
      } else {
        setLocalError('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      setLocalError('Failed to initialize payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > balance) {
      setLocalError('Insufficient balance');
      return;
    }
    
    setProcessing(true);
    const result = await withdrawFunds(parseFloat(amount));
    setProcessing(false);
    
    if (result) {
      handleCloseWithdraw();
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  const getTransactionColor = (type) => {
    return type === 'deposit' ? theme.palette.success.main : theme.palette.error.main;
  };
  
  const getTransactionIcon = (type) => {
    return type === 'deposit' ? (
      <ArrowUpwardIcon fontSize="small" color="success" />
    ) : (
      <ArrowDownwardIcon fontSize="small" color="error" />
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Chapa payment form - hidden */}
      {chapaFormData && (
        <ChapaPaymentForm 
          formData={chapaFormData}
          onSuccess={() => {
            setChapaFormData(null);
          }}
          onCancel={() => {
            setChapaFormData(null);
          }}
        />
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('wallet')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('manageYourFunds')}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Balance Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              ...glassmorphism(0.8, 10, theme.palette.mode === 'dark'),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 0, // Remove border radius
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -15,
                right: -15,
                width: 80,
                height: 80,
                borderRadius: 0, // Remove border radius
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                zIndex: 0,
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('walletBalance')}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Typography variant="h3" component="div" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {formatCurrency(balance)}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDeposit}
                  disabled={loading || processingPayment}
                  fullWidth
                  sx={{ borderRadius: 0 }} // Remove border radius
                >
                  {t('addFunds')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RemoveIcon />}
                  onClick={handleOpenWithdraw}
                  disabled={loading || processingPayment || balance <= 0}
                  fullWidth
                  sx={{ borderRadius: 0 }} // Remove border radius
                >
                  {t('withdraw')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Transactions Card */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              ...glassmorphism(0.8, 10, theme.palette.mode === 'dark'),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 0, // Remove border radius
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="text.secondary">
                {t('recentTransactions')}
              </Typography>
              <Tooltip title={t('transactionHistory')}>
                <IconButton size="small">
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : transactions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('noTransactions')}
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                {transactions.slice(0, 5).map((transaction) => (
                  <ListItem
                    key={transaction.id}
                    alignItems="flex-start"
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <Box
                        sx={{
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 0, // Remove border radius
                          backgroundColor: alpha(
                            getTransactionColor(transaction.type),
                            0.1
                          ),
                        }}
                      >
                        {getTransactionIcon(transaction.type)}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1">
                            {transaction.type === 'deposit'
                              ? t('depositedFunds')
                              : t('withdrewFunds')}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: getTransactionColor(transaction.type),
                              fontWeight: 'bold',
                            }}
                          >
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </Box>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {transaction.description || (transaction.method === 'chapa' ? 'Via Chapa Payment' : 'Manual transaction')}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            color="text.secondary"
                          >
                            <AccessTimeIcon fontSize="inherit" />
                            {transaction.timestamp
                              ? format(transaction.timestamp, 'MMM dd, yyyy HH:mm')
                              : 'Unknown date'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            
            {transactions.length > 5 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  endIcon={<HistoryIcon />}
                  sx={{ textTransform: 'none', borderRadius: 0 }} // Remove border radius
                >
                  {t('viewAllTransactions')}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Deposit Dialog */}
      <Dialog open={openDeposit} onClose={handleCloseDeposit}>
        <DialogTitle>{t('addFunds')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('enterAmountToAdd')}
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <PaymentIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2">
              Payments are processed securely via Chapa
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label={t('amount')}
            type="text"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={handleAmountChange}
            error={!!localError}
            helperText={localError}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} // Remove border radius
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeposit} sx={{ borderRadius: 0 }}>{t('cancel')}</Button>
          <Button 
            onClick={handleDeposit} 
            variant="contained" 
            disabled={processing || processingPayment || !amount}
            sx={{ borderRadius: 0 }} // Remove border radius
          >
            {processing || processingPayment ? <CircularProgress size={24} /> : t('addFunds')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Withdraw Dialog */}
      <Dialog open={openWithdraw} onClose={handleCloseWithdraw}>
        <DialogTitle>{t('withdraw')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('enterAmountToWithdraw')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('amount')}
            type="text"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={handleAmountChange}
            error={!!localError}
            helperText={localError}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} // Remove border radius
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('availableBalance')}: {formatCurrency(balance)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdraw} sx={{ borderRadius: 0 }}>{t('cancel')}</Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={processing || !amount || parseFloat(amount) > balance}
            sx={{ borderRadius: 0 }} // Remove border radius
          >
            {processing ? <CircularProgress size={24} /> : t('withdraw')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Wallet;
