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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Card,
  CardContent,
  useTheme,
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
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getOrderById, cancelOrder, confirmOrderDelivery, denyOrderDelivery } from '../../firebase/services';
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
  
  // Review state
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
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
  
  // Check for reviewable products when order is loaded
  useEffect(() => {
    if (order && order.status === 'completed') {
      checkReviewableProducts();
    }
  }, [order]);
  
  // Function to check which products can be reviewed
  const checkReviewableProducts = async () => {
    if (!order || !currentUser) return;
    
    try {
      const eligibleOrders = await getEligibleOrdersForReview(currentUser.uid);
      const currentOrderEligible = eligibleOrders.find(o => o.id === id);
      
      if (currentOrderEligible) {
        setReviewableProducts(currentOrderEligible.products);
      } else {
        setReviewableProducts([]);
      }
    } catch (err) {
      console.error('Error checking reviewable products:', err);
    }
  };
  
  // Handle opening review dialog
  const handleOpenReviewDialog = (product) => {
    setSelectedProduct(product);
    setReviewRating(5);
    setReviewComment('');
    setReviewError('');
    setReviewDialogOpen(true);
  };
  
  // Handle submitting a review
  const handleSubmitReview = async () => {
    if (!selectedProduct || !currentUser) return;
    
    try {
      setReviewSubmitting(true);
      setReviewError('');
      
      await addReview(
        currentUser.uid,
        selectedProduct.id,
        id,
        reviewRating,
        reviewComment
      );
      
      setSuccessMessage(`Thank you for reviewing ${selectedProduct.name}!`);
      setSnackbarOpen(true);
      setReviewDialogOpen(false);
      
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
      await cancelOrder(id);
      setSuccessMessage('Order cancelled successfully');
      setCancelDialogOpen(false);
      
      // Refresh order data
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError('Failed to cancel order: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle order delivery confirmation
  const handleConfirmDelivery = async () => {
    try {
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          component={Link}
          to="/orders"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Orders
        </Button>
        
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={refreshOrder}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Chip 
            label={order.status.toUpperCase()} 
            color={getStatusColor(order.status)}
            icon={getStatusIcon(order.status)}
            sx={{ fontWeight: 'medium' }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Placed on {formatDate(order.createdAt)}
        </Typography>
        
        {order.status === 'cancelled' && (
          <Alert severity="error" sx={{ mt: 2, mb: 2, borderRadius: 0 }}>
            This order has been cancelled.
          </Alert>
        )}
        
        {order.status === 'delivered' && !order.buyerConfirmed && (
          <Alert severity="info" sx={{ mt: 2, mb: 2, borderRadius: 0 }}>
            The seller has marked this order as delivered. Please confirm if you have received it or report if you haven't.
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
            </Box>
            
            <Typography variant="body2">
              <strong>Name:</strong> {order.shippingAddress?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {order.shippingAddress?.email}
            </Typography>
            <Typography variant="body2">
              <strong>Phone:</strong> {order.shippingAddress?.phone}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HomeIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Box>
            
            {order.shippingAddress && (
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
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                      Quantity: {item.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                      Price: {formatCurrency(item.price)}
                    </Typography>
                    {item.variant && (
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                        Variant: {item.variant}
                      </Typography>
                    )}
                    {item.sellerId && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <StoreIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" component="span">
                          Seller ID: {item.sellerId.substring(0, 8)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
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
                {formatCurrency(order.total || order.totalAmount || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {order.status === 'delivered' && !order.buyerConfirmed && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ThumbUpIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                sx={{ borderRadius: 0 }}
              >
                Confirm Delivery
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<ThumbDownIcon />}
                onClick={() => setDenyDialogOpen(true)}
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
                key={index}
                sx={{ 
                  borderBottom: index < order.statusHistory.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  py: 1
                }}
              >
                <ListItemText
                  primary={`Status changed to ${update.status.toUpperCase()}`}
                  secondary={update.timestamp ? formatDate(update.timestamp) : 'N/A'}
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
                  key={index}
                  sx={{ 
                    borderBottom: index < transactions.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    py: 1,
                    px: 0
                  }}
                >
                  <ListItemText
                    primary={transaction.description}
                    secondary={formatDate(transaction.timestamp)}
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
      {order && order.status === 'completed' && reviewableProducts.length > 0 && (
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
          
          <List>
            {reviewableProducts.map((product) => (
              <ListItem 
                key={product.id}
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 2
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    alt={product.name} 
                    src={product.imageUrl} 
                    variant="rounded"
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={product.name}
                  secondary={`Quantity: ${product.quantity}`}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<StarIcon />}
                  onClick={() => handleOpenReviewDialog(product)}
                  sx={{ borderRadius: 0 }}
                >
                  Write Review
                </Button>
              </ListItem>
            ))}
          </List>
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
      >
        <DialogTitle id="cancel-order-dialog-title">
          Cancel Order
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
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
