import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Chip,
  Link
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletBalance, getTransactionHistory } from '../../firebase/walletServices';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
};

const WalletSummary = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!currentUser) return;
      
      try {
        // Get wallet balance
        const walletBalance = await getWalletBalance(currentUser.uid);
        setBalance(walletBalance);
        
        // Get recent transactions (limit to 3)
        const transactions = await getTransactionHistory(currentUser.uid, 3);
        setRecentTransactions(transactions);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, [currentUser]);
  
  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button 
          component={RouterLink} 
          to="/wallet" 
          variant="outlined" 
          size="small" 
          sx={{ mt: 1 }}
        >
          View Wallet
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WalletIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Wallet Balance</Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 1.5,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: 1
      }}>
        <Typography variant="h5" component="div">
          {formatCurrency(balance)}
        </Typography>
        
        <Button
          variant="contained"
          size="small"
          component={RouterLink}
          to="/wallet"
          endIcon={<ArrowForwardIcon />}
        >
          Manage
        </Button>
      </Box>
      
      {recentTransactions.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recent Transactions
          </Typography>
          
          {recentTransactions.map((transaction) => (
            <Box 
              key={transaction.id}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                {transaction.description}
              </Typography>
              
              <Chip
                label={transaction.amount > 0 
                  ? `+${formatCurrency(transaction.amount)}` 
                  : formatCurrency(transaction.amount)}
                size="small"
                color={transaction.amount > 0 ? 'success' : 'error'}
              />
            </Box>
          ))}
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/wallet" underline="hover">
              View all transactions
            </Link>
          </Box>
        </>
      )}
      
      {recentTransactions.length === 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No transactions yet
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/wallet"
            sx={{ mt: 1 }}
          >
            Add Funds
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WalletSummary;
