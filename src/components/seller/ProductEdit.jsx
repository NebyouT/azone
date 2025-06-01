import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadImage } from '../../cloudinary/services';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  AttachMoney as AttachMoneyIcon,
  Info as InfoIcon,
  Flag as FlagIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getProductById, updateProduct, getProductFlags } from '../../firebase/services';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-edit-tabpanel-${index}`}
      aria-labelledby={`product-edit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProductEdit = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flagInfo, setFlagInfo] = useState(null);
  const [flagInfoLoading, setFlagInfoLoading] = useState(false);
  
  // Form state for quick edit
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    quantity: '',
    inStock: true,
    inactiveReason: '',
    description: '',
    hasLimitedTimeOffer: false,
    discount: '',
    discountEndDate: null,
    lowStockAlert: false,
    lowStockThreshold: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Image state
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Load product data and check for flags
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setFlagInfoLoading(true);
        
        const productData = await getProductById(productId);
        
        if (!productData) {
          setError('Product not found');
          return;
        }
        
        if (productData.sellerId !== currentUser.uid) {
          setError('You do not have permission to edit this product');
          return;
        }
        
        setProduct(productData);
        setProductData({
          name: productData.name || '',
          price: productData.price || '',
          quantity: productData.quantity || '',
          inStock: productData.inStock !== undefined ? productData.inStock : true,
          inactiveReason: productData.inactiveReason || '',
          description: productData.description || '',
          hasLimitedTimeOffer: productData.hasLimitedTimeOffer || false,
          discount: productData.discount || '',
          discountEndDate: productData.discountEndDate ? new Date(productData.discountEndDate) : null,
          lowStockAlert: productData.lowStockAlert || false,
          lowStockThreshold: productData.lowStockThreshold || ''
        });
        
        setImagePreview(productData.imageUrl || '');
        
        // Check if product is flagged
        try {
          const flags = await getProductFlags(productId);
          if (flags && flags.length > 0) {
            // Get most recent flag
            const latestFlag = flags.sort((a, b) => b.createdAt - a.createdAt)[0];
            setFlagInfo(latestFlag);
            
            // If product is deactivated by admin, update local state
            if (latestFlag.deactivated) {
              setProductData(prev => ({
                ...prev,
                inStock: false,
                inactiveReason: `Flagged by admin: ${latestFlag.issues.join(', ')}`
              }));
            }
          }
        } catch (flagErr) {
          console.error('Error fetching flag information:', flagErr);
          // Don't block the product editing if flag info fails
        } finally {
          setFlagInfoLoading(false);
        }
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId && currentUser) {
      fetchProduct();
    }
  }, [productId, currentUser]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!productData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!productData.price || isNaN(productData.price) || parseFloat(productData.price) <= 0) {
      errors.price = 'Valid price is required';
    }
    
    if (productData.quantity && (isNaN(productData.quantity) || parseInt(productData.quantity) < 0)) {
      errors.quantity = 'Quantity must be a non-negative number';
    }
    
    if (!productData.inStock && !productData.inactiveReason.trim()) {
      errors.inactiveReason = 'Please provide a reason why the product is inactive';
    }
    
    if (productData.hasLimitedTimeOffer) {
      if (!productData.discount || isNaN(productData.discount) || parseFloat(productData.discount) <= 0) {
        errors.discount = 'Valid discount is required for limited time offers';
      }
      
      if (!productData.discountEndDate) {
        errors.discountEndDate = 'Please select an end date for the limited time offer';
      }
    }
    
    if (productData.lowStockAlert && (!productData.lowStockThreshold || isNaN(productData.lowStockThreshold) || parseInt(productData.lowStockThreshold) < 1)) {
      errors.lowStockThreshold = 'Low stock threshold must be a positive number';
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSaveLoading(true);
    setError('');
    
    try {
      // Prepare product data update
      const updatedProductData = {
        ...product,
        name: productData.name,
        price: parseFloat(productData.price),
        quantity: productData.quantity ? parseInt(productData.quantity) : product.quantity,
        inStock: productData.inStock,
        inactiveReason: !productData.inStock ? productData.inactiveReason : '',
        description: productData.description,
        hasLimitedTimeOffer: productData.hasLimitedTimeOffer,
        discount: productData.hasLimitedTimeOffer ? parseFloat(productData.discount) : 0,
        discountEndDate: productData.hasLimitedTimeOffer && productData.discountEndDate ? productData.discountEndDate.toISOString() : null,
        lowStockAlert: productData.lowStockAlert,
        lowStockThreshold: productData.lowStockAlert ? parseInt(productData.lowStockThreshold) : null,
      };
      
      await updateProduct(productId, updatedProductData, imageFile);
      setSaveSuccess(true);
      
      // Auto navigate back after 1.5 seconds
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 1500);
    } catch (err) {
      console.error("Error updating product:", err);
      setError(err.message || "Failed to update product. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/seller/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Edit Product
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/seller/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Product updated successfully! Redirecting...
          </Alert>
        )}
        
        {flagInfo && flagInfo.deactivated && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            icon={<FlagIcon />}
          >
            <Typography variant="subtitle2" gutterBottom>
              This product has been flagged and deactivated by {flagInfo.createdBy || 'an administrator'}
            </Typography>
            {flagInfo.issues && flagInfo.issues.length > 0 && (
              <List dense disablePadding>
                {flagInfo.issues.map((issue, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ErrorIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={issue} />  
                  </ListItem>
                ))}
              </List>
            )}
            {flagInfo.notes && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Admin notes: {flagInfo.notes}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Flagged on: {new Date(flagInfo.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              To resolve these issues and reactivate your product, please make the necessary changes and contact support.
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={flagInfo && flagInfo.deactivated ? <Badge color="error" variant="dot"><InfoIcon /></Badge> : <InfoIcon />} 
              iconPosition="start" 
              label="Basic Info" 
            />
            <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventory" />
            <Tab icon={<AttachMoneyIcon />} iconPosition="start" label="Pricing" />
            <Tab icon={<ImageIcon />} iconPosition="start" label="Image" />
          </Tabs>
        </Box>
        
        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={productData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product Description"
                  name="description"
                  value={productData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={productData.inStock}
                      onChange={handleChange}
                      name="inStock"
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {productData.inStock ? (
                        <>
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          <Typography>Product Active</Typography>
                        </>
                      ) : (
                        <>
                          <CancelIcon color="error" sx={{ mr: 1 }} />
                          <Typography>Product Inactive</Typography>
                        </>
                      )}
                    </Box>
                  }
                />
              </Grid>
              
              {!productData.inStock && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Inactivation"
                    name="inactiveReason"
                    value={productData.inactiveReason}
                    onChange={handleChange}
                    error={!!formErrors.inactiveReason}
                    helperText={formErrors.inactiveReason || "Please explain why this product is inactive (e.g., out of stock, seasonal product, discontinued)"}
                    required
                  />
                </Grid>
              )}
            </Grid>
          </TabPanel>
          
          {/* Inventory Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  name="quantity"
                  type="number"
                  value={productData.quantity}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">units</InputAdornment>,
                  }}
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productData.lowStockAlert}
                        onChange={handleChange}
                        name="lowStockAlert"
                        color="primary"
                      />
                    }
                    label="Enable Low Stock Alerts"
                  />
                  
                  {productData.lowStockAlert && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Low Stock Threshold"
                        name="lowStockThreshold"
                        type="number"
                        value={productData.lowStockThreshold}
                        onChange={handleChange}
                        error={!!formErrors.lowStockThreshold}
                        helperText={formErrors.lowStockThreshold || "You'll be alerted when stock falls below this number"}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Pricing Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={productData.price}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productData.hasLimitedTimeOffer}
                        onChange={handleChange}
                        name="hasLimitedTimeOffer"
                        color="primary"
                      />
                    }
                    label="Limited Time Offer / Discount"
                  />
                  
                  {productData.hasLimitedTimeOffer && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Discount Amount"
                          name="discount"
                          type="number"
                          value={productData.discount}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          error={!!formErrors.discount}
                          helperText={formErrors.discount}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Discount End Date"
                          name="discountEndDate"
                          type="date"
                          value={productData.discountEndDate ? productData.discountEndDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            setProductData(prev => ({
                              ...prev,
                              discountEndDate: e.target.value ? new Date(e.target.value) : null
                            }));
                          }}
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.discountEndDate}
                          helperText={formErrors.discountEndDate}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Image Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Product Image
                  </Typography>
                  <Paper 
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      mb: 2, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No image
                      </Typography>
                    )}
                  </Paper>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<EditIcon />}
                  >
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saveLoading}
              sx={{ minWidth: 150 }}
            >
              {saveLoading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ProductEdit;
