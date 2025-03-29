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
  LinearProgress
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
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders, updateUserProfile, validateEthiopianPhoneNumber, getUserStatistics } from '../../firebase/services';
import WalletSummary from '../wallet/WalletSummary';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    phoneNumber: '',
    role: 'buyer'
  });
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    completionRate: 0,
    cancellationRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser) return;
        
        setLoading(true);
        
        // Get user document from Firestore
        const userDoc = await updateUserProfile.getUserDocument(currentUser.uid);
        
        if (userDoc) {
          setUserData(userDoc);
          setEditFormData({
            displayName: userDoc.displayName || '',
            phoneNumber: userDoc.phoneNumber || '',
            role: userDoc.role || 'buyer'
          });
        } else {
          // Fallback to auth user data
          setUserData({
            displayName: currentUser.displayName || 'User',
            email: currentUser.email,
            phoneNumber: currentUser.phoneNumber || 'Not provided',
            role: 'buyer',
            photoURL: currentUser.photoURL || null
          });
          
          setEditFormData({
            displayName: currentUser.displayName || '',
            phoneNumber: currentUser.phoneNumber || '',
            role: 'buyer'
          });
        }
        
        // Fetch user statistics
        try {
          setLoadingStats(true);
          const statistics = await getUserStatistics(currentUser.uid);
          setUserStats(statistics);
        } catch (statsErr) {
          console.error('Error fetching user statistics:', statsErr);
        } finally {
          setLoadingStats(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!currentUser) return;
        
        setLoadingOrders(true);
        const userOrders = await getUserOrders(currentUser.uid);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    
    if (activeTab === 1) {
      fetchOrders();
    }
  }, [currentUser, activeTab]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditDialogOpen = () => {
    setEditFormData({
      displayName: userData?.displayName || '',
      phoneNumber: userData?.phoneNumber || '',
      role: userData?.role || 'buyer'
    });
    setPhoneError('');
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'phoneNumber') {
      setPhoneError('');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate phone number if provided
      if (editFormData.phoneNumber && !validateEthiopianPhoneNumber(editFormData.phoneNumber)) {
        setPhoneError('Please enter a valid Ethiopian phone number (e.g., +251 9XX XXX XXX or 09XXXXXXXX)');
        setSaving(false);
        return;
      }
      
      // Update user profile
      await updateUserProfile(
        currentUser.uid,
        editFormData.displayName,
        editFormData.phoneNumber,
        editFormData.role
      );
      
      // Update local user data
      setUserData(prev => ({
        ...prev,
        displayName: editFormData.displayName,
        phoneNumber: editFormData.phoneNumber,
        role: editFormData.role
      }));
      
      // Close dialog
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success.main';
      case 'processing':
        return 'info.main';
      case 'shipped':
        return 'primary.main';
      case 'cancelled':
        return 'error.main';
      case 'pending':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={userData?.photoURL}
                alt={userData?.displayName}
                sx={{ width: 100, height: 100, mb: 2 }}
              >
                {userData?.displayName?.charAt(0) || 'U'}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {userData?.displayName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {userData?.role} Account
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                sx={{ mt: 1 }}
                onClick={handleEditDialogOpen}
              >
                Edit Profile
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={userData?.email}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={userData?.phoneNumber || 'Not provided'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Member Since"
                  secondary={userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* User Statistics */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              Order Statistics
              <Tooltip title="Statistics about your order history">
                <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
              </Tooltip>
            </Typography>
            
            {loadingStats ? (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {userStats.totalOrders}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        Completion Rate
                        <CheckCircleIcon fontSize="small" sx={{ ml: 0.5, color: 'success.main' }} />
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={userStats.completionRate} 
                            color="success"
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {userStats.completionRate}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {userStats.completedOrders} completed orders
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        Cancellation Rate
                        <CancelIcon fontSize="small" sx={{ ml: 0.5, color: 'error.main' }} />
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={userStats.cancellationRate} 
                            color="error"
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {userStats.cancellationRate}%
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {userStats.cancelledOrders} cancelled orders
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
          
          {/* Wallet Summary */}
          <WalletSummary />
          
          {/* Quick Links */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            
            <List dense>
              <ListItem button component={RouterLink} to="/orders">
                <ListItemIcon>
                  <ShoppingBagIcon />
                </ListItemIcon>
                <ListItemText primary="My Orders" />
              </ListItem>
              
              <ListItem button component={RouterLink} to="/wallet">
                <ListItemIcon>
                  <WalletIcon />
                </ListItemIcon>
                <ListItemText primary="My Wallet" />
              </ListItem>
              
              {userData?.role === 'seller' && (
                <ListItem button component={RouterLink} to="/seller/dashboard">
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText primary="Seller Dashboard" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label="Activity" />
              <Tab label="Orders" />
              <Tab label="Settings" />
            </Tabs>
            
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Your recent activity will appear here.
                </Alert>
                
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No recent activity
                  </Typography>
                  
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/products"
                    sx={{ mt: 2 }}
                  >
                    Browse Products
                  </Button>
                </Box>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Your Orders
                </Typography>
                
                {loadingOrders ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : orders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      You haven't placed any orders yet
                    </Typography>
                    
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/products"
                      sx={{ mt: 2 }}
                    >
                      Start Shopping
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {orders.map((order) => (
                      <Paper
                        key={order.id}
                        variant="outlined"
                        sx={{ p: 2, mb: 2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">
                            Order #{order.id.slice(-6)}
                          </Typography>
                          
                          <Typography
                            variant="body2"
                            sx={{
                              color: getOrderStatusColor(order.status),
                              textTransform: 'capitalize',
                              fontWeight: 'bold'
                            }}
                          >
                            {order.status}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Placed on {formatDate(order.createdAt)}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            Total: {new Intl.NumberFormat('en-ET', {
                              style: 'currency',
                              currency: 'ETB'
                            }).format(order.total || 0)}
                          </Typography>
                        </Box>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          component={RouterLink}
                          to={`/orders/${order.id}`}
                        >
                          View Details
                        </Button>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            )}
            
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Profile Information
                      </Typography>
                      
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleEditDialogOpen}
                        sx={{ mt: 1 }}
                      >
                        Edit Profile
                      </Button>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Password & Security
                      </Typography>
                      
                      <Button
                        variant="outlined"
                        sx={{ mt: 1 }}
                      >
                        Change Password
                      </Button>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Notification Preferences
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Notification settings coming soon
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Display Name"
              name="displayName"
              value={editFormData.displayName}
              onChange={handleEditFormChange}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Phone Number"
              name="phoneNumber"
              value={editFormData.phoneNumber}
              onChange={handleEditFormChange}
              error={!!phoneError}
              helperText={phoneError || "Ethiopian format: +251 9XXXXXXXX or 09XXXXXXXX"}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Account Type</InputLabel>
              <Select
                name="role"
                value={editFormData.role}
                onChange={handleEditFormChange}
                label="Account Type"
              >
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="seller">Seller</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleEditDialogClose}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
