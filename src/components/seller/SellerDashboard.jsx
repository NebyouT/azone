import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Avatar,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Badge,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as ShippingIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getSellerProducts, 
  getSellerOrders, 
  updateSellerOrderStatus,
  getBuyerInfoForOrder,
  updateShopSettings,
  getShopSettings,
  deleteProduct
} from '../../firebase/services';
import { formatCurrency, formatDate } from '../../utils/formatters';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`seller-tabpanel-${index}`}
      aria-labelledby={`seller-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller } = useAuth();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Order management
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  
  // Product management
  const [productFilter, setProductFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [productsPerPage, setProductsPerPage] = useState(10);

  // State for order status update
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [buyerInfoLoading, setBuyerInfoLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // State for shop settings
  const [shopSettings, setShopSettings] = useState({
    name: '',
    url: '',
    description: '',
    email: '',
    phone: '',
    paymentMethod: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    mobileNumber: '',
    paypalEmail: '',
    returnPolicy: '',
    shippingPolicy: ''
  });
  const [shopSettingsLoading, setShopSettingsLoading] = useState(false);
  const [shopSettingsError, setShopSettingsError] = useState('');
  const [shopSettingsSuccess, setShopSettingsSuccess] = useState(false);

  // Product delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Redirect if not a seller
    if (currentUser && userDetails && !isSeller) {
      navigate('/');
    }
  }, [currentUser, userDetails, isSeller, navigate]);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // Fetch seller's products
        const sellerProducts = await getSellerProducts(currentUser.uid);
        setProducts(sellerProducts);
        
        // Fetch seller's orders
        const sellerOrders = await getSellerOrders(currentUser.uid);
        setOrders(sellerOrders);
        
        // Fetch shop settings
        const settings = await getShopSettings(currentUser.uid);
        setShopSettings(settings);
        
        setError('');
      } catch (err) {
        console.error("Error fetching seller data:", err);
        setError('Failed to load seller data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSellerData();
  }, [currentUser]);

  // Handle order status update
  const handleOpenStatusDialog = async (order, initialStatus) => {
    setSelectedOrder(order);
    setNewStatus(initialStatus || getNextStatus(order.status));
    setStatusDialogOpen(true);
    
    // Fetch buyer information
    try {
      setBuyerInfoLoading(true);
      const info = await getBuyerInfoForOrder(order.id);
      setBuyerInfo(info);
    } catch (error) {
      console.error('Error fetching buyer info:', error);
      setBuyerInfo(null);
    } finally {
      setBuyerInfoLoading(false);
    }
  };
  
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus('');
    setBuyerInfo(null);
  };
  
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'confirmed';
      case 'confirmed':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      default:
        return 'confirmed';
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setStatusUpdateLoading(true);
      setStatusUpdateError('');
      
      await updateSellerOrderStatus(selectedOrder.id, newStatus, currentUser.uid);
      
      // Update local state
      const updatedOrders = orders.map(order => {
        if (order.id === selectedOrder.id) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      setStatusUpdateSuccess(true);
      handleCloseStatusDialog();
      
      // Refresh orders after a short delay
      setTimeout(() => {
        const fetchSellerData = async () => {
          try {
            const sellerOrders = await getSellerOrders(currentUser.uid);
            setOrders(sellerOrders);
          } catch (error) {
            console.error("Error refreshing orders:", error);
          }
        };
        
        fetchSellerData();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setStatusUpdateError(error.message || 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleSaveShopSettings = async () => {
    try {
      setShopSettingsLoading(true);
      setShopSettingsError('');
      
      await updateShopSettings(shopSettings, currentUser.uid);
      
      setShopSettingsSuccess(true);
    } catch (error) {
      console.error('Error saving shop settings:', error);
      setShopSettingsError(error.message || 'Failed to save shop settings');
    } finally {
      setShopSettingsLoading(false);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteProduct(productToDelete.id);
      
      // Update products list
      setProducts(products.filter(p => p.id !== productToDelete.id));
      
      // Show success message
      setSnackbarMessage('Product deleted successfully');
      setSnackbarOpen(true);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbarMessage(`Error deleting product: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, md: 4 },
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Seller Dashboard
        </Typography>
        <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/seller/products/add')}
            sx={{ 
              borderRadius: 0, 
              ml: 'auto',
              flex: { xs: 1, sm: 'none' },
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { borderRadius: 0 },
            '& .MuiTab-labelIcon': {
              minHeight: { xs: '48px', md: '64px' },
              padding: { xs: '6px 12px', md: '6px 16px' },
            }
          }}
        >
          <Tab 
            icon={<ShoppingBagIcon fontSize="small" />} 
            label="Products" 
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          />
          <Tab 
            icon={<ShippingIcon fontSize="small" />} 
            label="Orders" 
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          />
          <Tab 
            icon={<SettingsIcon fontSize="small" />} 
            label="Settings" 
            sx={{
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          />
        </Tabs>
        </Box>

        {/* Products Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Product Management
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/seller/products/add')}
              sx={{ borderRadius: 0 }}
            >
              Add New Product
            </Button>
          </Box>
          
          {/* Product Filters and Search */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    sx: { borderRadius: 0 }
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    label="Filter"
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="all">All Products</MenuItem>
                    <MenuItem value="active">In Stock</MenuItem>
                    <MenuItem value="outOfStock">Out of Stock</MenuItem>
                    <MenuItem value="lowStock">Low Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={productSort}
                    onChange={(e) => setProductSort(e.target.value)}
                    label="Sort By"
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                    <MenuItem value="priceAsc">Price: Low to High</MenuItem>
                    <MenuItem value="priceDesc">Price: High to Low</MenuItem>
                    <MenuItem value="nameAsc">Name: A to Z</MenuItem>
                    <MenuItem value="nameDesc">Name: Z to A</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  sx={{ borderRadius: 0 }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {products.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body1" paragraph>
                You haven't added any products yet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/seller/products/add')}
                sx={{ borderRadius: 0 }}
              >
                Add Your First Product
              </Button>
            </Paper>
          ) : (
            <>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {/* Mobile Product Cards */}
                {products.slice(productPage * productsPerPage, productPage * productsPerPage + productsPerPage).map((product) => (
                  <Paper 
                    key={product.id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 0, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <Box 
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          flexShrink: 0, 
                          mr: 2, 
                          borderRadius: 0,
                          overflow: 'hidden',
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                        }}
                      >
                        <img 
                          src={product.imageUrl || 'https://via.placeholder.com/50?text=No+Image'} 
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.9rem' }}>
                          {product.name}
                        </Typography>
                        <Chip 
                          label={product.category || 'Uncategorized'} 
                          size="small" 
                          sx={{ borderRadius: 0, height: 20, fontSize: '0.65rem', mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Price</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                          ${product.price.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Stock</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', textAlign: 'center' }}>
                          {product.inventory || 0}
                        </Typography>
                      </Box>
                      <Chip 
                        label={product.status || 'Active'} 
                        color={product.status === 'Draft' ? 'default' : 'success'}
                        size="small"
                        sx={{ borderRadius: 0, fontSize: '0.7rem' }}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      mt: 1, 
                      pt: 1, 
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<VisibilityIcon fontSize="small" />}
                        sx={{ mr: 1, fontSize: '0.7rem', borderRadius: 0 }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                        sx={{ mr: 1, fontSize: '0.7rem', borderRadius: 0 }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={() => handleDeleteClick(product)}
                        sx={{ fontSize: '0.7rem', borderRadius: 0 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>

              <TableContainer component={Paper} sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: { xs: 'none', md: 'block' } }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Category</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Stock</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map(product => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 50, 
                                height: 50, 
                                flexShrink: 0, 
                                mr: 2, 
                                borderRadius: 0,
                                overflow: 'hidden',
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                              }}
                            >
                              <img 
                                src={product.imageUrl || 'https://via.placeholder.com/50?text=No+Image'} 
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {product.id.substring(0, 8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={product.category || 'Uncategorized'} 
                            size="small" 
                            sx={{ borderRadius: 0 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              ${product.price.toFixed(2)}
                            </Typography>
                            {product.discountPrice && (
                              <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                ${product.originalPrice?.toFixed(2)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            color={
                              !product.inStock ? 'error.main' :
                              (product.stockQuantity && product.stockQuantity < 5) ? 'warning.main' : 
                              'text.primary'
                            }
                          >
                            {product.stockQuantity || (product.inStock ? 'In Stock' : 'Out of Stock')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={product.inStock ? 'Active' : 'Inactive'} 
                            color={product.inStock ? 'success' : 'error'} 
                            size="small"
                            sx={{ borderRadius: 0 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                              sx={{ borderRadius: 0 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(product)}
                              sx={{ borderRadius: 0 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="default"
                              sx={{ borderRadius: 0 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={products.length}
                page={productPage}
                onPageChange={(e, newPage) => setProductPage(newPage)}
                rowsPerPage={productsPerPage}
                onRowsPerPageChange={(e) => {
                  setProductsPerPage(parseInt(e.target.value, 10));
                  setProductPage(0);
                }}
                sx={{ borderRadius: 0 }}
              />
              
              {/* Product Management Tips */}
              <Paper sx={{ p: 2, mt: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="subtitle2" gutterBottom>
                  Product Management Tips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Add high-quality images from multiple angles to showcase your products<br />
                  • Use clear, descriptive titles that include keywords customers might search for<br />
                  • Keep your inventory updated to avoid disappointing customers<br />
                  • Consider offering discounts or promotions to boost sales
                </Typography>
              </Paper>
            </>
          )}
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Manage Orders
            </Typography>
            <Box>
              <Button 
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={async () => {
                  try {
                    setRefreshing(true);
                    const sellerOrders = await getSellerOrders(currentUser.uid);
                    setOrders(sellerOrders);
                    setSnackbarMessage('Orders refreshed successfully');
                    setSnackbarOpen(true);
                  } catch (err) {
                    console.error("Error refreshing orders:", err);
                    setError('Failed to refresh orders');
                  } finally {
                    setRefreshing(false);
                  }
                }}
                disabled={refreshing}
                sx={{ mr: 1, borderRadius: 0 }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
              {error}
            </Alert>
          )}
          
          {/* Order Status Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'all' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('all')}
              >
                <Typography variant="h5" color="text.primary">
                  {orders.length}
                </Typography>
                <Typography variant="body2">All Orders</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'pending' ? alpha(theme.palette.warning.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('pending')}
              >
                <Typography variant="h5" color="warning.main">
                  {orders.filter(order => order.status === 'pending').length}
                </Typography>
                <Typography variant="body2">Pending</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'confirmed' ? alpha(theme.palette.info.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('confirmed')}
              >
                <Typography variant="h5" color="info.main">
                  {orders.filter(order => order.status === 'confirmed').length}
                </Typography>
                <Typography variant="body2">Confirmed</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'shipped' ? alpha(theme.palette.primary.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('shipped')}
              >
                <Typography variant="h5" color="primary.main">
                  {orders.filter(order => order.status === 'shipped').length}
                </Typography>
                <Typography variant="body2">Shipped</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'delivered' ? alpha(theme.palette.secondary.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('delivered')}
              >
                <Typography variant="h5" color="secondary.main">
                  {orders.filter(order => order.status === 'delivered').length}
                </Typography>
                <Typography variant="body2">Delivered</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4} sm={2}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  cursor: 'pointer',
                  bgcolor: orderFilter === 'completed' ? alpha(theme.palette.success.main, 0.1) : 'transparent'
                }}
                onClick={() => setOrderFilter('completed')}
              >
                <Typography variant="h5" color="success.main">
                  {orders.filter(order => order.status === 'completed').length}
                </Typography>
                <Typography variant="body2">Completed</Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Order Search and Filters */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { borderRadius: 0 }
              }}
              sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 300 } }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={orderSort}
                label="Sort By"
                onChange={(e) => setOrderSort(e.target.value)}
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="highest">Highest Amount</MenuItem>
                <MenuItem value="lowest">Lowest Amount</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Orders Table */}
          {orders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body1">
                You don't have any orders yet.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2, borderRadius: 0 }}
                onClick={() => navigate('/seller/products/new')}
              >
                Add Your First Product
              </Button>
            </Paper>
          ) : (
            <>
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  {/* Mobile Order Cards */}
                  {orders.slice(orderPage * ordersPerPage, orderPage * ordersPerPage + ordersPerPage).map((order) => (
                    <Paper 
                      key={order.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderRadius: 0, 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          #{order.id.substring(0, 8)}
                        </Typography>
                        <Chip
                          label={order.status.toUpperCase()}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ borderRadius: 0, fontSize: '0.7rem' }}
                        />
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Date</Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{formatDate(order.createdAt)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Total</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                            {formatCurrency(order.totalAmount || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        mt: 1, 
                        pt: 1, 
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => navigate(`/seller/orders/${order.id}`)}
                          sx={{ mr: 1, fontSize: '0.7rem', borderRadius: 0 }}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => handleOpenStatusDialog(order, order.status)}
                          disabled={order.status === 'completed' || order.status === 'cancelled'}
                          sx={{ fontSize: '0.7rem', borderRadius: 0 }}
                        >
                          Update
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: { xs: 'none', md: 'block' } }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.slice(orderPage * ordersPerPage, orderPage * ordersPerPage + ordersPerPage).map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            #{order.id.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.buyerName || 'Customer'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {formatCurrency(order.totalAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status.toUpperCase()}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ borderRadius: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => navigate(`/seller/orders/${order.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleOpenStatusDialog(order, order.status)}
                              disabled={order.status === 'completed' || order.status === 'cancelled'}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={orders.length}
                page={orderPage}
                onPageChange={(e, newPage) => setOrderPage(newPage)}
                rowsPerPage={ordersPerPage}
                onRowsPerPageChange={(e) => {
                  setOrdersPerPage(parseInt(e.target.value, 10));
                  setOrderPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{ borderRadius: 0 }}
              />
            </>
          )}
        </TabPanel>

        {/* Messages Tab Removed */}
        
        {/* Shop Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Shop Settings
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveShopSettings}
              disabled={shopSettingsLoading}
              sx={{ borderRadius: 0 }}
            >
              Save Changes
            </Button>
          </Box>
          
          {shopSettingsError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
              {shopSettingsError}
            </Alert>
          )}
          
          {shopSettingsSuccess && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 0 }}>
              Shop settings saved successfully!
            </Alert>
          )}
          
          <Paper sx={{ p: 3, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Shop Name"
                  fullWidth
                  value={shopSettings.name}
                  onChange={(e) => setShopSettings({...shopSettings, name: e.target.value})}
                  helperText="This is how your shop will appear to customers"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Shop URL"
                  fullWidth
                  value={shopSettings.url}
                  onChange={(e) => setShopSettings({...shopSettings, url: e.target.value})}
                  helperText="Custom URL for your shop (letters, numbers, and hyphens only)"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start">DireMart.com/shop/</InputAdornment>,
                    sx: { borderRadius: 0 } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Shop Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={shopSettings.description}
                  onChange={(e) => setShopSettings({...shopSettings, description: e.target.value})}
                  helperText="Tell customers about your shop and what you sell"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email Address"
                  fullWidth
                  type="email"
                  value={shopSettings.email}
                  onChange={(e) => setShopSettings({...shopSettings, email: e.target.value})}
                  helperText="Email for customer inquiries (can be different from your account email)"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={shopSettings.phone}
                  onChange={(e) => setShopSettings({...shopSettings, phone: e.target.value})}
                  helperText="Phone number for customer inquiries"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
              Payment Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={shopSettings.paymentMethod}
                    onChange={(e) => setShopSettings({...shopSettings, paymentMethod: e.target.value})}
                    label="Payment Method"
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                  </Select>
                  <FormHelperText>How you want to receive payments from DireMart</FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Name"
                  fullWidth
                  value={shopSettings.accountName}
                  onChange={(e) => setShopSettings({...shopSettings, accountName: e.target.value})}
                  helperText="Name on your payment account"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
              
              {shopSettings.paymentMethod === 'bank_transfer' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Bank Name"
                      fullWidth
                      value={shopSettings.bankName}
                      onChange={(e) => setShopSettings({...shopSettings, bankName: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 0 } }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Account Number"
                      fullWidth
                      value={shopSettings.accountNumber}
                      onChange={(e) => setShopSettings({...shopSettings, accountNumber: e.target.value})}
                      margin="normal"
                      variant="outlined"
                      InputProps={{ sx: { borderRadius: 0 } }}
                    />
                  </Grid>
                </>
              )}
              
              {shopSettings.paymentMethod === 'mobile_money' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Mobile Money Number"
                    fullWidth
                    value={shopSettings.mobileNumber}
                    onChange={(e) => setShopSettings({...shopSettings, mobileNumber: e.target.value})}
                    margin="normal"
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 0 } }}
                  />
                </Grid>
              )}
              
              {shopSettings.paymentMethod === 'paypal' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="PayPal Email"
                    fullWidth
                    type="email"
                    value={shopSettings.paypalEmail}
                    onChange={(e) => setShopSettings({...shopSettings, paypalEmail: e.target.value})}
                    margin="normal"
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 0 } }}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
              Shop Policies
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Return Policy"
                  fullWidth
                  multiline
                  rows={3}
                  value={shopSettings.returnPolicy}
                  onChange={(e) => setShopSettings({...shopSettings, returnPolicy: e.target.value})}
                  helperText="Describe your return and refund policy"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Shipping Policy"
                  fullWidth
                  multiline
                  rows={3}
                  value={shopSettings.shippingPolicy}
                  onChange={(e) => setShopSettings({...shopSettings, shippingPolicy: e.target.value})}
                  helperText="Describe your shipping methods, timeframes, and costs"
                  margin="normal"
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveShopSettings}
              disabled={shopSettingsLoading}
              sx={{ borderRadius: 0 }}
            >
              {shopSettingsLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>
        
        {/* Order Status Update Dialog */}
        <Dialog 
          open={statusDialogOpen} 
          onClose={() => setStatusDialogOpen(false)}
          PaperProps={{ sx: { borderRadius: 0 } }}
        >
          <DialogTitle>
            Update Order Status
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Update the status for order #{selectedOrder?.id?.substring(0, 8)}
            </DialogContentText>
            
            {buyerInfoLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : buyerInfo ? (
              <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Buyer Information
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Name:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{buyerInfo.name}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{buyerInfo.email}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">{buyerInfo.phone}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Address:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {buyerInfo.address?.street}, {buyerInfo.address?.city}, {buyerInfo.address?.state} {buyerInfo.address?.zip}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ) : null}
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
              </Select>
            </FormControl>
            
            {statusUpdateError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 0 }}>
                {statusUpdateError}
              </Alert>
            )}
            
            {statusUpdateSuccess && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 0 }}>
                Order status updated successfully!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setStatusDialogOpen(false)}
              sx={{ borderRadius: 0 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateOrderStatus} 
              variant="contained" 
              color="primary"
              disabled={statusUpdateLoading || !newStatus}
              sx={{ borderRadius: 0 }}
            >
              {statusUpdateLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Product Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleDeleteCancel} 
              color="inherit"
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error"
              variant="contained"
              disabled={deleteLoading}
              sx={{ borderRadius: 0 }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Container>
    );
  };

export default SellerDashboard;
