import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Divider,
  Rating,
  Chip,
  CircularProgress,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { getProductById } from '../../firebase/services';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
        setError(null);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement wishlist functionality with Firebase
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography color="error">{error || "Product not found"}</Typography>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  const discountedPrice = product.discount > 0 
    ? ((product.price * (100 - product.discount)) / 100).toFixed(2)
    : product.price.toFixed(2);

  return (
    <Container sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Home
        </Link>
        <Link 
          color="inherit" 
          href="/products" 
          onClick={(e) => { e.preventDefault(); navigate('/products'); }}
        >
          Products
        </Link>
        <Link 
          color="inherit" 
          href={`/products?category=${product.category}`} 
          onClick={(e) => { e.preventDefault(); navigate(`/products?category=${product.category}`); }}
        >
          {product.category}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {product.discount > 0 && (
              <Chip
                label={`${product.discount}% OFF`}
                color="error"
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  fontWeight: 'bold',
                }}
              />
            )}
            <img 
              src={product.imageUrl || 'https://via.placeholder.com/500x500?text=No+Image'} 
              alt={product.name}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          </Paper>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating 
              value={product.rating || 0} 
              precision={0.5} 
              readOnly 
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({product.reviewCount || 0} reviews)
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {product.discount > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mr: 2 }}>
                  ${discountedPrice}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  ${product.price.toFixed(2)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                ${product.price.toFixed(2)}
              </Typography>
            )}
          </Box>
          
          <Typography variant="body1" paragraph>
            {product.description}
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={product.inStock ? 'In Stock' : 'Out of Stock'} 
              color={product.inStock ? 'success' : 'error'}
              sx={{ mr: 1 }}
            />
            <Chip label={product.category} sx={{ mr: 1 }} />
            {product.tags && product.tags.map(tag => (
              <Chip key={tag} label={tag} variant="outlined" sx={{ mr: 1 }} />
            ))}
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Quantity:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleDecreaseQuantity} disabled={quantity <= 1}>
                <RemoveIcon />
              </IconButton>
              <TextField
                value={quantity}
                onChange={handleQuantityChange}
                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                sx={{ width: '70px', mx: 1 }}
              />
              <IconButton onClick={handleIncreaseQuantity}>
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={!product.inStock}
              fullWidth
            >
              Add to Cart
            </Button>
            <IconButton 
              color={isFavorite ? 'error' : 'default'} 
              onClick={handleToggleFavorite}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Product Details Tabs */}
      <Box sx={{ mt: 6 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Description" />
          <Tab label="Specifications" />
          <Tab label="Reviews" />
          <Tab label="Shipping & Returns" />
        </Tabs>
        
        <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderTop: 0, minHeight: '200px' }}>
          {activeTab === 0 && (
            <Typography>
              {product.fullDescription || product.description}
            </Typography>
          )}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Product Specifications</Typography>
              {product.specifications ? (
                <Grid container spacing={2}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', width: '40%' }}>
                          {key}:
                        </Typography>
                        <Typography variant="body2" sx={{ width: '60%' }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography>No specifications available for this product.</Typography>
              )}
            </Box>
          )}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Customer Reviews</Typography>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {review.userName}
                      </Typography>
                      <Rating value={review.rating} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {new Date(review.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{review.comment}</Typography>
                    {index < product.reviews.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))
              ) : (
                <Typography>No reviews yet. Be the first to review this product!</Typography>
              )}
            </Box>
          )}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Shipping Information</Typography>
              <Typography paragraph>
                We offer free standard shipping on all orders over $50. Orders typically ship within 1-2 business days.
                Delivery times vary depending on your location, but typically range from 3-7 business days.
              </Typography>
              
              <Typography variant="h6" gutterBottom>Return Policy</Typography>
              <Typography>
                We accept returns within 30 days of delivery. Items must be unused and in their original packaging.
                Please contact our customer service team to initiate a return.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetail;
