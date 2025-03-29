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
  Chip,
  IconButton,
  Avatar,
  Rating,
  Badge,
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
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalOffer as OfferIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerProducts, getSellerOrdersFromCollection } from '../../firebase/services';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    canceledOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    averageRating: 0,
    totalReviews: 0,
    customerMessages: 0
  });
  
  // Time period filter for analytics
  const [timePeriod, setTimePeriod] = useState('month');
  
  // Product management
  const [productFilter, setProductFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [productsPerPage, setProductsPerPage] = useState(10);
  
  // Order management
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSort, setOrderSort] = useState('newest');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  
  // Customer engagement
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

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
        
        // Calculate dashboard metrics
        calculateMetrics(sellerProducts, sellerOrders);
        
        // Generate sample data for demo purposes
        generateSampleData();
        
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
  
  // Calculate dashboard metrics from products and orders
  const calculateMetrics = (products, orders) => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.inStock).length;
    const outOfStockProducts = totalProducts - activeProducts;
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const canceledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Sample data for demo
    const averageRating = 4.7;
    const totalReviews = 28;
    const customerMessages = 5;
    
    setMetrics({
      totalSales,
      totalRevenue,
      pendingOrders,
      shippedOrders,
      completedOrders,
      canceledOrders,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      averageRating,
      totalReviews,
      customerMessages
    });
  };
  
  // Generate sample data for demo purposes
  const generateSampleData = () => {
    // Sample reviews
    const sampleReviews = [
      { 
        id: '1', 
        productId: '1', 
        productName: 'Wireless Headphones', 
        customerName: 'John Doe', 
        rating: 5, 
        comment: 'Great product! Excellent sound quality and comfortable to wear.', 
        date: new Date(2025, 2, 15) 
      },
      { 
        id: '2', 
        productId: '2', 
        productName: 'Smart Watch', 
        customerName: 'Sarah Miller', 
        rating: 4, 
        comment: 'Good battery life, but the strap could be more durable.', 
        date: new Date(2025, 2, 20) 
      },
      { 
        id: '3', 
        productId: '3', 
        productName: 'Bluetooth Speaker', 
        customerName: 'Michael Johnson', 
        rating: 5, 
        comment: 'Amazing sound for such a compact speaker!', 
        date: new Date(2025, 2, 25) 
      }
    ];
    
    // Sample messages
    const sampleMessages = [
      { 
        id: '1', 
        customerId: '1', 
        customerName: 'Emily Wilson', 
        subject: 'Question about delivery', 
        message: 'Hi, I was wondering when my order will be shipped?', 
        date: new Date(2025, 2, 28), 
        read: false 
      },
      { 
        id: '2', 
        customerId: '2', 
        customerName: 'David Brown', 
        subject: 'Product warranty', 
        message: 'Hello, does the smartphone come with a warranty?', 
        date: new Date(2025, 2, 27), 
        read: true 
      }
    ];
    
    // Sample notifications
    const sampleNotifications = [
      { 
        id: '1', 
        type: 'order', 
        message: 'New order received: #ORD-12345', 
        date: new Date(2025, 2, 29), 
        read: false 
      },
      { 
        id: '2', 
        type: 'review', 
        message: 'New 5-star review for Wireless Headphones', 
        date: new Date(2025, 2, 28), 
        read: false 
      },
      { 
        id: '3', 
        type: 'stock', 
        message: 'Smart Watch is running low on stock (2 remaining)', 
        date: new Date(2025, 2, 27), 
        read: true 
      }
    ];
    
    setReviews(sampleReviews);
    setMessages(sampleMessages);
    setNotifications(sampleNotifications);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Generate chart data for sales analytics
  const generateSalesChartData = () => {
    try {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Sample data for demonstration
      const salesData = Array(12).fill(0).map((_, i) => 
        i <= currentMonth ? Math.floor(Math.random() * 50) + 10 : 0
      );
      
      const revenueData = salesData.map(sales => sales * (Math.floor(Math.random() * 50) + 30));
      
      return {
        labels,
        datasets: [
          {
            label: 'Orders',
            data: salesData,
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            tension: 0.4,
            fill: true
          },
          {
            label: 'Revenue ($)',
            data: revenueData,
            borderColor: theme.palette.success.main,
            backgroundColor: 'transparent',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      };
    } catch (error) {
      console.error("Error generating sales chart data:", error);
      return {
        labels: [],
        datasets: []
      };
    }
  };

  // Generate chart options for sales analytics
  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Orders'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales & Revenue'
      }
    }
  };

  // Generate product category distribution data
  const generateCategoryChartData = () => {
    try {
      return {
        labels: ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'],
        datasets: [
          {
            data: [40, 25, 15, 10, 10],
            backgroundColor: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              theme.palette.success.main,
              theme.palette.warning.main,
              theme.palette.error.main
            ],
            borderWidth: 1
          }
        ]
      };
    } catch (error) {
      console.error("Error generating category chart data:", error);
      return {
        labels: [],
        datasets: []
      };
    }
  };

  // Generate category chart options
  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Product Categories'
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 0, 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StoreIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Seller Dashboard
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Badge 
              badgeContent={notifications.filter(n => !n.read).length} 
              color="error" 
              sx={{ mr: 2 }}
            >
              <IconButton color="inherit">
                <NotificationsIcon />
              </IconButton>
            </Badge>
            <Badge 
              badgeContent={messages.filter(m => !m.read).length} 
              color="primary"
            >
              <IconButton color="inherit">
                <MessageIcon />
              </IconButton>
            </Badge>
          </Box>
        </Box>
        
        {userDetails && (
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {userDetails.displayName}!
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Sales Performance
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Sales */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    borderRadius: 0
                  }}
                >
                  <ShoppingBagIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <TrendingUpIcon color="success" />
                </Box>
              </Box>
              <Typography variant="h4" component="div">
                {metrics.totalSales}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Total Orders
              </Typography>
            </Paper>
          </Grid>
          
          {/* Total Revenue */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    borderRadius: 0
                  }}
                >
                  <MoneyIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <TrendingUpIcon color="success" />
                </Box>
              </Box>
              <Typography variant="h4" component="div">
                ${metrics.totalRevenue.toFixed(2)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Total Revenue
              </Typography>
            </Paper>
          </Grid>
          
          {/* Products */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1), 
                    color: theme.palette.info.main,
                    borderRadius: 0
                  }}
                >
                  <InventoryIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label={`${metrics.outOfStockProducts} out of stock`} 
                    size="small" 
                    color={metrics.outOfStockProducts > 0 ? "warning" : "success"}
                    sx={{ borderRadius: 0 }}
                  />
                </Box>
              </Box>
              <Typography variant="h4" component="div">
                {metrics.totalProducts}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Total Products
              </Typography>
            </Paper>
          </Grid>
          
          {/* Ratings */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1), 
                    color: theme.palette.warning.main,
                    borderRadius: 0
                  }}
                >
                  <StarIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    {metrics.totalReviews} reviews
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                  {metrics.averageRating.toFixed(1)}
                </Typography>
                <Rating value={metrics.averageRating} readOnly precision={0.1} size="small" />
              </Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Average Rating
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Order Status */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Order Fulfillment
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Pending Orders */}
          <Grid item xs={6} sm={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="h5" color="warning.main">
                {metrics.pendingOrders}
              </Typography>
              <Typography variant="body2">Pending</Typography>
            </Paper>
          </Grid>
          
          {/* Processing Orders */}
          <Grid item xs={6} sm={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="h5" color="info.main">
                {metrics.shippedOrders}
              </Typography>
              <Typography variant="body2">Shipped</Typography>
            </Paper>
          </Grid>
          
          {/* Completed Orders */}
          <Grid item xs={6} sm={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="h5" color="success.main">
                {metrics.completedOrders}
              </Typography>
              <Typography variant="body2">Completed</Typography>
            </Paper>
          </Grid>
          
          {/* Cancelled Orders */}
          <Grid item xs={6} sm={3}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="h5" color="error.main">
                {metrics.canceledOrders}
              </Typography>
              <Typography variant="body2">Cancelled</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Analytics Charts */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Analytics
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Sales Chart */}
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 3,
                height: 400,
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1">Sales & Revenue</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ height: 320 }}>
                {(() => {
                  try {
                    return <Line data={generateSalesChartData()} options={salesChartOptions} />;
                  } catch (error) {
                    console.error("Error rendering sales chart:", error);
                    return (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexDirection: 'column' 
                      }}>
                        <Typography color="text.secondary">
                          Chart could not be displayed
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1, borderRadius: 0 }}
                          onClick={() => window.location.reload()}
                        >
                          Reload
                        </Button>
                      </Box>
                    );
                  }
                })()}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Distribution */}
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3,
                height: 400,
                borderRadius: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Product Categories</Typography>
              <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  try {
                    return <Pie data={generateCategoryChartData()} options={categoryChartOptions} />;
                  } catch (error) {
                    console.error("Error rendering category chart:", error);
                    return (
                      <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexDirection: 'column' 
                      }}>
                        <Typography color="text.secondary">
                          Chart could not be displayed
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1, borderRadius: 0 }}
                          onClick={() => window.location.reload()}
                        >
                          Reload
                        </Button>
                      </Box>
                    );
                  }
                })()}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(event, newValue) => setActiveTab(newValue)} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderRadius: 0 }}
        >
          <Tab icon={<ShoppingBagIcon />} label="Products" />
          <Tab icon={<AssessmentIcon />} label="Orders" />
          <Tab icon={<StarIcon />} label="Reviews" />
          <Tab icon={<MessageIcon />} label="Messages" />
          <Tab icon={<SettingsIcon />} label="Shop Settings" />
        </Tabs>

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
              <TableContainer component={Paper} sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
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
              Order Management
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                sx={{ mr: 1, borderRadius: 0 }}
              >
                Refresh
              </Button>
              <Button 
                variant="contained" 
                startIcon={<BarChartIcon />}
                sx={{ borderRadius: 0 }}
              >
                Export Report
              </Button>
            </Box>
          </Box>
          
          {/* Order Filters and Search */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Search orders by ID or customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    sx: { borderRadius: 0 }
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    label="Status"
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="all">All Orders</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value)}
                    label="Sort By"
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="amountHigh">Amount: High to Low</MenuItem>
                    <MenuItem value="amountLow">Amount: Low to High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<FilterListIcon />}
                  sx={{ borderRadius: 0 }}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Order Status Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: `3px solid ${theme.palette.warning.main}`,
                  borderRadius: 0,
                  '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05) }
                }}
                onClick={() => setOrderFilter('pending')}
              >
                <Typography variant="h5" color="warning.main">
                  {metrics.pendingOrders}
                </Typography>
                <Typography variant="body2">Pending</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: `3px solid ${theme.palette.info.main}`,
                  borderRadius: 0,
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.05) }
                }}
                onClick={() => setOrderFilter('processing')}
              >
                <Typography variant="h5" color="info.main">
                  {metrics.pendingOrders + 2} {/* Sample data */}
                </Typography>
                <Typography variant="body2">Processing</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: `3px solid ${theme.palette.primary.main}`,
                  borderRadius: 0,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
                onClick={() => setOrderFilter('shipped')}
              >
                <Typography variant="h5" color="primary.main">
                  {metrics.shippedOrders}
                </Typography>
                <Typography variant="body2">Shipped</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: `3px solid ${theme.palette.success.main}`,
                  borderRadius: 0,
                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.05) }
                }}
                onClick={() => setOrderFilter('completed')}
              >
                <Typography variant="h5" color="success.main">
                  {metrics.completedOrders}
                </Typography>
                <Typography variant="body2">Completed</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  borderBottom: `3px solid ${theme.palette.error.main}`,
                  borderRadius: 0,
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) }
                }}
                onClick={() => setOrderFilter('cancelled')}
              >
                <Typography variant="h5" color="error.main">
                  {metrics.canceledOrders}
                </Typography>
                <Typography variant="body2">Cancelled</Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {orders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body1">
                You don't have any orders yet.
              </Typography>
            </Paper>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell align="center">Date</TableCell>
                      <TableCell align="center">Items</TableCell>
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            #{order.id.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 30, 
                                height: 30, 
                                mr: 1, 
                                bgcolor: theme.palette.primary.main,
                                borderRadius: 0
                              }}
                            >
                              {order.shippingAddress?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">
                                {order.shippingAddress?.name || 'Unknown Customer'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.shippingAddress?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {order.createdAt?.toDate?.() ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.createdAt?.toDate?.() ? new Date(order.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                            ${order.total?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={(order.status || 'pending').toUpperCase()} 
                            color={
                              order.status === 'completed' ? 'success' :
                              order.status === 'processing' ? 'info' :
                              order.status === 'shipped' ? 'primary' :
                              order.status === 'cancelled' ? 'error' : 'warning'
                            }
                            size="small"
                            sx={{ borderRadius: 0 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => navigate(`/seller/orders/${order.id}`)}
                              sx={{ mr: 1, borderRadius: 0 }}
                            >
                              View
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
                              onClick={() => navigate(`/seller/orders/${order.id}`)}
                              sx={{ borderRadius: 0 }}
                            >
                              {order.status === 'pending' ? 'Accept' :
                               order.status === 'processing' ? 'Ship' :
                               order.status === 'shipped' ? 'Complete' : 'Manage'}
                            </Button>
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
                sx={{ borderRadius: 0 }}
              />
            </>
          )}
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Customer Reviews
            </Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<StarIcon />}
                sx={{ borderRadius: 0 }}
              >
                Average Rating: {metrics.averageRating.toFixed(1)}
              </Button>
            </Box>
          </Box>
          
          {/* Reviews Summary */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" color="primary">
                    {metrics.averageRating.toFixed(1)}
                  </Typography>
                  <Rating value={metrics.averageRating} readOnly precision={0.5} size="large" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Based on {metrics.totalReviews} reviews
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>5 ★</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={85} 
                      sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.success.main
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ minWidth: 30 }}>85%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>4 ★</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={10} 
                      sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.success.main
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ minWidth: 30 }}>10%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>3 ★</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={3} 
                      sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.warning.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.warning.main
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ minWidth: 30 }}>3%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>2 ★</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={1} 
                      sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.error.main
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ minWidth: 30 }}>1%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 40 }}>1 ★</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={1} 
                      sx={{ 
                        flexGrow: 1, 
                        mx: 1, 
                        height: 8, 
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.error.main
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ minWidth: 30 }}>1%</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body1">
                You don't have any reviews yet.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ p: 0 }}>
              {reviews.map(review => (
                <Paper 
                  key={review.id} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    borderRadius: 0, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: review.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05)
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          mr: 2, 
                          bgcolor: review.read ? theme.palette.grey[400] : theme.palette.primary.main,
                          borderRadius: 0
                        }}
                      >
                        {review.customerName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {review.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {review.date.toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Chip 
                        label={review.productName} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ borderRadius: 0 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ ml: 7 }}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {review.comment}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      {!review.read && (
                        <Button 
                          size="small" 
                          sx={{ mr: 1, borderRadius: 0 }}
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button 
                        variant="contained" 
                        size="small"
                        sx={{ borderRadius: 0 }}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* Messages Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Customer Messages
            </Typography>
            <Box>
              <Badge 
                badgeContent={messages.filter(m => !m.read).length} 
                color="error" 
                sx={{ mr: 2 }}
              >
                <Button 
                  variant="outlined" 
                  startIcon={<MessageIcon />}
                  sx={{ borderRadius: 0 }}
                >
                  Unread Messages
                </Button>
              </Badge>
            </Box>
          </Box>
          
          {/* Messages List */}
          {messages.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body1">
                You don't have any messages yet.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map(message => (
                <Paper 
                  key={message.id} 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 0, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: message.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05)
                  }}
                >
                  <ListItem 
                    sx={{ 
                      p: 2, 
                      borderLeft: message.read ? 'none' : `4px solid ${theme.palette.primary.main}`
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%' }}>
                      <Avatar 
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          mr: 2, 
                          bgcolor: message.read ? theme.palette.grey[400] : theme.palette.primary.main,
                          borderRadius: 0
                        }}
                      >
                        {message.customerName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2">
                            {message.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.date.toLocaleDateString()} {message.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {message.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {message.message}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          {!message.read && (
                            <Button 
                              size="small" 
                              sx={{ mr: 1, borderRadius: 0 }}
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button 
                            variant="contained" 
                            size="small"
                            sx={{ borderRadius: 0 }}
                          >
                            Reply
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </TabPanel>
        
        {/* Shop Settings Tab */}
        <TabPanel value={activeTab} index={4}>
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
