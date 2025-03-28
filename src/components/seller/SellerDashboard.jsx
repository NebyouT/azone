import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerProducts, getSellerOrdersFromCollection } from '../../firebase/services';

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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        
        // Fetch seller's orders from the dedicated collection
        const sellerOrders = await getSellerOrdersFromCollection(currentUser.uid);
        setOrders(sellerOrders);
        
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddProduct = () => {
    navigate('/seller/products/add');
  };

  const handleEditProduct = (productId) => {
    navigate(`/seller/products/${productId}/edit`);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/seller/orders/${orderId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StoreIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Seller Dashboard
          </Typography>
        </Box>
        
        {userDetails && (
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {userDetails.displayName}!
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ShoppingBagIcon />} label="Products" />
          <Tab icon={<AssessmentIcon />} label="Orders" />
          <Tab icon={<SettingsIcon />} label="Shop Settings" />
        </Tabs>

        {/* Products Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Your Products ({products.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              Add New Product
            </Button>
          </Box>
          
          {products.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" paragraph>
                You haven't added any products yet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
              >
                Add Your First Product
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {products.map(product => (
                <Grid item key={product.id} xs={12} md={6} lg={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ height: 200, overflow: 'hidden' }}>
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {product.description.substring(0, 100)}
                        {product.description.length > 100 ? '...' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          ${product.price.toFixed(2)}
                        </Typography>
                        <Chip 
                          label={product.inStock ? 'In Stock' : 'Out of Stock'} 
                          color={product.inStock ? 'success' : 'error'} 
                          size="small"
                        />
                      </Box>
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Button 
                        fullWidth 
                        variant="outlined"
                        onClick={() => handleEditProduct(product.id)}
                      >
                        Edit Product
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Your Orders ({orders.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your customer orders here
            </Typography>
          </Box>
          
          {orders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1">
                You don't have any orders yet.
              </Typography>
            </Paper>
          ) : (
            <List>
              {orders.map(order => (
                <Paper key={order.id} sx={{ mb: 2 }}>
                  <ListItem 
                    button
                    onClick={() => handleViewOrder(order.id)}
                    sx={{ 
                      flexDirection: { xs: 'column', sm: 'row' }, 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      p: 2
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          Order #{order.id.substring(0, 8)}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            Placed on {order.createdAt?.toDate?.() ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Items: {order.items?.length || 0} | 
                            Customer: {order.shippingAddress?.name || 'Unknown'}
                          </Typography>
                        </>
                      }
                      sx={{ mb: { xs: 1, sm: 0 } }}
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'row', sm: 'column' },
                      alignItems: { xs: 'center', sm: 'flex-end' },
                      justifyContent: 'space-between',
                      ml: { xs: 0, sm: 'auto' }, 
                      width: { xs: '100%', sm: 'auto' }
                    }}>
                      <Chip 
                        label={(order.status || 'pending').toUpperCase()} 
                        color={
                          order.status === 'completed' ? 'success' :
                          order.status === 'processing' ? 'info' :
                          order.status === 'shipped' ? 'primary' :
                          order.status === 'cancelled' ? 'error' : 'warning'
                        }
                        sx={{ mr: { xs: 2, sm: 0 }, mb: { xs: 0, sm: 1 } }}
                      />
                      <Typography variant="h6" color="primary">
                        ${order.total?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleViewOrder(order.id)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small"
                      color={
                        order.status === 'pending' ? 'primary' :
                        order.status === 'processing' ? 'info' :
                        order.status === 'shipped' ? 'success' : 'inherit'
                      }
                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                      onClick={() => handleViewOrder(order.id)}
                    >
                      {order.status === 'pending' ? 'Accept Order' :
                       order.status === 'processing' ? 'Mark Shipped' :
                       order.status === 'shipped' ? 'Mark Delivered' : 'Manage Order'}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Shop Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Shop Settings
          </Typography>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" paragraph>
              Configure your shop settings, including shop name, description, and payment information.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This feature is coming soon.
            </Typography>
          </Paper>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default SellerDashboard;
