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
  Tooltip
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getUserOrders } from '../../firebase/services';

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
      return <CheckCircleIcon fontSize="small" />;
    case 'processing':
      return <AutorenewIcon fontSize="small" />;
    case 'shipped':
      return <ShippingIcon fontSize="small" />;
    case 'cancelled':
      return <CancelIcon fontSize="small" />;
    default:
      return <HourglassEmptyIcon fontSize="small" />;
  }
};

// Calculate the overall status of an order based on item statuses
const calculateOrderStatus = (order) => {
  if (!order.items || order.items.length === 0) {
    return order.status || 'pending';
  }
  
  // Count items by status
  const statusCounts = order.items.reduce((counts, item) => {
    const status = item.status || 'pending';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  
  const totalItems = order.items.length;
  
  // If all items have the same status, use that
  if (statusCounts.completed === totalItems) return 'completed';
  if (statusCounts.cancelled === totalItems) return 'cancelled';
  
  // If any items are shipped, show as partially shipped
  if (statusCounts.shipped) return 'shipped';
  
  // If any items are processing, show as processing
  if (statusCounts.processing) return 'processing';
  
  // Default to pending
  return 'pending';
};

// Get a human-readable status description
const getStatusDescription = (order) => {
  if (!order.items || order.items.length === 0) {
    return order.status || 'Pending';
  }
  
  // Count items by status
  const statusCounts = order.items.reduce((counts, item) => {
    const status = item.status || 'pending';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  
  const totalItems = order.items.length;
  
  // If all items have the same status, use that
  if (statusCounts.completed === totalItems) return 'Completed';
  if (statusCounts.cancelled === totalItems) return 'Cancelled';
  if (statusCounts.shipped === totalItems) return 'Shipped';
  if (statusCounts.processing === totalItems) return 'Processing';
  if (statusCounts.pending === totalItems) return 'Pending';
  
  // Mixed statuses
  const parts = [];
  if (statusCounts.completed) parts.push(`${statusCounts.completed} Completed`);
  if (statusCounts.shipped) parts.push(`${statusCounts.shipped} Shipped`);
  if (statusCounts.processing) parts.push(`${statusCounts.processing} Processing`);
  if (statusCounts.pending) parts.push(`${statusCounts.pending} Pending`);
  if (statusCounts.cancelled) parts.push(`${statusCounts.cancelled} Cancelled`);
  
  return parts.join(', ');
};

const Orders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userOrders = await getUserOrders(currentUser.uid);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentUser]);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
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
            startIcon={<OrderIcon />}
          >
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>#{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Tooltip title={getStatusDescription(order)}>
                      <Chip 
                        icon={getStatusIcon(calculateOrderStatus(order))}
                        label={calculateOrderStatus(order).toUpperCase()} 
                        color={getStatusColor(calculateOrderStatus(order))}
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      to={`/orders/${order.id}`}
                      size="small"
                      variant="outlined"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Orders;
