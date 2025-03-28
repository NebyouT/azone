import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Avatar
} from '@mui/material';
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
  Store as StoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getOrderById } from '../../firebase/services';

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
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'cancelled':
      return 'error';
    default:
      return 'warning';
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
    default:
      return <HourglassEmptyIcon />;
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, currentUser]);
  
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
        <Alert severity="warning" sx={{ mb: 2 }}>
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <OrderIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Order Details
        </Typography>
      </Box>
      
      <Button
        component={Link}
        to="/orders"
        startIcon={<BackIcon />}
        variant="outlined"
        sx={{ mb: 3 }}
      >
        Back to Orders
      </Button>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Chip 
            label={order.status} 
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
              {order.shippingAddress?.name}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.email}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.phone}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AddressIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1">Shipping Address</Typography>
            </Box>
            <Typography variant="body2">
              {order.shippingAddress?.street}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress?.country}
            </Typography>
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
            <Typography variant="body2">
              {order.paymentMethod || 'Wallet'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        
        <List sx={{ width: '100%' }}>
          {order.items?.map((item) => (
            <ListItem 
              key={item.productId} 
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
                  src={item.image} 
                  variant="rounded"
                  sx={{ width: 60, height: 60, mr: 2 }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                      {item.name}
                    </Typography>
                    <Chip 
                      icon={getStatusIcon(item.status || 'pending')}
                      label={(item.status || 'pending').toUpperCase()}
                      color={getStatusColor(item.status || 'pending')}
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
                  <Typography variant="body1" color="error.main">
                    -{formatCurrency(order.discount || 0)}
                  </Typography>
                </Grid>
              </>
            )}
            
            <Grid item xs={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Total:
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
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Timeline
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body1">
              Order Placed
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {formatDate(order.createdAt)}
            </Typography>
          </Box>
          
          {order.items && (
            <Box sx={{ pl: 2, borderLeft: '1px dashed', borderColor: 'divider' }}>
              {Array.from(new Set(order.items.map(item => item.status || 'pending'))).map((status, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 2 }}>
                  {getStatusIcon(status)}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {status === 'processing' ? 'Order Processing' : 
                     status === 'shipped' ? 'Order Shipped' :
                     status === 'completed' ? 'Order Delivered' :
                     status === 'cancelled' ? 'Order Cancelled' : 'Order Pending'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {status !== 'pending' ? formatDate(order.updatedAt) : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderDetail;
