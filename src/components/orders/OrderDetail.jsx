import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  Rating,
  TextField,
  IconButton
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  LocalShipping,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  RateReview as RateReviewIcon,
  Star as StarIcon,
  PhotoCamera as PhotoCameraIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getOrderById, 
  cancelOrder,
  updateOrderStatus,
  confirmOrderDelivery,
  denyOrderDelivery,
  getBuyerInfoForOrder
} from '../../firebase/services';
import { getTransactionHistory } from '../../firebase/walletServices';
import { addReview, getEligibleOrdersForReview } from '../../firebase/reviewServices';

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
    case 'pending':
    default:
      return 'default';
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon />;
    case 'confirmed':
    case 'processing':
      return <AutorenewIcon />;
    case 'shipped':
      return <ShippingIcon />;
    case 'delivered':
      return <LocalShipping />;
    case 'cancelled':
      return <CancelIcon />;
    case 'pending':
    default:
      return <HourglassEmptyIcon />;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [buyerInfoLoading, setBuyerInfoLoading] = useState(false);
  
  // Review state
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);
  
  // Define order status steps for the stepper
  const orderSteps = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];
  
  const fetchOrderDetails = async () => {
    if (!currentUser || !id) return;
    
    try {
      setLoading(true);
      const orderData = await getOrderById(id);
      
      // Verify this order belongs to the current user
      if (orderData.userId !== currentUser.uid) {
        setError('You do not have permission to view this order');
        setLoading(false);
        return;
      }
      
      setOrder(orderData);
      
      // Fetch related transactions
      try {
        const transactionHistory = await getTransactionHistory(currentUser.uid);
        // Filter transactions related to this order
        const orderTransactions = transactionHistory.filter(
          transaction => transaction.orderId === id
        );
        setTransactions(orderTransactions);
      } catch (transError) {
        console.error('Error fetching transaction history:', transError);
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
  
  // Fetch buyer information when order details are loaded
  useEffect(() => {
    if (order && order.id) {
      fetchBuyerInfo();
    }
  }, [order?.id]);
  
  // Function to fetch buyer information from database
  const fetchBuyerInfo = async () => {
    if (!order || !order.id) return;
    
    try {
      setBuyerInfoLoading(true);
      const info = await getBuyerInfoForOrder(order.id);
      setBuyerInfo(info);
    } catch (err) {
      console.error('Error fetching buyer information:', err);
      // Don't set error state here to avoid showing error alert to user
      // Just log error and continue with available info
    } finally {
      setBuyerInfoLoading(false);
    }
  };
  
  // Check for reviewable products when order is loaded
  useEffect(() => {
    if (order && (order.status === 'completed' || order.status === 'delivered')) {
      checkReviewableProducts();
    }
  }, [order]);
  
  // Force refresh of reviewable products when status changes to completed
  useEffect(() => {
    const isCompleted = order?.status === 'completed';
    const isDelivered = order?.status === 'delivered';
    
    if ((isCompleted || isDelivered) && reviewableProducts.length === 0) {
      // Add a small delay to ensure Firebase has updated
      const timer = setTimeout(() => {
        checkReviewableProducts();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [order?.status, reviewableProducts.length]);
  
  // Function to check which products can be reviewed
  const checkReviewableProducts = async () => {
    if (!order || !currentUser) return;
    
    try {
      console.log('Checking reviewable products for order:', id);
      const eligibleOrders = await getEligibleOrdersForReview(currentUser.uid);
      console.log('Eligible orders for review:', eligibleOrders);
      
      const currentOrderEligible = eligibleOrders.find(o => o.id === id);
      
      if (currentOrderEligible) {
        console.log('Current order is eligible for review with products:', currentOrderEligible.products);
        setReviewableProducts(currentOrderEligible.products);
      } else if (order.status === 'completed') {
        // If order is completed but not in eligible orders, use items from current order
        console.log('Order is completed but not in eligible list, using order items');
        const reviewableItems = order.items.map(item => {
          // Ensure we have a valid product ID
          if (!item.productId) {
            console.warn('Missing product ID for item:', item.name);
          }
          return {
            id: item.productId || `product-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
            productId: item.productId || `product-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: item.name,
            imageUrl: item.image || item.imageUrl,
            quantity: item.quantity
          };
        });
        setReviewableProducts(reviewableItems);
      } else {
        console.log('No reviewable products found for this order');
        setReviewableProducts([]);
      }
    } catch (err) {
      console.error('Error checking reviewable products:', err);
    }
  };
  
  // Handle opening review dialog
  const handleOpenReviewDialog = (product) => {
    // Only allow reviews for completed orders
    if (order.status !== 'completed') {
      setError('You can only review products from completed orders');
      return;
    }
    
    setSelectedProduct(product);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewPhotos([]);
    setPhotoPreviewUrls([]);
    setReviewDialogOpen(true);
  };
  
  // Handle photo selection
  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // Limit to 5 photos max
      const newPhotos = [...reviewPhotos];
      const newPreviewUrls = [...photoPreviewUrls];
      
      files.forEach(file => {
        if (newPhotos.length < 5 && file.type.startsWith('image/')) {
          newPhotos.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        }
      });
      
      setReviewPhotos(newPhotos);
      setPhotoPreviewUrls(newPreviewUrls);
    }
  };
  
  // Handle removing a photo
  const handleRemovePhoto = (index) => {
    const newPhotos = [...reviewPhotos];
    const newPreviewUrls = [...photoPreviewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviewUrls[index]);
    
    newPhotos.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setReviewPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviewUrls);
  };
  
  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Handle submitting a review
  const handleSubmitReview = async () => {
    if (!selectedProduct || !currentUser) return;
    
    // Validate that the order is completed
    if (order.status !== 'completed') {
      setReviewError('You can only review products from completed orders');
      return;
    }
    
    // Ensure we have a valid product ID
    const productId = selectedProduct.id || selectedProduct.productId;
    if (!productId) {
      setReviewError('Unable to identify the product. Please try again later.');
      return;
    }
    
    try {
      setReviewSubmitting(true);
      setReviewError('');
      
      console.log('Submitting review for product:', productId);
      
      await addReview(
        currentUser.uid,
        productId,
        id,
        reviewRating,
        reviewComment,
        reviewPhotos // Pass the photo files to be uploaded
      );
      
      setSuccessMessage(`Thank you for reviewing ${selectedProduct.name}!`);
      setSnackbarOpen(true);
      setReviewDialogOpen(false);
      
      // Clear photos and preview URLs
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setReviewPhotos([]);
      setPhotoPreviewUrls([]);
      
      // Refresh reviewable products
      await checkReviewableProducts();
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  // Handle order cancellation
  const handleCancelOrder = async () => {
    try {
      setActionLoading(true);
      console.log('Cancelling order:', id);
      
      // Remember payment status before cancellation
      const paymentWasMade = (order?.paymentStatus === 'paid' || order?.paymentStatus === 'HELD_IN_ESCROW');
      const refundAmount = order?.totalAmount || 0;
      
      // Process the cancellation
      await cancelOrder(id);
      
      // Set appropriate success message based on payment status
      if (paymentWasMade) {
        setSuccessMessage(`Order cancelled successfully. ${formatCurrency(refundAmount)} has been refunded to your wallet.`);
        
        // Force refresh wallet data to show updated balance
        try {
          // If WalletContext is available, refresh wallet data
          if (window.refreshWalletData && typeof window.refreshWalletData === 'function') {
            console.log('Refreshing wallet data after refund');
            window.refreshWalletData();
          }
        } catch (walletError) {
          console.error('Error refreshing wallet data:', walletError);
        }
      } else {
        setSuccessMessage('Order cancelled successfully.');
      }
      
      setCancelDialogOpen(false);
      setSnackbarOpen(true);
      
      // Refresh order data
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
      
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order: ' + err.message);
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle order delivery confirmation
  const handleConfirmDelivery = async () => {
    try {
      // Validate order ID
      if (!id) {
        setError('Invalid order ID. Please try refreshing the page.');
        return;
      }
      
      setActionLoading(true);
      await confirmOrderDelivery(id);
      setSuccessMessage('Order delivery confirmed successfully! Payment has been released to the seller.');
      setSnackbarOpen(true);
      setConfirmDialogOpen(false);
      
      // Refresh order data
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
      
      // Refresh transaction history
      const transactionHistory = await getTransactionHistory(currentUser.uid);
      const orderTransactions = transactionHistory.filter(
        transaction => transaction.orderId === id
      );
      setTransactions(orderTransactions);
    } catch (err) {
      console.error('Error confirming delivery:', err);
      setError('Failed to confirm delivery: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle order delivery denial
  const handleDenyDelivery = async () => {
    try {
      setActionLoading(true);
      await denyOrderDelivery(id);
      setSuccessMessage('You have reported that this order has not been delivered. The seller has been notified.');
      setSnackbarOpen(true);
      setDenyDialogOpen(false);
      
      // Refresh order data
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error denying delivery:', err);
      setError('Failed to report non-delivery: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Refresh order data
  const refreshOrder = () => {
    fetchOrderDetails();
    fetchBuyerInfo();
    setSuccessMessage('Order details refreshed');
    setSnackbarOpen(true);
  };
  
  // Get the best available buyer information (database or order)
  const getBestBuyerInfo = () => {
    // Safety check for when order is not yet loaded
    if (!order) {
      return {
        name: 'Loading...',
        email: 'Loading...',
        phone: 'Loading...',
        street: 'Loading...',
        city: 'Loading...',
        district: 'Loading...',
        additionalInfo: 'Loading...'
      };
    }
    
    // Format the address based on Ethiopian format
    const formatEthiopianAddress = (address) => {
      if (!address) return {};
      
      return {
        name: address.fullName || address.name,
        phone: address.phoneNumber || address.phone,
        email: address.email || (currentUser ? currentUser.email : 'Not available'),
        street: address.address,
        city: address.city,
        district: address.subCity,
        additionalInfo: [
          address.kebele && `Kebele: ${address.kebele}`,
          address.woreda && `Woreda: ${address.woreda}`,
          address.deliveryInstructions
        ].filter(Boolean).join(', ')
      };
    };
    
    // If we have buyer info from the database, use that
    if (buyerInfo) {
      const dbAddress = buyerInfo.shippingAddress && 
                        typeof buyerInfo.shippingAddress === 'object' ? 
                        buyerInfo.shippingAddress : {};
      
      return {
        name: buyerInfo.name,
        email: buyerInfo.email,
        phone: buyerInfo.phone,
        ...formatEthiopianAddress({...order.shippingAddress, ...dbAddress})
      };
    }
    
    // Otherwise fall back to order shipping address
    return formatEthiopianAddress(order.shippingAddress || {});
  };
  
  // Get the current step index for the stepper
  const getCurrentStepIndex = (status) => {
    if (status === 'cancelled') return -1; // Special case for cancelled orders
    return orderSteps.indexOf(status);
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
  
  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            to="/orders"
            startIcon={<BackIcon />}
            sx={{ borderRadius: 0 }}
          >
            Back to Orders
          </Button>
          
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 0 }}>
            Order not found. It may have been deleted or you don't have permission to view it.
          </Alert>
        </Box>
      </Container>
    );
  }
  
  // Get the current step index for the stepper
  const currentStepIndex = getCurrentStepIndex(order.status);
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <OrderIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Order Details
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        gap: 2,
        mb: 3 
      }}>
        <Button
          component={Link}
          to="/orders"
          startIcon={<BackIcon />}
          variant="outlined"
          fullWidth={isMobile}
          sx={{ borderRadius: 0 }}
        >
          Back to Orders
        </Button>
        
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={refreshOrder}
          fullWidth={isMobile}
          sx={{ borderRadius: 0 }}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 0 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 1, sm: 0 },
          mb: 2 
        }}>
          <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Chip 
            label={order.status.toUpperCase()} 
            color={getStatusColor(order.status)}
            icon={getStatusIcon(order.status)}
            sx={{ fontWeight: 'medium', mt: { xs: 1, sm: 0 } }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Placed on {formatDate(order.createdAt)}
        </Typography>
        
        {order.status === 'cancelled' && (
          <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 0 }}>
            This order has been cancelled.
            {order.cancellationReason && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                Reason: {order.cancellationReason}
              </Typography>
            )}
          </Alert>
        )}
        
        {order.status === 'delivered' && !order.buyerConfirmed && (
          <Alert severity="info" sx={{ mt: 2, mb: 2, borderRadius: 0, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
              Your order has been marked as delivered by the seller!
            </Typography>
            <Typography variant="body2" gutterBottom>
              Please confirm if you have received your order. Once confirmed, payment will be released to the seller and you'll be able to leave reviews.
            </Typography>
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2 
            }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                fullWidth={isMobile}
                sx={{ borderRadius: 0 }}
              >
                Confirm Delivery
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={() => setDenyDialogOpen(true)}
                fullWidth={isMobile}
                sx={{ borderRadius: 0 }}
              >
                Not Delivered
              </Button>
            </Box>
          </Alert>
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
              <Typography variant="subtitle1">Your Information</Typography>
              {buyerInfoLoading && (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                <strong>Name:</strong> {getBestBuyerInfo().name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                <strong>Email:</strong> {getBestBuyerInfo().email}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                <strong>Phone:</strong> {getBestBuyerInfo().phone}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              {getBestBuyerInfo().street && (
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Address:</strong> {getBestBuyerInfo().street}
                </Typography>
              )}
              {getBestBuyerInfo().city && (
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>City:</strong> {getBestBuyerInfo().city}
                </Typography>
              )}
              {getBestBuyerInfo().district && (
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Sub-City/District:</strong> {getBestBuyerInfo().district}
                </Typography>
              )}
              {getBestBuyerInfo().additionalInfo && (
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-word' }}>
                  <strong>Additional Info:</strong> {getBestBuyerInfo().additionalInfo}
                </Typography>
              )}
            </Box>
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
              key={item.productId || `item-${index}-${item.name}`} 
              alignItems="flex-start"
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
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
              <Box sx={{ display: 'flex', width: '100%' }}>
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between', 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Typography variant="subtitle1" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {item.name}
                      </Typography>
                      {item.status === 'cancelled' && (
                        <Chip 
                          size="small"
                          label="CANCELLED" 
                          color="error"
                          icon={<CancelIcon fontSize="small" />}
                          sx={{ fontWeight: 'medium', alignSelf: { xs: 'flex-start', sm: 'center' } }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="div" sx={{ display: 'block', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block' }}>
                        Quantity: {item.quantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block', mt: 0.5 }}>
                        Price: {formatCurrency(item.price)}
                      </Typography>
                      {item.variant && (
                        <Typography variant="body2" color="text.secondary" component="div" sx={{ display: 'block', mt: 0.5, wordBreak: 'break-word' }}>
                          Variant: {item.variant}
                        </Typography>
                      )}
                      {item.status === 'cancelled' && item.cancellationReason && (
                        <Typography variant="body2" component="div" sx={{ display: 'block', mt: 0.5, color: 'error.main', fontWeight: 'medium', wordBreak: 'break-word' }}>
                          Cancelled by seller. Reason: {item.cancellationReason}
                        </Typography>
                      )}
                      {item.sellerId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <StoreIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography variant="body2" color="text.secondary" component="div" sx={{ wordBreak: 'break-word' }}>
                            Seller ID: {item.sellerId.substring(0, 8)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  sx={{ width: '100%' }}
                />
              </Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  width: { xs: '100%', sm: 'auto' },
                  mt: { xs: 1, sm: 0 }
                }}
              >
                {formatCurrency(item.price * item.quantity)}
              </Typography>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Order Total:
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                {formatCurrency(order.total || order.totalAmount || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center', 
          gap: 2 
        }}>
          {order.status === 'delivered' && !order.buyerConfirmed && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                fullWidth={isMobile}
                sx={{ borderRadius: 0 }}
              >
                Confirm Delivery
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={() => setDenyDialogOpen(true)}
                fullWidth={isMobile}
                sx={{ borderRadius: 0 }}
              >
                Not Delivered
              </Button>
            </>
          )}
          
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelDialogOpen(true)}
              fullWidth={isMobile}
              sx={{ borderRadius: 0 }}
            >
              Cancel Order
            </Button>
          )}
        </Box>
      </Paper>
      
      {/* Order History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order History
          </Typography>
          
          <List>
            {[...order.statusHistory].reverse().map((update, index) => (
              <ListItem 
                key={`status-${update.status}-${(update.timestamp && update.timestamp.seconds) ? update.timestamp.seconds : index}`}
                sx={{ 
                  borderBottom: index < order.statusHistory.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  py: 1
                }}
              >
                <ListItemText
                  primary={`Status changed to ${update.status.toUpperCase()}`}
                  secondary={<Typography component="span" variant="body2">{update.timestamp ? formatDate(update.timestamp) : 'N/A'}</Typography>}
                />
                <Chip 
                  label={update.status.toUpperCase()} 
                  color={getStatusColor(update.status)}
                  size="small"
                  sx={{ borderRadius: 0 }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Payment Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Method
              </Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                {order.paymentMethod || 'Not specified'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Payment Status
              </Typography>
              <Chip 
                label={order.paymentStatus?.toUpperCase() || 'PENDING'} 
                color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                size="small"
                sx={{ borderRadius: 0, mt: 0.5 }}
              />
            </Box>
          </Grid>
        </Grid>
        
        {/* Transaction History */}
        {transactions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Transaction History
            </Typography>
            
            <List>
              {transactions.map((transaction, index) => (
                <ListItem 
                  key={`transaction-${transaction.id || (transaction.timestamp && transaction.timestamp.seconds) ? (transaction.timestamp && transaction.timestamp.seconds) || transaction.id : index}`}
                  sx={{ 
                    borderBottom: index < transactions.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    py: 1,
                    px: 0
                  }}
                >
                  <ListItemText
                    primary={transaction.description}
                    secondary={<Typography component="span" variant="body2">{formatDate(transaction.timestamp)}</Typography>}
                  />
                  <Typography 
                    variant="body2" 
                    color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
      
      {/* Review Section for Completed Orders */}
      {order && order.status === 'completed' && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RateReviewIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Review Your Purchase
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Share your experience with these products to help other shoppers make informed decisions.
          </Typography>
          
          {reviewableProducts.length > 0 ? (
            <List>
              {reviewableProducts.map((product, index) => {
                // Ensure product has an ID
                const productWithId = {
                  ...product,
                  id: product.id || product.productId || `product-${product.name.replace(/\s+/g, '-').toLowerCase()}-${index}`
                };
                return (
                <ListItem 
                  key={productWithId.id || `reviewable-${index}-${product.name}`}
                  sx={{ 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', mb: { xs: 2, sm: 0 } }}>
                    <ListItemAvatar>
                      <Avatar 
                        alt={product.name} 
                        src={product.imageUrl} 
                        variant="rounded"
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {product.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                          Quantity: {product.quantity}
                        </Typography>
                      }
                    />
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<StarIcon />}
                    onClick={() => handleOpenReviewDialog(productWithId)}
                    sx={{ 
                      borderRadius: 0,
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Write Review
                  </Button>
                </ListItem>
              )})}
            </List>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              No products available for review at this time. Only completed orders can be reviewed.
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Review {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          {reviewError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
              {reviewError}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Your Rating
              </Typography>
              <Rating
                name="product-rating"
                value={reviewRating}
                onChange={(event, newValue) => {
                  setReviewRating(newValue);
                }}
                precision={1}
                size="large"
              />
            </Box>
            
            <TextField
              label="Your Review"
              multiline
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              fullWidth
              placeholder="Share your experience with this product..."
              variant="outlined"
            />
            
            {/* Photo Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Add Photos (Optional)
              </Typography>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {photoPreviewUrls.map((url, index) => (
                  <Box 
                    key={`photo-${index}`} 
                    sx={{ 
                      position: 'relative',
                      width: 100, 
                      height: 100,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={url} 
                      alt={`Review photo ${index + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <IconButton
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)'
                        },
                        p: 0.5
                      }}
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                
                {photoPreviewUrls.length < 5 && (
                  <Button
                    variant="outlined"
                    startIcon={<AddPhotoIcon />}
                    onClick={() => fileInputRef.current.click()}
                    sx={{ 
                      height: 100, 
                      width: 100,
                      borderStyle: 'dashed',
                      borderRadius: 1
                    }}
                  >
                    Add
                  </Button>
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                You can upload up to 5 photos. Each photo must be less than 5MB.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReviewDialogOpen(false)}
            disabled={reviewSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReview}
            variant="contained" 
            color="primary"
            disabled={reviewSubmitting || !reviewRating}
            startIcon={reviewSubmitting ? null : <CloudUploadIcon />}
            sx={{ borderRadius: 0 }}
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delivery Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-delivery-dialog-title"
      >
        <DialogTitle id="confirm-delivery-dialog-title">
          Confirm Delivery
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            By confirming delivery, you acknowledge that you have received all items in this order in good condition. 
            This will release the payment to the seller and complete the transaction.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            color="primary"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelivery} 
            color="success" 
            variant="contained"
            disabled={actionLoading}
            sx={{ borderRadius: 0 }}
          >
            {actionLoading ? 'Processing...' : 'Confirm Delivery'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Deny Delivery Dialog */}
      <Dialog
        open={denyDialogOpen}
        onClose={() => setDenyDialogOpen(false)}
        aria-labelledby="deny-delivery-dialog-title"
      >
        <DialogTitle id="deny-delivery-dialog-title">
          Report Not Delivered
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            If you have not received your order yet, this will notify the seller and our support team. 
            The order status will be changed back to "shipped" and payment will not be released until the issue is resolved.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDenyDialogOpen(false)} 
            color="primary"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDenyDelivery} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            sx={{ borderRadius: 0 }}
          >
            {actionLoading ? 'Processing...' : 'Report Not Delivered'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        aria-labelledby="cancel-order-dialog-title"
        PaperProps={{
          sx: { borderTop: '4px solid', borderColor: 'error.main' }
        }}
      >
        <DialogTitle id="cancel-order-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon color="error" />
          Cancel Order
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
          
          {order?.paymentStatus === 'paid' && (
            <Alert 
              severity="info" 
              icon={<PaymentIcon />}
              sx={{ mt: 2, alignItems: 'flex-start' }}
            >
              <Box>
                <Typography variant="subtitle2" component="span">
                  Payment Refund:
                </Typography>
                <Typography variant="body2">
                  Your payment of {formatCurrency(order?.totalAmount || 0)} will be immediately refunded to your wallet.
                </Typography>
              </Box>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            color="primary"
            disabled={actionLoading}
          >
            No, Keep Order
          </Button>
          <Button 
            onClick={handleCancelOrder} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
            sx={{ borderRadius: 0 }}
          >
            {actionLoading ? 'Processing...' : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={successMessage}
      />
    </Container>
  );
};

export default OrderDetail;
