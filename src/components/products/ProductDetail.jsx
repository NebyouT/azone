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
  Link,
  useTheme,
  useMediaQuery,
  alpha
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh',
        my: 4 
      }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          textAlign: 'center', 
          my: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.error.main, 0.1)
        }}>
          <Typography color="error" variant="h6">{error || "Product not found"}</Typography>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
            sx={{ 
              mt: 2,
              background: theme.palette.primary.gradient,
              '&:hover': {
                background: theme.palette.primary.gradientDark,
              }
            }}
            variant="contained"
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
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

      {/* Mobile Back Button */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleGoBack}
          size="small"
          sx={{ mb: 1 }}
        >
          Back
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 1, sm: 2 }, 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              boxShadow: theme.shadows[3],
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.01)',
              }
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
                  background: theme.palette.secondary.gradient,
                  color: '#fff',
                }}
              />
            )}
            <Box sx={{ 
              width: '100%', 
              height: { xs: '250px', sm: '300px', md: '400px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/500x500?text=No+Image'} 
                alt={product.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  transition: 'transform 0.3s ease'
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            boxShadow: theme.shadows[1],
            height: '100%'
          }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              {product.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating 
                value={product.rating || 0} 
                precision={0.5} 
                readOnly 
                size={isMobile ? "small" : "medium"}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({product.reviewCount || 0} reviews)
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {product.discount > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 'bold', 
                      mr: 2,
                      background: theme.palette.primary.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ${discountedPrice}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    ${product.price.toFixed(2)}
                  </Typography>
                </Box>
              ) : (
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  sx={{ 
                    fontWeight: 'bold',
                    background: theme.palette.primary.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ${product.price.toFixed(2)}
                </Typography>
              )}
            </Box>
            
            <Typography 
              variant="body1" 
              paragraph
              sx={{ 
                mb: 3,
                maxHeight: { xs: '100px', sm: '150px', md: 'none' },
                overflow: { xs: 'auto', md: 'visible' },
              }}
            >
              {product.description}
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={product.inStock ? 'In Stock' : 'Out of Stock'} 
                color={product.inStock ? 'success' : 'error'}
                sx={{ mr: 1 }}
              />
              <Chip 
                label={product.category} 
                sx={{ 
                  mr: 1,
                  background: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                }} 
                variant="outlined"
              />
              {product.tags && product.tags.map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  variant="outlined" 
                  size={isMobile ? "small" : "medium"}
                  sx={{ mr: 1, mb: { xs: 1, sm: 0 } }} 
                />
              ))}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quantity:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  onClick={handleDecreaseQuantity} 
                  disabled={quantity <= 1}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  sx={{ width: '70px', mx: 1 }}
                  size={isMobile ? "small" : "medium"}
                />
                <IconButton 
                  onClick={handleIncreaseQuantity}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? "medium" : "large"}
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                disabled={!product.inStock}
                fullWidth
                sx={{ 
                  background: theme.palette.primary.gradient,
                  '&:hover': {
                    background: theme.palette.primary.gradientDark,
                  },
                  py: { xs: 1.5, sm: 2 }
                }}
              >
                Add to Cart
              </Button>
              <IconButton 
                color={isFavorite ? 'error' : 'default'} 
                onClick={handleToggleFavorite}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  width: { xs: '100%', sm: 'auto' },
                  height: { xs: 48, sm: 'auto' },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Product Details Tabs */}
      <Box sx={{ mt: { xs: 4, md: 6 } }}>
        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: { xs: 'auto', sm: 160 },
                py: { xs: 1.5, sm: 2 },
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 'bold',
              },
              '& .MuiTabs-indicator': {
                background: theme.palette.primary.gradient,
              }
            }}
          >
            <Tab label="Description" />
            <Tab label="Specifications" />
            <Tab label="Reviews" />
            <Tab label="Shipping & Returns" />
          </Tabs>
          
          <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '200px' }}>
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
                          <Typography variant="body2" sx={{ fontWeight: 'bold', width: { xs: '50%', sm: '40%' } }}>
                            {key}:
                          </Typography>
                          <Typography variant="body2" sx={{ width: { xs: '50%', sm: '60%' } }}>
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
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 3,
                        p: 2,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 1 }}>
                          {review.userName}
                        </Typography>
                        <Rating value={review.rating} size="small" readOnly />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', mt: { xs: 1, sm: 0 } }}>
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
                </Typography>
                <Typography paragraph>
                  Delivery times vary depending on your location, but typically range from 3-7 business days after shipping.
                </Typography>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Return Policy</Typography>
                <Typography paragraph>
                  If you're not completely satisfied with your purchase, you can return it within 30 days for a full refund.
                </Typography>
                <Typography>
                  Items must be unused and in their original packaging. Please contact our customer service team to initiate a return.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProductDetail;
