import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { addProduct, getProductById, updateProduct } from '../../firebase/services';

const categories = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Beauty',
  'Books',
  'Toys',
  'Sports',
  'Automotive',
  'Health',
  'Grocery'
];

const ProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller } = useAuth();
  const isEditMode = !!productId;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
    quantity: '',
    discount: '0',
    tags: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Redirect if not a seller
    if (currentUser && userDetails && !isSeller) {
      navigate('/');
    }
  }, [currentUser, userDetails, isSeller, navigate]);
  
  useEffect(() => {
    // If in edit mode, fetch the product data
    if (isEditMode && productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const product = await getProductById(productId);
          
          // Check if the product belongs to this seller
          if (product.sellerId !== currentUser?.uid) {
            setError("You don't have permission to edit this product");
            navigate('/seller/dashboard');
            return;
          }
          
          setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            category: product.category || '',
            inStock: product.inStock ?? true,
            quantity: product.quantity?.toString() || '',
            discount: product.discount?.toString() || '0',
            tags: product.tags?.join(', ') || ''
          });
          
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
          
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product details");
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [isEditMode, productId, currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({ 
        ...prev, 
        image: 'Please upload a valid image file (JPEG, PNG, or WebP)' 
      }));
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ 
        ...prev, 
        image: 'Image size should be less than 5MB' 
      }));
      return;
    }
    
    setImageFile(file);
    setFormErrors(prev => ({ ...prev, image: '' }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (formData.quantity && (isNaN(formData.quantity) || parseInt(formData.quantity) < 0)) {
      errors.quantity = 'Quantity must be a non-negative number';
    }
    
    if (formData.discount && (isNaN(formData.discount) || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
      errors.discount = 'Discount must be between 0 and 100';
    }
    
    if (!isEditMode && !imageFile && !imagePreview) {
      errors.image = 'Product image is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        inStock: formData.inStock,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        imageUrl: imagePreview // Keep existing image URL if no new image is uploaded
      };
      
      if (isEditMode) {
        // Update existing product
        await updateProduct(productId, productData, imageFile);
        navigate('/seller/dashboard');
      } else {
        // Add new product
        const newProductId = await addProduct(productData, imageFile);
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/seller/dashboard');
  };
  
  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* Left Column - Product Details */}
            <Grid item xs={12} md={8}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="description"
                label="Product Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="price"
                    label="Price"
                    name="price"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    value={formData.price}
                    onChange={handleChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="discount"
                    label="Discount (%)"
                    name="discount"
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    value={formData.discount}
                    onChange={handleChange}
                    error={!!formErrors.discount}
                    helperText={formErrors.discount}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    margin="normal"
                    error={!!formErrors.category}
                  >
                    <InputLabel id="category-label">Category *</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={formData.category}
                      label="Category *"
                      onChange={handleChange}
                    >
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.category && (
                      <FormHelperText>{formErrors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="quantity"
                    label="Quantity in Stock"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity}
                  />
                </Grid>
              </Grid>
              
              <TextField
                margin="normal"
                fullWidth
                id="tags"
                label="Tags (comma separated)"
                name="tags"
                placeholder="e.g. new, featured, sale"
                value={formData.tags}
                onChange={handleChange}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.inStock}
                    onChange={handleChange}
                    name="inStock"
                    color="primary"
                  />
                }
                label="In Stock"
                sx={{ mt: 2 }}
              />
            </Grid>
            
            {/* Right Column - Image Upload */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Product Image
                </Typography>
                
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 200, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: theme => `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Product preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No image selected
                    </Typography>
                  )}
                </Box>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                
                {formErrors.image && (
                  <FormHelperText error>{formErrors.image}</FormHelperText>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Supported formats: JPEG, PNG, WebP. Max size: 5MB
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Product' : 'Add Product')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductForm;
