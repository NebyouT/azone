import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Grid,
  Stack
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DeleteOutline as DeleteIcon,
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders, getHiddenOrders, hideOrderFromView, restoreHiddenOrder } from '../../firebase/services';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
};

// Helper function to format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = timestamp instanceof Date 
    ? timestamp 
    : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'cancelled':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon />;
    case 'processing':
      return <AutorenewIcon />;
    case 'shipped':
      return <ShippingIcon />;
    case 'cancelled':
      return <CancelIcon />;
    case 'pending':
      return <HourglassEmptyIcon />;
    default:
      return <OrderIcon />;
  }
};

// Calculate the overall status of an order based on item statuses
const calculateOrderStatus = (order) => {
  if (!order || !order.items || order.items.length === 0) {
    return order?.status || 'pending';
  }
  
  // If the order has an explicit status, use it
  if (order.status) {
    return order.status;
  }
  
  // Otherwise, calculate based on item statuses
  const statuses = order.items.map(item => item.status || 'pending');
  
  if (statuses.every(status => status === 'cancelled')) {
    return 'cancelled';
  }
  
  if (statuses.every(status => status === 'completed')) {
    return 'completed';
  }
  
  if (statuses.some(status => status === 'shipped')) {
    return 'shipped';
  }
  
  if (statuses.some(status => status === 'processing')) {
    return 'processing';
  }
  
  return 'pending';
};

// Get a human-readable status description
const getStatusDescription = (order) => {
  const status = calculateOrderStatus(order);
  
  switch (status) {
    case 'completed':
      return 'Your order has been delivered and completed.';
    case 'processing':
      return 'Your order is being processed by the seller.';
    case 'shipped':
      return 'Your order has been shipped and is on its way.';
    case 'cancelled':
      return 'This order has been cancelled.';
    case 'pending':
      return 'Your order is pending processing by the seller.';
    default:
      return 'Status information not available.';
  }
};

const Orders = () => {
  const { currentUser } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [hiddenOrders, setHiddenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHidden, setLoadingHidden] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Add theme and responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const fetchActiveOrders = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      try {
        // Try to get orders with the includeHidden parameter
        const userOrders = await getUserOrders(currentUser.uid, false);
        setActiveOrders(userOrders);
      } catch (err) {
        // If we get an index error, fall back to getting all orders and filtering client-side
        if (err.message && err.message.includes('index')) {
          console.warn('Index error occurred, using fallback approach:', err.message);
          
          // Get all orders without filtering by isHidden
          const allOrders = await getUserOrders(currentUser.uid, true);
          
          // Filter out hidden orders on the client side
          const visibleOrders = allOrders.filter(order => !order.isHidden);
          setActiveOrders(visibleOrders);
          
          // Display a message about creating the index
          console.info(
            'Please create the required Firestore index using this link:',
            err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0] || 
            'https://console.firebase.google.com'
          );
        } else {
          // If it's not an index error, rethrow
          throw err;
        }
      }
    } catch (err) {
      console.error('Error fetching active orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHiddenOrders = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingHidden(true);
      try {
        // Try to get hidden orders
        const userHiddenOrders = await getHiddenOrders(currentUser.uid);
        setHiddenOrders(userHiddenOrders);
      } catch (err) {
        // If we get an index error, fall back to getting all orders and filtering client-side
        if (err.message && err.message.includes('index')) {
          console.warn('Index error occurred for hidden orders, using fallback approach:', err.message);
          
          // Get all orders and filter for hidden ones on the client side
          const allOrders = await getUserOrders(currentUser.uid, true);
          const hiddenOrdersFiltered = allOrders.filter(order => order.isHidden === true);
          setHiddenOrders(hiddenOrdersFiltered);
          
          // Display a message about creating the index
          console.info(
            'Please create the required Firestore index using this link:',
            err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0] || 
            'https://console.firebase.google.com'
          );
        } else {
          // If it's not an index error, log it but don't rethrow
          console.error('Error fetching hidden orders:', err);
          setHiddenOrders([]);
        }
      }
    } catch (err) {
      console.error('Error in fetchHiddenOrders:', err);
      // Don't set the main error state for hidden orders to avoid confusion
      setHiddenOrders([]);
    } finally {
      setLoadingHidden(false);
    }
  };
  
  useEffect(() => {
    fetchActiveOrders();
    fetchHiddenOrders();
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleHideOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setHideDialogOpen(true);
  };
  
  const handleRestoreOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setRestoreDialogOpen(true);
  };
  
  const confirmHideOrder = async () => {
    try {
      setActionLoading(true);
      await hideOrderFromView(selectedOrderId, currentUser.uid);
      
      // Update the local state
      const orderToHide = activeOrders.find(order => order.id === selectedOrderId);
      if (orderToHide) {
        setActiveOrders(prev => prev.filter(order => order.id !== selectedOrderId));
        setHiddenOrders(prev => [...prev, {...orderToHide, isHidden: true}]);
      }
      
      setSnackbarMessage('Order has been hidden from your active orders');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error hiding order:', err);
      setSnackbarMessage('Failed to hide order: ' + err.message);
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
      setHideDialogOpen(false);
      setSelectedOrderId(null);
    }
  };
  
  const confirmRestoreOrder = async () => {
    try {
      setActionLoading(true);
      await restoreHiddenOrder(selectedOrderId, currentUser.uid);
      
      // Update the local state
      const orderToRestore = hiddenOrders.find(order => order.id === selectedOrderId);
      if (orderToRestore) {
        setHiddenOrders(prev => prev.filter(order => order.id !== selectedOrderId));
        setActiveOrders(prev => [...prev, {...orderToRestore, isHidden: false}]);
      }
      
      setSnackbarMessage('Order has been restored to your active orders');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error restoring order:', err);
      setSnackbarMessage('Failed to restore order: ' + err.message);
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
      setRestoreDialogOpen(false);
      setSelectedOrderId(null);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <OrderIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          My Orders
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="order tabs"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon sx={{ mr: 1 }} />
                <span>Active Orders</span>
              </Box>
            } 
            id="orders-tab-0"
            aria-controls="orders-tabpanel-0"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityOffIcon sx={{ mr: 1 }} />
                <span>Hidden Orders</span>
              </Box>
            } 
            id="orders-tab-1"
            aria-controls="orders-tabpanel-1"
          />
        </Tabs>
      </Box>
      
      <div
        role="tabpanel"
        hidden={activeTab !== 0}
        id="orders-tabpanel-0"
        aria-labelledby="orders-tab-0"
      >
        {activeTab === 0 && (
          <>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : activeOrders.length === 0 ? (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No orders found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't placed any orders yet.
                </Typography>
                <Button 
                  component={Link} 
                  to="/products" 
                  variant="contained" 
                  color="primary"
                >
                  Browse Products
                </Button>
              </Paper>
            ) : !isMobile ? (
              // Desktop/Web Version - Table Layout
              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link to={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                            <Typography color="primary" sx={{ fontWeight: 'medium' }}>
                              #{order.id.substring(0, 8)}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>{formatCurrency(order.total || 0)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(calculateOrderStatus(order))}
                            label={calculateOrderStatus(order).charAt(0).toUpperCase() + calculateOrderStatus(order).slice(1)}
                            color={getStatusColor(calculateOrderStatus(order))}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <Button
                              component={Link}
                              to={`/orders/${order.id}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            >
                              View
                            </Button>
                            
                            {calculateOrderStatus(order) === 'cancelled' && (
                              <Tooltip title="Hide this cancelled order">
                                <IconButton 
                                  size="small" 
                                  color="default"
                                  onClick={() => handleHideOrder(order.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Mobile Version - Card Layout
              <Grid container spacing={2} sx={{ width: '100%', mx: 0 }}>
                {activeOrders.map((order) => (
                  <Grid item xs={12} key={order.id} sx={{ width: '100%' }}>
                    <Card elevation={2} sx={{ width: '100%' }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography color="primary" sx={{ fontWeight: 'medium' }}>
                            #{order.id.substring(0, 8)}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(calculateOrderStatus(order))}
                            label={calculateOrderStatus(order).charAt(0).toUpperCase() + calculateOrderStatus(order).slice(1)}
                            color={getStatusColor(calculateOrderStatus(order))}
                            size="small"
                          />
                        </Box>
                        
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(order.total || 0)}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Items:
                          </Typography>
                          <Typography variant="body2">
                            {order.items?.length || 0}
                          </Typography>
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                        <Button
                          component={Link}
                          to={`/orders/${order.id}`}
                          size="small"
                          variant="contained"
                          color="primary"
                          fullWidth
                        >
                          View Order
                        </Button>
                        
                        {calculateOrderStatus(order) === 'cancelled' && (
                          <IconButton 
                            size="small" 
                            color="default"
                            onClick={() => handleHideOrder(order.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </div>
      
      <div
        role="tabpanel"
        hidden={activeTab !== 1}
        id="orders-tabpanel-1"
        aria-labelledby="orders-tab-1"
      >
        {activeTab === 1 && (
          <>
            {loadingHidden ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : hiddenOrders.length === 0 ? (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No hidden orders
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You don't have any hidden orders.
                </Typography>
              </Paper>
            ) : !isMobile ? (
              // Desktop/Web Version - Table Layout
              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Hidden On</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hiddenOrders.map((order) => (
                      <TableRow key={order.id} sx={{ opacity: 0.7 }}>
                        <TableCell>
                          <Typography color="text.secondary">
                            #{order.id.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>{formatCurrency(order.total || 0)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(calculateOrderStatus(order))}
                            label={calculateOrderStatus(order).charAt(0).toUpperCase() + calculateOrderStatus(order).slice(1)}
                            color={getStatusColor(calculateOrderStatus(order))}
                            size="small"
                            sx={{ opacity: 0.8 }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(order.hiddenAt)}</TableCell>
                        <TableCell>
                          <Tooltip title="Restore this order to active orders">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleRestoreOrder(order.id)}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Mobile Version - Card Layout
              <Grid container spacing={2} sx={{ width: '100%', mx: 0 }}>
                {hiddenOrders.map((order) => (
                  <Grid item xs={12} key={order.id} sx={{ width: '100%' }}>
                    <Card elevation={2} sx={{ opacity: 0.7, width: '100%' }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography color="text.secondary">
                            #{order.id.substring(0, 8)}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(calculateOrderStatus(order))}
                            label={calculateOrderStatus(order).charAt(0).toUpperCase() + calculateOrderStatus(order).slice(1)}
                            color={getStatusColor(calculateOrderStatus(order))}
                            size="small"
                            sx={{ opacity: 0.8 }}
                          />
                        </Box>
                        
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total:
                          </Typography>
                          <Typography variant="body2">
                            {formatCurrency(order.total || 0)}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Hidden on:
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(order.hiddenAt).split(',')[0]}
                          </Typography>
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                        <Button
                          startIcon={<RestoreIcon />}
                          size="small"
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handleRestoreOrder(order.id)}
                        >
                          Restore Order
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </div>
      
      {/* Hide Order Dialog */}
      <Dialog
        open={hideDialogOpen}
        onClose={() => setHideDialogOpen(false)}
      >
        <DialogTitle>Hide Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to hide this order? It will be moved to your hidden orders tab.
            You can restore it later if needed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setHideDialogOpen(false)} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmHideOrder} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Hide Order'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Restore Order Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Restore Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore this order? It will be moved back to your active orders tab.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRestoreDialogOpen(false)} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRestoreOrder} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Restore Order'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default Orders;
