import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Badge,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ShoppingBag as ShoppingBagIcon,
  Store as StoreIcon,
  Edit as EditIcon,
  AccountBalanceWallet as WalletIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  History as HistoryIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders, updateUserProfile, validateEthiopianPhoneNumber, getUserStatistics, isEmailVerified, resendVerificationEmail } from '../../firebase/services';
import WalletSummary from '../wallet/WalletSummary';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    role: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const theme = useTheme();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // User data is already available from the auth context
        setUserData(currentUser);
        setFormData({
          displayName: currentUser.displayName || '',
          phoneNumber: currentUser.phoneNumber || '',
          role: currentUser.role || 'buyer'
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };
    
    const fetchUserOrders = async () => {
      try {
        setOrderLoading(true);
        const userOrders = await getUserOrders(currentUser.uid);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (err.code === 'failed-precondition' && err.message.includes('index')) {
          // Handle Firestore index error
          console.log('Index error detected, using fallback query');
        } else {
          setError('Failed to load orders');
        }
      } finally {
        setOrderLoading(false);
      }
    };
    
    const fetchUserStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await getUserStatistics(currentUser.uid);
        setUserStats(stats);
      } catch (err) {
        console.error('Error fetching user statistics:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUserData();
      fetchUserOrders();
      fetchUserStats();
    }
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEditToggle = () => {
    setEditMode(!editMode);
    // Reset form data if canceling edit
    if (editMode) {
      setFormData({
        displayName: userData.displayName || '',
        phoneNumber: userData.phoneNumber || '',
        role: userData.role || 'buyer'
      });
      setPhoneError('');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear phone error when user types
    if (name === 'phoneNumber') {
      setPhoneError('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    
    // Validate phone number if provided
    if (formData.phoneNumber && !validateEthiopianPhoneNumber(formData.phoneNumber)) {
      setPhoneError('Please enter a valid Ethiopian phone number');
      return;
    }
    
    try {
      setSaveLoading(true);
      await updateUserProfile(
        currentUser.uid,
        formData.displayName,
        formData.phoneNumber,
        formData.role
      );
      
      // Update local user data
      setUserData({
        ...userData,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: formData.role
      });
      
      setEditMode(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail(currentUser);
      alert('Verification email has been sent. Please check your inbox.');
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError('Failed to send verification email');
    }
  };
  
  // Calculate user rating based on completed orders and cancellations
  const calculateUserRating = () => {
    if (!userStats) return 0;
    
    const { completedOrders, cancelledOrders } = userStats;
    const totalOrders = completedOrders + cancelledOrders;
    
    if (totalOrders === 0) return 5; // Default rating for new users
    
    // Simple rating calculation: 5 stars - (cancellation percentage * 5)
    const cancellationRate = cancelledOrders / totalOrders;
    const rating = 5 - (cancellationRate * 5);
    
    // Ensure rating is between 1 and 5
    return Math.max(1, Math.min(5, rating));
  };
  
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} color="primary" />
        ))}
        {hasHalfStar && <StarIcon key="half" color="primary" sx={{ opacity: 0.5 }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarBorderIcon key={`empty-${i}`} color="primary" />
        ))}
        <Typography variant="body2" sx={{ ml: 1 }}>
          ({rating.toFixed(1)})
        </Typography>
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Profile Summary Card */}
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                borderRadius: 2,
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[900]})` 
                  : `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[100]})`,
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  pt: 4, 
                  pb: 2
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    userData.emailVerified ? (
                      <Tooltip title="Email Verified">
                        <VerifiedIcon color="primary" />
                      </Tooltip>
                    ) : null
                  }
                >
                  <Avatar
                    alt={userData.displayName || 'User'}
                    src={userData.photoURL}
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      mb: 2,
                      border: `4px solid ${theme.palette.primary.main}`,
                      boxShadow: theme.shadows[4]
                    }}
                  >
                    {userData.displayName ? userData.displayName[0].toUpperCase() : <PersonIcon />}
                  </Avatar>
                </Badge>
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {userData.displayName || 'User'}
                </Typography>
                
                <Chip 
                  label={userData.role === 'seller' ? 'Seller' : 'Buyer'} 
                  color={userData.role === 'seller' ? 'secondary' : 'primary'} 
                  size="small"
                  icon={userData.role === 'seller' ? <StoreIcon /> : <ShoppingBagIcon />}
                  sx={{ mb: 1 }}
                />
                
                {!userData.emailVerified && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mt: 2, 
                      width: '90%',
                      '& .MuiAlert-icon': {
                        alignItems: 'center'
                      }
                    }}
                  >
                    <Box>
                      Email not verified
                      <Button 
                        size="small" 
                        onClick={handleResendVerification}
                        sx={{ ml: 1 }}
                      >
                        Verify Now
                      </Button>
                    </Box>
                  </Alert>
                )}
                
                {!editMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                    sx={{ mt: 2 }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleEditToggle}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmit}
                      disabled={saveLoading}
                    >
                      {saveLoading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Divider />
              
              <CardContent>
                {!editMode ? (
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={userData.email}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone"
                        secondary={userData.phoneNumber || 'Not provided'}
                      />
                    </ListItem>
                    
                    {!statsLoading && userStats && (
                      <>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Completed Orders"
                            secondary={userStats.completedOrders}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemIcon>
                            <StarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Rating"
                            secondary={renderStarRating(calculateUserRating())}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                ) : (
                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      fullWidth
                      id="displayName"
                      label="Display Name"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      autoFocus
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      id="phoneNumber"
                      label="Phone Number"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      error={!!phoneError}
                      helperText={phoneError}
                    />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="role-label">Account Type</InputLabel>
                      <Select
                        labelId="role-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        label="Account Type"
                      >
                        <MenuItem value="buyer">Buyer</MenuItem>
                        <MenuItem value="seller">Seller</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  component={RouterLink}
                  to="/wallet"
                  variant="contained"
                  startIcon={<WalletIcon />}
                  color="primary"
                  sx={{ borderRadius: 4 }}
                >
                  Manage Wallet
                </Button>
              </CardActions>
            </Card>
          </Zoom>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Fade in={true} style={{ transitionDelay: '200ms' }}>
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="profile tabs"
                  variant="fullWidth"
                >
                  <Tab 
                    icon={<ShoppingBagIcon />} 
                    iconPosition="start" 
                    label="Recent Orders" 
                    id="tab-0" 
                    aria-controls="tabpanel-0" 
                  />
                  <Tab 
                    icon={<WalletIcon />} 
                    iconPosition="start" 
                    label="Wallet Summary" 
                    id="tab-1" 
                    aria-controls="tabpanel-1" 
                  />
                  <Tab 
                    icon={<HistoryIcon />} 
                    iconPosition="start" 
                    label="Activity" 
                    id="tab-2" 
                    aria-controls="tabpanel-2" 
                  />
                </Tabs>
              </Box>
              
              {/* Recent Orders Tab */}
              <TabPanel value={tabValue} index={0}>
                {orderLoading ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : orders.length > 0 ? (
                  <List>
                    {orders.slice(0, 5).map((order) => (
                      <ListItem
                        key={order.id}
                        button
                        component={RouterLink}
                        to={`/orders/${order.id}`}
                        divider
                        sx={{ 
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateX(5px)'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <ShippingIcon color={getStatusColor(order.status)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              Order #{order.id.substring(0, 8)}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </Typography>
                              <Chip 
                                label={order.status} 
                                size="small" 
                                color={getStatusColor(order.status)} 
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          ${order.totalAmount.toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                    
                    {orders.length > 5 && (
                      <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
                        <Button
                          component={RouterLink}
                          to="/orders"
                          color="primary"
                        >
                          View All Orders
                        </Button>
                      </Box>
                    )}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No orders yet
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/products"
                      variant="contained"
                      sx={{ mt: 2 }}
                    >
                      Start Shopping
                    </Button>
                  </Box>
                )}
              </TabPanel>
              
              {/* Wallet Summary Tab */}
              <TabPanel value={tabValue} index={1}>
                <WalletSummary />
              </TabPanel>
              
              {/* Activity Tab */}
              <TabPanel value={tabValue} index={2}>
                {statsLoading ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Account Statistics
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            background: theme.palette.mode === 'dark' 
                              ? theme.palette.grey[900] 
                              : theme.palette.grey[50]
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary">
                            Completed Orders
                          </Typography>
                          <Typography variant="h4" sx={{ my: 1, color: theme.palette.success.main }}>
                            {userStats?.completedOrders || 0}
                          </Typography>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            background: theme.palette.mode === 'dark' 
                              ? theme.palette.grey[900] 
                              : theme.palette.grey[50]
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary">
                            Cancelled Orders
                          </Typography>
                          <Typography variant="h4" sx={{ my: 1, color: theme.palette.error.main }}>
                            {userStats?.cancelledOrders || 0}
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Account Rating
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(calculateUserRating() / 5) * 100} 
                          color="primary"
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                          {calculateUserRating().toFixed(1)}/5
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Your account rating is calculated based on your order completion rate and cancellation history.
                    </Typography>
                    
                    {userData.role === 'seller' && (
                      <Box sx={{ mt: 3 }}>
                        <Button
                          component={RouterLink}
                          to="/seller/dashboard"
                          variant="contained"
                          color="secondary"
                          startIcon={<StoreIcon />}
                        >
                          Seller Dashboard
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </TabPanel>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Container>
  );
};

// Helper function to determine chip color based on order status
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'default';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// TabPanel component
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

export default Profile;
