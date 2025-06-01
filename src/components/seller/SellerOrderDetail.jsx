import { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  TextField
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

// Get status color based on order status
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'confirmed':
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'info';
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

// Get available status options based on current status
const getAvailableStatusOptions = (currentStatus) => {
  // Handle null or undefined status
  if (!currentStatus) return [];
  
  switch (currentStatus) {
    case 'pending':
      return ['confirmed', 'cancelled'];
    case 'confirmed':
      return ['shipped', 'cancelled'];
    case 'shipped':
      return ['delivered', 'cancelled'];
    case 'delivered':
      // Seller can't update after delivery - buyer must confirm
      return [];
    case 'completed':
      // No more updates allowed after completion
      return [];
    case 'cancelled':
      // No more updates allowed after cancellation
      return [];
    default:
      return ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  }
};

const SellerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [buyerInfoLoading, setBuyerInfoLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationReasonError, setCancellationReasonError] = useState('');
  
  // Define order status steps for the stepper
  const orderSteps = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];
  
  const fetchOrderDetails = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Use the order ID from the URL parameter
      console.log(`Fetching order details for ID: ${id}`);
      const orderData = await getSellerOrderById(id);
      
      // Check if this order belongs to the current seller
      if (orderData.sellerId !== currentUser.uid) {
        console.error('Permission denied: This order does not belong to the current seller');
        setError('You do not have permission to view this order.');
        setLoading(false);
        return;
      }
      
      setOrder(orderData);
      console.log("Loaded order:", orderData);
      
      // Fetch buyer information
      try {
        setBuyerInfoLoading(true);
        const info = await getBuyerInfoForOrder(id);
        setBuyerInfo(info);
        console.log("Loaded buyer info:", info);
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
    // Include id in dependencies to refetch when the URL parameter changes
  }, [currentUser, id]);
  
  // Console log the data we have for debugging
  useEffect(() => {
    if (order) {
      console.log("Current order data:", order);
      console.log("Shipping address:", order.shippingAddress);
    }
    if (buyerInfo) {
      console.log("Current buyer info:", buyerInfo);
    }
  }, [order, buyerInfo]);
  
  useEffect(() => {
    // Update selectedStatus when order changes and is not null
    if (order) {
      setSelectedStatus(order.status || 'pending');
    }
  }, [order]);
  
  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    // Reset cancellation reason when status is not cancelled
    if (event.target.value !== 'cancelled') {
      setCancellationReason('');
      setCancellationReasonError('');
    }
  };
  
  const handleOpenConfirmDialog = () => {
    // Validate cancellation reason if status is cancelled
    if (selectedStatus === 'cancelled' && !cancellationReason.trim()) {
      setCancellationReasonError('Please provide a reason for cancellation');
      return;
    }
    
    setOpenConfirmDialog(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };
  
  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      
      // Update the order status
      await updateSellerOrderStatus(id, selectedStatus, cancellationReason);
      
      // Update local state to reflect the change
      setOrder(prevOrder => ({
        ...prevOrder,
        status: selectedStatus,
        ...(selectedStatus === 'cancelled' ? { cancellationReason } : {})
      }));
      
      setOpenConfirmDialog(false);
      setCancellationReason('');
      
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
  
  // Check if the order status can be updated
  const canUpdateStatus = useMemo(() => {
    // Return false if order is null or undefined
    if (!order) return false;
    
    // Can't update if order is completed, delivered or cancelled
    if (order.status === 'completed' || order.status === 'delivered' || order.status === 'cancelled') {
      return false;
    }
    return true;
  }, [order]);
  
  // Check if buyer info is available
  const hasBuyerInfo = useMemo(() => {
    return buyerInfo && Object.keys(buyerInfo).length > 0;
  }, [buyerInfo]);
  
  // Check if shipping address is available
  const hasShippingAddress = useMemo(() => {
    return (buyerInfo && buyerInfo.shippingAddress && typeof buyerInfo.shippingAddress === 'object') ||
           (order && order.shippingAddress && typeof order.shippingAddress === 'object');
  }, [buyerInfo, order]);
  
  // Format Ethiopian address for display
  const formatEthiopianAddress = (address) => {
    if (!address) return {};
    
    return {
      name: address.fullName || address.name,
      email: address.email,
      phone: address.phoneNumber || address.phone,
      address: address.address,
      city: address.city,
      subCity: address.subCity,
      kebele: address.kebele,
      woreda: address.woreda,
      instructions: address.deliveryInstructions
    };
  };
  
  // Get the best shipping address (either from buyerInfo or order)
  const getShippingAddress = () => {
    if (buyerInfo && buyerInfo.shippingAddress) {
      return formatEthiopianAddress(buyerInfo.shippingAddress);
    } else if (order && order.shippingAddress) {
      return formatEthiopianAddress(order.shippingAddress);
    }
    return {};
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
  
  // Get available status options based on current status
  const availableStatusOptions = getAvailableStatusOptions(order.status);
  
  // Calculate order total from items in case total is missing
  const calculateOrderTotal = () => {
    if (!order || !order.items || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.reduce((total, item) => {
      const itemPrice = Number(item.price) || 0;
      const itemQuantity = Number(item.quantity) || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };
  
  return (
    <Container maxWidth="md" sx={{ pt: { xs: 0.5, md: 4 }, pb: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
        <OrderIcon sx={{ fontSize: { xs: 24, md: 32 }, mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h1" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Order Details
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 1.5, md: 3 } }}>
        <Button
          component={Link}
          to="/seller/dashboard"
          startIcon={<BackIcon />}
          variant="outlined"
          size="small"
          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 0.5, md: 0.75 } }}
        >
          Back to Dashboard
        </Button>
        
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={refreshOrder}
          size="small"
          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' }, py: { xs: 0.5, md: 0.75 } }}
        >
          Refresh
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3, overflowX: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Chip 
            label={order.status.toUpperCase()} 
            color={getStatusColor(order.status)}
            size="small"
            sx={{ 
              fontWeight: 'medium',
              fontSize: { xs: '0.7rem', md: '0.8125rem' },
              height: { xs: 24, md: 32 }
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
        >
          Placed on {formatDate(order.createdAt)}
        </Typography>
        
        {order.mainOrderId && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            Main Order: #{order.mainOrderId.substring(0, 8)}
          </Typography>
        )}
        
        <Divider sx={{ my: { xs: 1, md: 2 } }} />
        
        <Box sx={{ width: '100%', mb: 3, overflowX: 'hidden' }}>
          <Stepper 
            activeStep={currentStepIndex} 
            alternativeLabel
            sx={{ 
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: 20, sm: 24, md: 28 }
              },
              '& .MuiStepConnector-line': {
                mx: { xs: -1, md: 0 }
              }
            }}
          >
            {orderSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label.charAt(0).toUpperCase() + label.slice(1)}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PersonIcon sx={{ mr: 0.5, fontSize: { xs: 18, md: 24 }, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Customer Information</Typography>
            </Box>
            
            {buyerInfoLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading buyer information...</Typography>
              </Box>
            ) : buyerInfo ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Name:</strong> {buyerInfo.name || order.shippingAddress?.fullName || 'Not available'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Email:</strong> {buyerInfo.email || 'Not available'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  <strong>Phone:</strong> {buyerInfo.phone || order.shippingAddress?.phoneNumber || 'Not available'}
                </Typography>
              </Box>
            ) : order.shippingAddress ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Name:</strong> {order.shippingAddress.fullName || 'Not available'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Email:</strong> {'Not available'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Phone:</strong> {order.shippingAddress.phoneNumber || 'Not available'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Buyer information not available
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AddressIcon sx={{ mr: 0.5, fontSize: { xs: 18, md: 24 }, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}>Shipping Address</Typography>
            </Box>
            
            {order.shippingAddress ? (
              <Box sx={{ mb: 2 }}>
                {order.shippingAddress.address && (
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <strong>Address:</strong> {order.shippingAddress.address}
                  </Typography>
                )}
                {order.shippingAddress.city && (
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <strong>City:</strong> {order.shippingAddress.city}
                  </Typography>
                )}
                {order.shippingAddress.subCity && (
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <strong>Sub-City/District:</strong> {order.shippingAddress.subCity}
                  </Typography>
                )}
                {(order.shippingAddress.kebele || order.shippingAddress.woreda) && (
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {order.shippingAddress.kebele && (
                      <><strong>Kebele:</strong> {order.shippingAddress.kebele}{order.shippingAddress.woreda ? ', ' : ''}</>
                    )}
                    {order.shippingAddress.woreda && (
                      <><strong>Woreda:</strong> {order.shippingAddress.woreda}</>
                    )}
                  </Typography>
                )}
                {order.shippingAddress.deliveryInstructions && (
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word', fontStyle: 'italic', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <strong>Delivery Instructions:</strong> {order.shippingAddress.deliveryInstructions}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Shipping address not available
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3, overflowX: 'hidden' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
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
                  <Typography variant="subtitle1" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                    {item.name}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Quantity: {item.quantity}
                    </Typography>
                    <Box component="div" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block', fontSize: { xs: '0.75rem', md: '0.875rem' }, whiteSpace: 'normal', overflow: 'visible' }}>
                        Price: <strong style={{ color: '#333' }}>{item && item.price ? formatCurrency(item.price) : 'ETB 0.00'}</strong>
                      </Typography>
                    </Box>
                    {item.variant && (
                      <Box component="div" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        {item.variantImage && (
                          <Box sx={{ mr: 1, mb: 0.5 }}>
                            {item.productId ? (
                              <Link to={`/product/${item.productId}`} style={{ textDecoration: 'none' }}>
                                <Avatar 
                                  src={item.variantImage} 
                                  variant="rounded" 
                                  alt={item.variant}
                                  sx={{ width: 30, height: 30, cursor: 'pointer' }}
                                />
                              </Link>
                            ) : (
                              <Avatar 
                                src={item.variantImage} 
                                variant="rounded" 
                                alt={item.variant}
                                sx={{ width: 30, height: 30 }}
                              />
                            )}
                          </Box>
                        )}
                        <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block', wordBreak: 'break-word', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Variant: <strong>{item.variant}</strong>
                        </Typography>
                      </Box>
                    )}
                  </>
                }
                sx={{ mr: 2, width: { xs: '100%', sm: 'auto' } }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.85rem', md: '1rem' }, whiteSpace: 'normal', overflow: 'visible' }}>
                {item && item.price && item.quantity ? formatCurrency(item.price * item.quantity) : 'ETB 0.00'}
              </Typography>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
                Order Total:
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.95rem', md: '1.25rem' }, overflow: 'visible', whiteSpace: 'normal' }}>
                {order && order.total ? formatCurrency(order.total) : formatCurrency(calculateOrderTotal())}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, backgroundColor: '#fff' }}>
        <Typography variant="h6" gutterBottom>
          Update Order Status
        </Typography>
        
        {!canUpdateStatus ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {order.status === 'delivered' ? 
              'This order is marked as delivered. Waiting for buyer confirmation to complete the order.' : 
              order.status === 'cancelled' ?
              'This order has been cancelled and cannot be updated further.' :
              'This order is completed. No further status updates are allowed.'}
          </Alert>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={0} alignItems="flex-start" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3} md={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: '120px' }}>
                  <Select
                    id="order-status"
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    disabled={!canUpdateStatus}
                    displayEmpty
                    variant="outlined"
                    sx={{
                      height: '40px',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    }}
                  >
                    {availableStatusOptions.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={3} sx={{ mt: { xs: 1, sm: 0 }, ml: { xs: 0, sm: 2 } }}>
                <Button
                  variant="contained"
                  onClick={handleOpenConfirmDialog}
                  startIcon={selectedStatus === 'cancelled' ? <CancelIcon /> : <CheckIcon />}
                  disabled={!canUpdateStatus}
                  sx={{
                    backgroundColor: '#f0813a',
                    '&:hover': { backgroundColor: '#e06929' },
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 'medium',
                    height: '40px',
                    boxShadow: 'none',
                    paddingLeft: 2,
                    paddingRight: 2
                  }}
                >
                  Update Status
                </Button>
              </Grid>
            </Grid>
            
            {selectedStatus === 'cancelled' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Cancellation Reason"
                  variant="outlined"
                  value={cancellationReason}
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    if (e.target.value.trim()) {
                      setCancellationReasonError('');
                    }
                  }}
                  error={!!cancellationReasonError}
                  helperText={cancellationReasonError}
                  required
                  placeholder="Please explain why you are cancelling this order"
                  multiline
                  rows={2}
                />
              </Box>
            )}
          </Box>
        )}
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
                This indicates that the customer has received the items. The customer will be notified to confirm delivery.
              </Box>
            )}
            {selectedStatus === 'cancelled' && (
              <Box sx={{ mt: 2, color: 'error.main' }}>
                This will cancel the order. This action cannot be undone.
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Cancellation reason: {cancellationReason}
                </Typography>
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
