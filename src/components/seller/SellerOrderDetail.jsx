import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Tooltip
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Home as AddressIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerOrderById, updateSellerOrderStatus, getBuyerInfoForOrder } from '../../firebase/services';

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
    
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
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
    case 'confirmed':
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'secondary';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Get next status based on current status
const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case 'pending':
      return 'confirmed';
    case 'confirmed':
      return 'shipped';
    case 'shipped':
      return 'delivered';
    case 'delivered':
      return 'completed';
    default:
      return currentStatus;
  }
};

const SellerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [buyerInfoLoading, setBuyerInfoLoading] = useState(false);
  
  // Define order status steps for the stepper
  const orderSteps = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];
  
  const fetchOrderDetails = async () => {
    if (!currentUser || !id) return;
    
    try {
      setLoading(true);
      const orderData = await getSellerOrderById(id);
      
      // Check if this seller owns this order
      if (orderData.sellerId !== currentUser.uid) {
        setError('You do not have permission to view this order');
        setLoading(false);
        return;
      }
      
      setOrder(orderData);
      
      // Set the initial status
      setSelectedStatus(orderData.status || 'pending');
      
      // Fetch buyer information
      try {
        setBuyerInfoLoading(true);
        const info = await getBuyerInfoForOrder(id);
        setBuyerInfo(info);
      } catch (buyerError) {
        console.error('Error fetching buyer info:', buyerError);
        // Don't set an error, just set buyerInfo to null
        setBuyerInfo(null);
      } finally {
        setBuyerInfoLoading(false);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrderDetails();
  }, [id, currentUser]);
  
  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };
  
  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };
  
  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      
      // Update the order status
      await updateSellerOrderStatus(id, selectedStatus);
      
      // Update local state to reflect the change
      setOrder(prevOrder => ({
        ...prevOrder,
        status: selectedStatus
      }));
      
      setOpenConfirmDialog(false);
      
      // Show success message or notification
      // You could add a snackbar or toast notification here
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const refreshOrder = () => {
    fetchOrderDetails();
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading order details...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          to="/seller/dashboard"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Order not found
        </Alert>
        <Button
          component={Link}
          to="/seller/dashboard"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  // Get the current step index for the stepper
  const currentStepIndex = orderSteps.indexOf(order.status);
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <OrderIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Order Details
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          component={Link}
          to="/seller/dashboard"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
        
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={refreshOrder}
        >
          Refresh
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Chip 
            label={order.status.toUpperCase()} 
            color={getStatusColor(order.status)}
            sx={{ fontWeight: 'medium' }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Placed on {formatDate(order.createdAt)}
        </Typography>
        
        {order.mainOrderId && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Main Order: #{order.mainOrderId.substring(0, 8)}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ width: '100%', mb: 3 }}>
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {orderSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label.charAt(0).toUpperCase() + label.slice(1)}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Customer Information</Typography>
            </Box>
            
            {buyerInfoLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading buyer information...</Typography>
              </Box>
            ) : buyerInfo ? (
              <>
                <Typography variant="body2">
                  <strong>Name:</strong> {buyerInfo.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {buyerInfo.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {buyerInfo.phone}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Buyer information not available
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AddressIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Box>
            
            {buyerInfo && buyerInfo.shippingAddress && typeof buyerInfo.shippingAddress === 'object' ? (
              <>
                <Typography variant="body2">
                  {buyerInfo.shippingAddress.street}
                </Typography>
                <Typography variant="body2">
                  {buyerInfo.shippingAddress.city}, {buyerInfo.shippingAddress.state} {buyerInfo.shippingAddress.zip}
                </Typography>
                <Typography variant="body2">
                  {buyerInfo.shippingAddress.country}
                </Typography>
              </>
            ) : order.shippingAddress && typeof order.shippingAddress === 'object' ? (
              <>
                <Typography variant="body2">
                  {order.shippingAddress.street}
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </Typography>
                <Typography variant="body2">
                  {order.shippingAddress.country}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Shipping address not available
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Items in This Order
        </Typography>
        
        <List sx={{ width: '100%' }}>
          {order.items.map((item, index) => (
            <ListItem 
              key={item.productId || index} 
              alignItems="flex-start"
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 2
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  alt={item.name} 
                  src={item.image || item.imageUrl} 
                  variant="rounded"
                  sx={{ width: 60, height: 60, mr: 2 }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1">
                    {item.name}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Quantity: {item.quantity}
                    </Typography>
                    <Box component="div" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Price: {formatCurrency(item.price)}
                      </Typography>
                    </Box>
                    {item.variant && (
                      <Box component="div" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Variant: {item.variant}
                        </Typography>
                      </Box>
                    )}
                  </>
                }
                sx={{ mr: 2 }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(item.price * item.quantity)}
              </Typography>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Order Total:
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(order.total || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Update Order Status
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="order-status-label">Status</InputLabel>
              <Select
                labelId="order-status-label"
                id="order-status"
                value={selectedStatus}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenConfirmDialog}
              startIcon={selectedStatus === 'cancelled' ? <CancelIcon /> : <CheckIcon />}
              fullWidth
            >
              Update Status
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Updating the order status will notify the customer. Make sure you have taken appropriate action before changing the status.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            - <strong>Confirmed</strong>: You've accepted the order and are preparing it
            <br />
            - <strong>Shipped</strong>: You've sent the items to the customer
            <br />
            - <strong>Delivered</strong>: The customer has received the items
            <br />
            - <strong>Completed</strong>: The order is fully processed and payment is released
            <br />
            - <strong>Cancelled</strong>: The order has been cancelled
          </Typography>
        </Box>
      </Paper>
      
      {/* Order History */}
      {order.notifications && order.notifications.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order History
          </Typography>
          
          <List>
            {[...order.notifications].reverse().map((notification, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  borderBottom: index < order.notifications.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  py: 1
                }}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={
                    notification.timestamp ? 
                      formatDate(
                        typeof notification.timestamp === 'string' 
                          ? new Date(notification.timestamp) 
                          : notification.timestamp
                      ) 
                      : 'N/A'
                  }
                />
                <Chip 
                  label={notification.status?.toUpperCase() || 'UPDATE'} 
                  color={getStatusColor(notification.status)}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Status Update
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to change the status of this order to <strong>{selectedStatus}</strong>?
            {selectedStatus === 'confirmed' && (
              <Box sx={{ mt: 2 }}>
                This confirms that you've accepted the order and are preparing the items.
              </Box>
            )}
            {selectedStatus === 'shipped' && (
              <Box sx={{ mt: 2 }}>
                This will indicate that you have shipped the items to the customer.
              </Box>
            )}
            {selectedStatus === 'delivered' && (
              <Box sx={{ mt: 2 }}>
                This indicates that the customer has received the items.
              </Box>
            )}
            {selectedStatus === 'completed' && (
              <Box sx={{ mt: 2 }}>
                This will mark the order as completed and indicate that the customer has received the items.
              </Box>
            )}
            {selectedStatus === 'cancelled' && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                This will cancel the order. This action cannot be undone.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            color={selectedStatus === 'cancelled' ? 'error' : 'primary'} 
            variant="contained"
            disabled={updating}
            autoFocus
          >
            {updating ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerOrderDetail;
