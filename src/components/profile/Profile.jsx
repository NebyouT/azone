import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  DialogContentText,
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
  useTheme,
  alpha,
  Snackbar,
  IconButton,
  InputAdornment
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
  VerifiedUser as VerifiedUserIcon,
  PhotoCamera as PhotoCameraIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserOrders, 
  updateUserProfile, 
  validateEthiopianPhoneNumber, 
  getUserStatistics, 
  isEmailVerified, 
  resendVerificationEmail,
  uploadProfileImage,
} from '../../firebase/services';
import { auth, db, storage } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import WalletSummary from '../wallet/WalletSummary';
import PendingReviews from '../reviews/PendingReviews';

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
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const theme = useTheme();
  
  // Profile image states
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
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
        
        // Set profile image URL if available
        if (currentUser.photoURL) {
          setProfileImageURL(currentUser.photoURL);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Please try again later.');
        setLoading(false);
      }
    };
    
    const fetchOrders = async () => {
      try {
        if (currentUser) {
          const userOrders = await getUserOrders(currentUser.uid);
          setOrders(userOrders);
        }
        setOrderLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrderLoading(false);
      }
    };
    
    const fetchUserStats = async () => {
      try {
        if (currentUser) {
          const stats = await getUserStatistics(currentUser.uid);
          setUserStats(stats);
        }
        setStatsLoading(false);
      } catch (error) {
        console.error('Error fetching user statistics:', error);
        setStatsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUserData();
      fetchOrders();
      fetchUserStats();
    } else {
      setLoading(false);
      setOrderLoading(false);
      setStatsLoading(false);
    }
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    // Reset form data to current user data
    setFormData({
      displayName: userData.displayName || '',
      phoneNumber: userData.phoneNumber || '',
      role: userData.role || 'buyer'
    });
    setPhoneError('');
    setEditMode(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Validate phone number as user types
      if (value && !validateEthiopianPhoneNumber(value)) {
        setPhoneError('Please enter a valid Ethiopian phone number (e.g., 0911234567)');
      } else {
        setPhoneError('');
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSaveProfile = async () => {
    try {
      // Validate phone number
      if (formData.phoneNumber && !validateEthiopianPhoneNumber(formData.phoneNumber)) {
        setPhoneError('Please enter a valid Ethiopian phone number (e.g., 0911234567)');
        return;
      }
      
      setSaveLoading(true);
      
      // Update user profile
      await updateUserProfile(
        userData.uid,
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
      
      // Exit edit mode
      setEditMode(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: `Failed to update profile: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Handle profile image upload
  const handleImageClick = () => {
    fileInputRef.current.click();
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file',
          severity: 'error'
        });
        return;
      }
      
      setProfileImage(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImageURL(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Upload image
      handleUploadImage(file);
    }
  };
  
  const handleUploadImage = async (file) => {
    try {
      setUploadLoading(true);
      
      // Upload image to Cloudinary via our service
      const downloadURL = await uploadProfileImage(file, userData.uid);
      
      // Update local state
      setProfileImageURL(downloadURL);
      
      // Update user data
      setUserData({
        ...userData,
        photoURL: downloadURL
      });
      
      setSnackbar({
        open: true,
        message: 'Profile image updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setSnackbar({
        open: true,
        message: `Failed to upload profile image: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Handle email verification
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      
      // Use the Firebase auth function to send verification email
      await sendEmailVerification(auth.currentUser);
      
      setSnackbar({
        open: true,
        message: 'Verification email sent. Please check your inbox.',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      setSnackbar({
        open: true,
        message: `Failed to send verification email: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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
                mb: 4,
                borderRadius: 2,
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <CardContent sx={{ pt: 8, pb: 2 }}>
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: -40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton 
                        color="primary"
                        aria-label="upload picture"
                        component="span"
                        onClick={handleImageClick}
                        disabled={uploadLoading}
                        sx={{ 
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    }
                  >
                    <Avatar 
                      src={profileImageURL || (userData?.photoURL || '')}
                      alt={userData?.displayName || 'User'}
                      sx={{ 
                        width: 80, 
                        height: 80,
                        border: `2px solid ${theme.palette.primary.main}`,
                        boxShadow: 2
                      }}
                    />
                  </Badge>
                  <input
                    accept="image/*"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  {uploadLoading && (
                    <Box sx={{ width: '80%', mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}
                </Box>
                
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
                    onClick={handleEditClick}
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
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saveLoading}
                    >
                      {saveLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </CardContent>
              
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
                        primary="Phone Number"
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
                  <Box component="form" onSubmit={handleSaveProfile} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      fullWidth
                      id="displayName"
                      label="Display Name"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      autoFocus
                    />
                    
                    <TextField
                      margin="normal"
                      fullWidth
                      id="phoneNumber"
                      label="Phone Number"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      error={!!phoneError}
                      helperText={phoneError || "Ethiopian phone number format: +251xxxxxxxxx"}
                    />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="role-label">Account Type</InputLabel>
                      <Select
                        labelId="role-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
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
              <Box sx={{ width: '100%', mt: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="profile tabs"
                  >
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
                    <Tab icon={<ShoppingBagIcon />} iconPosition="start" label="Orders" />
                    <Tab icon={<WalletIcon />} iconPosition="start" label="Wallet" />
                    <Tab icon={<StarIcon />} iconPosition="start" label="Reviews" />
                  </Tabs>
                </Box>
                
                {/* Profile Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Edit Profile
                      </Typography>
                      {!editMode ? (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={handleEditClick}
                          sx={{ borderRadius: 0 }}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Box>
                          <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<CancelIcon />}
                            onClick={handleCancelEdit}
                            sx={{ mr: 1, borderRadius: 0 }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveProfile}
                            disabled={saveLoading}
                            sx={{ borderRadius: 0 }}
                          >
                            {saveLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Typography variant="subtitle1" component="h3" fontWeight="bold" gutterBottom>
                      Profile Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          variant={editMode ? "outlined" : "filled"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={userData?.email || ''}
                          disabled
                          variant="filled"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: userData?.emailVerified ? (
                              <InputAdornment position="end">
                                <Tooltip title="Email verified">
                                  <VerifiedIcon color="success" />
                                </Tooltip>
                              </InputAdornment>
                            ) : (
                              <InputAdornment position="end">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  onClick={handleResendVerification}
                                  sx={{ borderRadius: 0 }}
                                >
                                  Verify
                                </Button>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Phone Number (Ethiopian format)"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          variant={editMode ? "outlined" : "filled"}
                          error={!!phoneError}
                          helperText={phoneError || "Format: 0911234567 or +251911234567"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth disabled={!editMode} variant={editMode ? "outlined" : "filled"}>
                          <InputLabel id="role-label">Account Type</InputLabel>
                          <Select
                            labelId="role-label"
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            label="Account Type"
                          >
                            <MenuItem value="buyer">Buyer</MenuItem>
                            <MenuItem value="seller">Seller</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Member Since"
                          value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                          disabled
                          variant="filled"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </TabPanel>
                
                {/* Orders Tab */}
                <TabPanel value={tabValue} index={1}>
                  {orderLoading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : orders.length > 0 ? (
                    <List>
                      {orders.map((order) => (
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
                                Order #{order.orderNumber || order.id.substring(0, 8)}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
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
                            {order.totalAmount !== undefined ? `$${order.totalAmount.toFixed(2)}` : 'N/A'}
                          </Typography>
                        </ListItem>
                      ))}
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
                
                {/* Wallet Tab */}
                <TabPanel value={tabValue} index={2}>
                  <WalletSummary />
                </TabPanel>
                
                {/* Reviews Tab */}
                <TabPanel value={tabValue} index={3}>
                  <PendingReviews />
                </TabPanel>
              </Box>
            </Card>
          </Fade>
        </Grid>
      </Grid>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
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
