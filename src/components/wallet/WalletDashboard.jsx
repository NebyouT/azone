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
  DialogTitle, 
  DialogContent, 
  DialogActions,
  DialogContentText,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha,
  Link,
  Tab,
  Tabs,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  BarChart as BarChartIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  AccessTime as AccessTimeIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, subMonths } from 'date-fns';
import { glassmorphism } from '../../theme/futuristicTheme';
import ChapaPaymentForm from './ChapaPaymentForm';
import { initializeDeposit, saveTransactionReference } from '../../chapa/services';
import CHAPA_CONFIG from '../../chapa/config';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WalletDashboard = () => {
  const {
    balance,
    transactions,
    loading,
    error,
    success,
    addFunds,
    withdrawFunds,
    processingPayment,
    updateWalletData,
    withdrawalRequests
  } = useWallet();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const theme = useTheme();

  // State variables
  const [tabValue, setTabValue] = useState(0);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [localError, setLocalError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [chapaFormData, setChapaFormData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openFilters, setOpenFilters] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: ''
  });
  const isMobile = false; // This should be replaced with a proper hook or state

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle deposit dialog
  const handleOpenDeposit = () => {
    setOpenDeposit(true);
    setAmount('');
    setLocalError('');
  };

  const handleCloseDeposit = () => {
    setOpenDeposit(false);
  };

  // Handle withdraw dialog
  const handleOpenWithdraw = () => {
    setOpenWithdraw(true);
    setAmount('');
    setLocalError('');
  };

  const handleCloseWithdraw = () => {
    setOpenWithdraw(false);
  };

  // Handle amount input
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and a single decimal point
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
      setLocalError('');
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }
    
    setProcessing(true);
    setLocalError(null);
    
    try {
      const amountToAdd = parseFloat(amount);
      console.log(`Initializing deposit of ${amountToAdd} ETB`);
      
      // Get user data for the payment form
      const userEmail = currentUser.email || '';
      const userName = currentUser.displayName || '';
      const [firstName, lastName] = userName.split(' ').length > 1 
        ? [userName.split(' ')[0], userName.split(' ').slice(1).join(' ')] 
        : [userName, ''];
      
      // Generate a unique transaction reference
      const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      const txRef = `negade-tx-${randomNumbers}`;
      
      // Initialize the deposit with Chapa
      const result = await initializeDeposit(
        currentUser.uid,
        amountToAdd,
        userEmail,
        firstName,
        lastName,
        currentUser.phoneNumber || ''
      );
      
      // The result contains the transaction reference and other data
      // Set the form data for the Chapa payment form
      setChapaFormData({
        public_key: CHAPA_CONFIG.PUBLIC_KEY,
        tx_ref: result.txRef,
        amount: amountToAdd,
        currency: 'ETB',
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        description: `Add ${amountToAdd} ETB to your Azone wallet`,
        callback_url: `${window.location.origin}/wallet`,
        return_url: `${window.location.origin}/wallet?tx_ref=${result.txRef}&status=success`
      });
      
      // Close the deposit dialog
      handleCloseDeposit();
      
      setAmount('');
    } catch (error) {
      console.error('Error initializing deposit:', error);
      setLocalError('Failed to initialize deposit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // State for withdrawal form is already declared above

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      setLocalError('Insufficient balance');
      return;
    }

    if (!withdrawalMethod) {
      setLocalError('Please select a withdrawal method');
      return;
    }

    if (!bankDetails.accountName) {
      setLocalError('Please enter account name');
      return;
    }

    if (!bankDetails.accountNumber) {
      setLocalError('Please enter account number');
      return;
    }

    setProcessing(true);
    const result = await withdrawFunds(
      parseFloat(amount), 
      withdrawalMethod, 
      bankDetails
    );
    setProcessing(false);

    if (result) {
      handleCloseWithdraw();
      // Reset form
      setWithdrawalMethod('');
      setBankDetails({
        accountName: '',
        accountNumber: ''
      });
    }
  };

  // Handle bank details change
  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(value);
  };

  // Get transaction color
  const getTransactionColor = (type) => {
    return type === 'deposit' ? theme.palette.success.main : theme.palette.error.main;
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    return type === 'deposit' ? (
      <ArrowUpwardIcon fontSize="small" color="success" />
    ) : (
      <ArrowDownwardIcon fontSize="small" color="error" />
    );
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const searchMatch = searchQuery === '' || 
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.method?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filter
    let dateMatch = true;
    const txDate = transaction.timestamp ? new Date(transaction.timestamp) : new Date();
    
    if (dateFilter === 'today') {
      const today = new Date();
      dateMatch = txDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = subDays(new Date(), 7);
      dateMatch = txDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = subMonths(new Date(), 1);
      dateMatch = txDate >= monthAgo;
    }
    
    // Type filter
    const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
    
    return searchMatch && dateMatch && typeMatch;
  });

  // Calculate statistics
  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const transactionCount = transactions.length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Chapa payment form - hidden */}
      {chapaFormData && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ p: 3, maxWidth: 500, width: '100%', borderRadius: 0 }}>
            <Typography variant="h6" gutterBottom>
              Processing Payment
            </Typography>
            <Typography variant="body2" paragraph>
              You are being redirected to Chapa payment gateway. Please do not close this window.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
            <ChapaPaymentForm
              formData={chapaFormData}
              onSuccess={() => {
                setChapaFormData(null);
                updateWalletData();
              }}
              onCancel={() => {
                setChapaFormData(null);
              }}
            />
          </Paper>
        </Box>
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

      {/* Balance Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          ...glassmorphism(0.8, 10, theme.palette.mode === 'dark'),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        <Grid container spacing={3}>
          <Grid item grid={{ xs: 12, md: 6 }}>
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
                  sx={{ flex: 1, borderRadius: 0 }}
                >
                  {t('addFunds')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RemoveIcon />}
                  onClick={handleOpenWithdraw}
                  disabled={loading || processingPayment || balance <= 0}
                  sx={{ flex: 1, borderRadius: 0 }}
                >
                  {t('withdraw')}
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item grid={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Paper sx={{ 
                p: 2, 
                flex: '1 0 calc(33% - 16px)', 
                minWidth: '120px',
                background: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 0
              }}>
                <Typography variant="body2" color="text.secondary">Total Deposits</Typography>
                <Typography variant="h6">{formatCurrency(totalDeposits)}</Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 2, 
                flex: '1 0 calc(33% - 16px)', 
                minWidth: '120px',
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 0
              }}>
                <Typography variant="body2" color="text.secondary">Total Withdrawals</Typography>
                <Typography variant="h6">{formatCurrency(totalWithdrawals)}</Typography>
              </Paper>
              
              <Paper sx={{ 
                p: 2, 
                flex: '1 0 calc(33% - 16px)', 
                minWidth: '120px',
                background: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 0
              }}>
                <Typography variant="body2" color="text.secondary">Transactions</Typography>
                <Typography variant="h6">{transactionCount}</Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Overview Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          <WalletIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('overview')}
        </Typography>
      </Box>

      {/* Overview Content */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item grid={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 0 }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Grid>
            <Grid item grid={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="date-filter-label">Date</InputLabel>
                  <Select
                    labelId="date-filter-label"
                    value={dateFilter}
                    label="Date"
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="type-filter-label">Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="deposit">Deposits</MenuItem>
                    <MenuItem value="withdrawal">Withdrawals</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No transactions found
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {filteredTransactions.map((transaction) => (
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
                      backgroundColor: alpha(
                        getTransactionColor(transaction.type),
                        0.1
                      ),
                      borderRadius: 0,
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
              startAdornment: <Box component="span" sx={{ mr: 1 }}>ETB</Box>,
              sx: { borderRadius: 0 }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeposit} sx={{ borderRadius: 0 }}>{t('cancel')}</Button>
          <Button
            onClick={handleDeposit}
            variant="contained"
            disabled={processing || processingPayment || !amount}
            sx={{ borderRadius: 0 }}
          >
            {processing || processingPayment ? <CircularProgress size={24} /> : t('addFunds')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog 
        open={openWithdraw} 
        onClose={handleCloseWithdraw}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('withdraw')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('enterAmountToWithdraw')}
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label={t('amount')}
                type="text"
                fullWidth
                variant="outlined"
                value={amount}
                onChange={handleAmountChange}
                error={!!localError}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>ETB</Box>,
                  sx: { borderRadius: 0 }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {t('availableBalance')}: {formatCurrency(balance)}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="withdrawal-method-label">Withdrawal Method</InputLabel>
                <Select
                  labelId="withdrawal-method-label"
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value)}
                  label="Withdrawal Method"
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="">Select a method</MenuItem>
                  <MenuItem value="telebirr">TeleBirr</MenuItem>
                  <MenuItem value="cbe">Commercial Bank of Ethiopia (CBE)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Account Name"
                name="accountName"
                type="text"
                fullWidth
                variant="outlined"
                value={bankDetails.accountName}
                onChange={handleBankDetailsChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 }, mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label={withdrawalMethod === 'telebirr' ? 'TeleBirr Number' : 'Account Number'}
                name="accountNumber"
                type="text"
                fullWidth
                variant="outlined"
                value={bankDetails.accountNumber}
                onChange={handleBankDetailsChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Grid>
          </Grid>
          
          {localError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {localError}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: Withdrawal requests are subject to approval. Once approved, funds will be transferred to your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdraw} sx={{ borderRadius: 0 }}>{t('cancel')}</Button>
          <Button
            onClick={handleWithdraw}
            variant="contained"
            disabled={processing || !amount || parseFloat(amount) > balance}
            sx={{ borderRadius: 0 }}
          >
            {processing ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WalletDashboard;
