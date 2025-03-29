import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  DialogActions
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  ShoppingBag as OrderIcon,
  ArrowBack as BackIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Home as AddressIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Store as StoreIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getOrderById, cancelOrder, confirmOrderDelivery } from '../../firebase/services';
import { getTransactionHistory } from '../../firebase/walletServices';

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
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <HourglassEmptyIcon />;
    case 'processing':
      return <AutorenewIcon />;
    case 'shipped':
      return <ShippingIcon />;
    case 'completed':
      return <CheckCircleIcon />;
    case 'cancelled':
      return <CancelIcon />;
    default:
      return <OrderIcon />;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
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
    
    fetchOrderDetails();
  }, [id, currentUser]);
  
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
      setSuccessMessage('Order delivery confirmed successfully');
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          component={Link}
          to="/orders"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Orders
        </Button>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Order not found
        </Alert>
        <Button
          component={Link}
          to="/orders"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Orders
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/orders"
          startIcon={<BackIcon />}
          variant="outlined"
        >
          Back to Orders
        </Button>
        
        <Box>
          {/* Order Action Buttons */}
          {order.status === 'pending' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              Cancel Order
            </Button>
          )}
          
          {order.status === 'shipped' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              sx={{ ml: 1 }}
            >
              Confirm Delivery
            </Button>
          )}
        </Box>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Order #{id.substring(0, 8)}
          </Typography>
          
          <Chip
            icon={getStatusIcon(order.status)}
            label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            color={getStatusColor(order.status)}
            sx={{ fontWeight: 'medium' }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Placed on {formatDate(order.createdAt)}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Customer Information</Typography>
            </Box>
            <Typography variant="body2">
              {order.shippingAddress?.fullName}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.phoneNumber}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AddressIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Box>
            <Typography variant="body2">
              {order.shippingAddress?.address}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.city}, {order.shippingAddress?.region} {order.shippingAddress?.zipCode}
            </Typography>
            {order.shippingAddress?.deliveryInstructions && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Instructions: {order.shippingAddress.deliveryInstructions}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Method</Typography>
            </Box>
            <Typography variant="body2">
              {order.shippingMethod || 'Standard Shipping'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Payment Method</Typography>
            </Box>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {order.paymentMethod?.replace(/_/g, ' ') || 'Wallet Payment'}
            </Typography>
            <Typography variant="body2">
              Status: {order.paymentStatus || 'Pending'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        
        <List>
          {order.items.map((item, index) => (
            <ListItem 
              key={index}
              alignItems="flex-start"
              sx={{ 
                py: 2,
                borderBottom: index < order.items.length - 1 ? '1px solid #eee' : 'none'
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  alt={item.name}
                  src={item.imageUrl}
                  variant="rounded"
                  sx={{ width: 60, height: 60 }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" component="span">
                      {item.name}
                    </Typography>
                    <Chip
                      label={item.status || order.status}
                      color={getStatusColor(item.status || order.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
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
                    {item.sellerId && (
                      <Box component="div" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        <StoreIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
                        <Typography variant="body2" color="text.secondary" component="span">
                          Seller ID: {item.sellerId.substring(0, 8)}
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
              <Typography variant="body1">Subtotal:</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">{formatCurrency(order.subtotal || 0)}</Typography>
            </Grid>
            
            <Grid item xs={8}>
              <Typography variant="body1">Shipping:</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">{formatCurrency(order.shippingCost || 0)}</Typography>
            </Grid>
            
            {order.discount > 0 && (
              <>
                <Grid item xs={8}>
                  <Typography variant="body1">Discount:</Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1">-{formatCurrency(order.discount)}</Typography>
                </Grid>
              </>
            )}
            
            <Grid item xs={8}>
              <Typography variant="body1">Tax:</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">{formatCurrency(order.tax || 0)}</Typography>
            </Grid>
            
            <Grid item xs={8}>
              <Typography variant="h6">Total:</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="h6">{formatCurrency(order.total || 0)}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Order Timeline */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Order Timeline
        </Typography>
        
        <Timeline position="alternate">
          <TimelineItem>
            <TimelineOppositeContent color="text.secondary">
              {formatDate(order.createdAt)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <OrderIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="body1">Order Placed</Typography>
              <Typography variant="body2" color="text.secondary">
                Your order has been received
              </Typography>
            </TimelineContent>
          </TimelineItem>
          
          {order.status === 'cancelled' && (
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(order.cancelledAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="error">
                  <CancelIcon />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1">Order Cancelled</Typography>
                <Typography variant="body2" color="text.secondary">
                  Cancelled by {order.cancelledBy || 'customer'}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
          
          {(order.status === 'processing' || order.status === 'shipped' || order.status === 'completed') && (
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(order.processingAt || order.updatedAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="info">
                  <AutorenewIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1">Processing</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your order is being processed
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
          
          {(order.status === 'shipped' || order.status === 'completed') && (
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(order.shippedAt || order.updatedAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <ShippingIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1">Shipped</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your order has been shipped
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
          
          {order.status === 'completed' && (
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                {formatDate(order.completedAt || order.updatedAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <CheckCircleIcon />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1">Delivered</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your order has been delivered and completed
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
        </Timeline>
      </Paper>
      
      {/* Transaction History */}
      {transactions.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          
          <List>
            {transactions.map((transaction, index) => (
              <ListItem 
                key={index}
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  borderBottom: index < transactions.length - 1 ? '1px solid #eee' : 'none'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: transaction.amount > 0 ? 'success.main' : 'error.main' }}>
                    <MoneyIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {transaction.type === 'purchase' ? 'Payment for Order' : 
                       transaction.type === 'sale' ? 'Payment Received' : 
                       transaction.type === 'refund' ? 'Refund Received' : 'Transaction'}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.createdAt)}
                      </Typography>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </>
                  }
                />
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: transaction.amount > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatCurrency(transaction.amount)}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Cancel Order Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)} 
            disabled={actionLoading}
          >
            No, Keep Order
          </Button>
          <Button 
            onClick={handleCancelOrder} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delivery Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Delivery</DialogTitle>
        <DialogContent>
          <DialogContentText>
            By confirming delivery, you acknowledge that you have received all items in this order.
            This will release payment to the seller. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelivery} 
            color="success" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm Delivery'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;
