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
  CircularProgress,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon
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
  const navigate = useNavigate();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!currentUser) return;
      
      try {
        const balance = await getWalletBalance(currentUser.uid);
        setWalletBalance(balance);
        
        // Automatically set payment method to wallet
        onPaymentMethodChange('wallet');
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError('Failed to load wallet balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletBalance();
  }, [currentUser, onPaymentMethodChange]);
  
  const insufficientBalance = walletBalance < totalAmount;
  
  const handleAddFunds = () => {
    navigate('/wallet');
  };
  
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Method
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
      
      {!loading && insufficientBalance ? (
        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" gutterBottom>
              Insufficient wallet balance. You need {formatCurrency(totalAmount - walletBalance)} more to complete this purchase.
            </Typography>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<AddIcon />} 
              onClick={handleAddFunds}
              sx={{ mt: 1 }}
            >
              Add Funds to Wallet
            </Button>
          </Box>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          The amount will be deducted from your wallet balance immediately upon order confirmation.
        </Alert>
      )}
    </Paper>
  );
};

export default PaymentOptions;
