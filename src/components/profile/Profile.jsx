import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  Divider,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  GridView as GridViewIcon,
  List as ListIcon,
  Bookmark as BookmarkIcon,
  ShoppingBag as ShoppingBagIcon,
  Star as StarIcon,
  PhotoCamera as PhotoCameraIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  updateUserProfile, 
  uploadProfileImage, 
  logoutUser, 
  getUserOrders,
  getSellerProducts
} from '../../firebase/services';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    bio: ''
  });
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  
  // Fetch user data
  useEffect(() => {
    if (currentUser && userDetails) {
      setProfileData({
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'User',
        email: currentUser.email,
        photoURL: currentUser.photoURL || 'https://via.placeholder.com/150',
        phoneNumber: userDetails.phoneNumber || '',
        role: userDetails.role || 'buyer',
        bio: userDetails.bio || '',
        joinDate: userDetails.createdAt ? new Date(userDetails.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown',
      });
      
      setFormData({
        displayName: currentUser.displayName || '',
        phoneNumber: userDetails.phoneNumber || '',
        bio: userDetails.bio || ''
      });
      
      setLoading(false);
    }
  }, [currentUser, userDetails]);
  
  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (currentUser) {
        try {
          setOrderLoading(true);
          const userOrders = await getUserOrders(currentUser.uid);
          setOrders(userOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load orders',
            severity: 'error'
          });
        } finally {
          setOrderLoading(false);
        }
      }
    };
    
    if (tabValue === 1) {
      fetchOrders();
    }
  }, [currentUser, tabValue]);
  
  // Fetch products for sellers
  useEffect(() => {
    const fetchProducts = async () => {
      if (currentUser && isSeller && tabValue === 2) {
        try {
          setProductLoading(true);
          const sellerProducts = await getSellerProducts(currentUser.uid);
          setProducts(sellerProducts);
        } catch (error) {
          console.error('Error fetching products:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load products',
            severity: 'error'
          });
        } finally {
          setProductLoading(false);
        }
      }
    };
    
    if (isSeller && tabValue === 2) {
      fetchProducts();
    }
  }, [currentUser, isSeller, tabValue]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle edit dialog
  const handleOpenEditDialog = () => {
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };
  
  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await updateUserProfile(
        currentUser.uid,
        formData.displayName,
        formData.phoneNumber,
        userDetails.role,
        currentUser.photoURL,
        formData.bio
      );
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setImageUploadLoading(true);
      await uploadProfileImage(file, currentUser.uid);
      
      setSnackbar({
        open: true,
        message: 'Profile image updated successfully',
        severity: 'success'
      });
      
      // Force refresh to see new image
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload image',
        severity: 'error'
      });
    } finally {
      setImageUploadLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setSnackbar({
        open: true,
        message: 'Failed to logout',
        severity: 'error'
      });
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Profile Image */}
          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar 
                src={profileData.photoURL} 
                alt={profileData.displayName}
                sx={{ 
                  width: isMobile ? 120 : 150, 
                  height: isMobile ? 120 : 150,
                  mx: 'auto'
                }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="profile-image-upload">
                <IconButton 
                  component="span"
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    }
                  }}
                  disabled={imageUploadLoading}
                >
                  {imageUploadLoading ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
                </IconButton>
              </label>
            </Box>
          </Grid>
          
          {/* Profile Info */}
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mr: 2 }}>
                {profileData.displayName}
              </Typography>
              
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                size="small"
                sx={{ mr: 1 }}
              >
                Edit Profile
              </Button>
              
              <IconButton onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong> {profileData.email}
              </Typography>
              {profileData.phoneNumber && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> {profileData.phoneNumber}
                </Typography>
              )}
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Role:</strong> {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Member since:</strong> {profileData.joinDate}
              </Typography>
            </Box>
            
            {profileData.bio && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {profileData.bio}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Profile Tabs */}
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '0.9rem',
            }
          }}
        >
          <Tab icon={<GridViewIcon />} label="Activity" />
          <Tab icon={<ShoppingBagIcon />} label="Orders" />
          {isSeller && <Tab icon={<StarIcon />} label="Products" />}
          <Tab icon={<BookmarkIcon />} label="Saved" />
        </Tabs>
      </Paper>
      
      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Activity Feed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your recent activity will appear here
          </Typography>
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {orderLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : orders.length > 0 ? (
          <Grid container spacing={2}>
            {orders.map((order) => (
              <Grid item xs={12} key={order.id}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }
                  }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        Order #{order.id.substring(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        ${(order.totalAmount || 0).toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: 
                            order.status === 'completed' ? 'success.light' :
                            order.status === 'cancelled' ? 'error.light' :
                            'warning.light',
                          color: 
                            order.status === 'completed' ? 'success.dark' :
                            order.status === 'cancelled' ? 'error.dark' :
                            'warning.dark',
                        }}
                      >
                        {order.status.toUpperCase()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No Orders Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your order history will appear here
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/products')}
            >
              Start Shopping
            </Button>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={isSeller ? 2 : -1}>
        {productLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)'
                    }
                  }}
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <Box sx={{ position: 'relative', pt: '100%' }}>
                    <Box
                      component="img"
                      src={product.imageUrl}
                      alt={product.name}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle1" noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      ${(product.price || 0).toFixed(2)}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mt: 1 
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: (product.stock || 0) > 0 ? 'success.light' : 'error.light',
                          color: (product.stock || 0) > 0 ? 'success.dark' : 'error.dark',
                        }}
                      >
                        {(product.stock || 0) > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.stock || 0} left
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No Products Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your product listings will appear here
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/seller/products/add')}
            >
              Add Product
            </Button>
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={isSeller ? 3 : 2}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Saved Items
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your saved items will appear here
          </Typography>
        </Box>
      </TabPanel>
      
      {/* Edit Profile Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Display Name"
              name="displayName"
              value={formData.displayName}
              onChange={handleFormChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleFormChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleFormChange}
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
