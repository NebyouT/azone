import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletBalance } from '../../firebase/walletServices';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
};

const PaymentOptions = ({ onPaymentMethodChange, totalAmount }) => {
  const { currentUser } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!currentUser) return;
      
      try {
        const balance = await getWalletBalance(currentUser.uid);
        setWalletBalance(balance);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError('Failed to load wallet balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletBalance();
  }, [currentUser]);
  
  const handlePaymentMethodChange = (event) => {
    const method = event.target.value;
    setPaymentMethod(method);
    onPaymentMethodChange(method);
  };
  
  const insufficientBalance = walletBalance < totalAmount;
  
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <RadioGroup
        value={paymentMethod}
        onChange={handlePaymentMethodChange}
      >
        <FormControlLabel
          value="wallet"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WalletIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body1">
                  Wallet Payment
                </Typography>
                {loading ? (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Available Balance: {formatCurrency(walletBalance)}
                  </Typography>
                )}
              </Box>
            </Box>
          }
          disabled={loading || insufficientBalance}
        />
        
        {!loading && insufficientBalance && (
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            Insufficient wallet balance. Please add funds or choose another payment method.
          </Alert>
        )}
        
        <FormControlLabel
          value="credit_card"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CardIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Credit/Debit Card
              </Typography>
            </Box>
          }
        />
        
        <FormControlLabel
          value="bank_transfer"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BankIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Bank Transfer
              </Typography>
            </Box>
          }
        />
        
        <FormControlLabel
          value="cash_on_delivery"
          control={<Radio />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PaymentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body1">
                Cash on Delivery
              </Typography>
            </Box>
          }
        />
      </RadioGroup>
      
      {paymentMethod === 'wallet' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          The amount will be deducted from your wallet balance immediately upon order confirmation.
        </Alert>
      )}
      
      {paymentMethod === 'bank_transfer' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You will receive bank transfer instructions after placing your order.
        </Alert>
      )}
      
      {paymentMethod === 'credit_card' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You will be redirected to a secure payment gateway after placing your order.
        </Alert>
      )}
      
      {paymentMethod === 'cash_on_delivery' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Pay with cash when your order is delivered.
        </Alert>
      )}
    </Paper>
  );
};

export default PaymentOptions;
