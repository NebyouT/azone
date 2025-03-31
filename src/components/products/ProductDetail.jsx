import { useState, useEffect, useRef } from 'react';
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
  alpha,
  Card,
  CardMedia,
  CardContent,
  Tooltip,
  Stack,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
  Zoom,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  LocalShipping as LocalShippingIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { getProductById, getRelatedProducts } from '../../firebase/services';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency } from '../../utils/formatters';
import { getProductImageUrl, handleImageError } from '../../utils/imageUtils';
import TranslationWrapper from '../common/TranslationWrapper';
import ReviewSection from '../reviews/ReviewSection';
import { getReviewStatistics } from '../../firebase/reviewServices';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewStatsLoading, setReviewStatsLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        
        if (!productData) {
          setError('Product not found');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        
        // If product has variants, select the first one by default
        if (productData.variants && productData.variants.length > 0) {
          setSelectedVariant(productData.variants[0]);
        }
        
        // Fetch review statistics
        try {
          setReviewStatsLoading(true);
          const stats = await getReviewStatistics(id);
          setReviewStats(stats);
        } catch (err) {
          console.error('Error fetching review statistics:', err);
        } finally {
          setReviewStatsLoading(false);
        }
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
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
    addToCart(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigate('/checkout');
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

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((err) => console.error('Could not copy text: ', err));
    }
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleViewStore = () => {
    if (product?.seller?.id) {
      navigate(`/seller/${product.seller.id}`);
    } else if (product?.sellerId) {
      navigate(`/seller/${product.sellerId}`);
    } else {
      // If no seller ID is available, show a notification
      alert('Store information not available');
    }
  };

  const handleContactSeller = () => {
    setContactDialogOpen(true);
  };

  const handleSendMessage = async () => {
    try {
      // TODO: Implement sending message to seller
      // This would typically involve a Firebase function to store the message
      console.log('Sending message to seller:', contactMessage);
      
      // Close the dialog and reset the message
      setContactDialogOpen(false);
      setContactMessage('');
      
      // Show success notification
      alert('Message sent to seller');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
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
          <TranslationWrapper>Home</TranslationWrapper>
        </Link>
        <Link 
          color="inherit" 
          href="/products" 
          onClick={(e) => { e.preventDefault(); navigate('/products'); }}
        >
          <TranslationWrapper>Products</TranslationWrapper>
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
          <TranslationWrapper>Back</TranslationWrapper>
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <ProductImageGallery images={product.images || [product.imageUrl]} name={product.name} />
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Product Title */}
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom 
              fontWeight="bold"
              sx={{ 
                lineHeight: 1.3,
                color: theme.palette.text.primary
              }}
            >
              {product.name}
            </Typography>
            
            {/* Rating and sold count */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <Rating 
                  value={reviewStats?.averageRating || product.rating || 0} 
                  precision={0.5} 
                  readOnly 
                  size="small"
                  sx={{ mr: 1, color: theme.palette.warning.main }}
                />
                <Typography 
                  variant="body2" 
                  component={Link} 
                  to="#reviews" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('reviews-section').scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ 
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {reviewStatsLoading ? (
                    <Skeleton width={60} />
                  ) : (
                    `${reviewStats?.averageRating.toFixed(1) || '0.0'} (${reviewStats?.totalReviews || 0} ${t('reviews')})`
                  )}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              
              <Typography variant="body2" color="text.secondary">
                {product.soldCount || 0} {t('sold')}
              </Typography>
            </Box>
            
            {/* Price */}
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography 
                  variant="h4" 
                  component="span" 
                  color="error.main" 
                  fontWeight="bold"
                  sx={{ mr: 1 }}
                >
                  {formatCurrency(discountedPrice)}
                </Typography>
                {product.discount > 0 && (
                  <Typography 
                    variant="body1" 
                    component="span" 
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through', mr: 1 }}
                  >
                    {formatCurrency(product.price)}
                  </Typography>
                )}
                {product.discount > 0 && (
                  <Chip 
                    label={`-${product.discount}%`} 
                    size="small" 
                    color="error"
                    sx={{ fontWeight: 'bold', height: 24 }}
                  />
                )}
              </Box>
              
              {/* Stock Status */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {product.stock > 10 
                    ? <TranslationWrapper translationKey="inStock">In Stock</TranslationWrapper> 
                    : product.stock > 0 
                      ? <><TranslationWrapper translationKey="onlyLeft">Only</TranslationWrapper> {product.stock} <TranslationWrapper translationKey="items">items</TranslationWrapper> left</> 
                      : <TranslationWrapper translationKey="outOfStock">Out of Stock</TranslationWrapper>}
                </Typography>
              </Box>
            </Box>
            
            {/* Short Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {product.shortDescription || product.description?.substring(0, 150) + '...'}
              </Typography>
            </Box>
            
            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <ProductVariantSelector 
                variants={product.variants} 
                onVariantChange={handleVariantChange}
              />
            )}
            
            {/* Shipping Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                <TranslationWrapper>shipping</TranslationWrapper>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  <TranslationWrapper>freeShipping</TranslationWrapper> • <TranslationWrapper>estimatedDelivery</TranslationWrapper>: 3-7 <TranslationWrapper>days</TranslationWrapper>
                </Typography>
              </Box>
            </Box>
            
            {/* Quantity & Add to Cart */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                <TranslationWrapper>quantity</TranslationWrapper>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  onClick={handleDecreaseQuantity} 
                  disabled={quantity <= 1}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '4px 0 0 4px',
                    p: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                  sx={{ 
                    width: 60,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      '& fieldset': {
                        borderLeft: 'none',
                        borderRight: 'none',
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      py: 1,
                      px: 0
                    }
                  }}
                />
                <IconButton 
                  onClick={handleIncreaseQuantity}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '0 4px 4px 0',
                    p: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {product.stock} <TranslationWrapper>available</TranslationWrapper>
                </Typography>
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                color="error"
                size="large"
                fullWidth
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                sx={{ 
                  py: 1.5,
                  fontWeight: 'bold',
                  borderRadius: 1,
                  boxShadow: 2
                }}
              >
                <TranslationWrapper>buyNow</TranslationWrapper>
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                size="large"
                fullWidth
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                sx={{ 
                  py: 1.5,
                  borderRadius: 1,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderColor: theme.palette.primary.dark
                  }
                }}
              >
                <TranslationWrapper>addToCart</TranslationWrapper>
              </Button>
            </Box>
            
            {/* Wishlist and Share */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="text"
                startIcon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                onClick={handleToggleFavorite}
                sx={{ 
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <TranslationWrapper>addToWishlist</TranslationWrapper>
              </Button>
              <Button
                variant="text"
                startIcon={<ShareIcon />}
                onClick={handleShareProduct}
                sx={{ 
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <TranslationWrapper>share</TranslationWrapper>
              </Button>
            </Box>
            
            {/* Seller Info */}
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  src={product.seller?.avatar || ""}
                  alt={product.seller?.name || "Seller"}
                  sx={{ width: 40, height: 40, mr: 1.5 }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {product.seller?.name || "Azone Official Store"}
                    </Typography>
                    <VerifiedIcon 
                      fontSize="small" 
                      color="primary" 
                      sx={{ ml: 0.5 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    <TranslationWrapper>officialStore</TranslationWrapper> • {product.seller?.rating || 4.9} <TranslationWrapper>rating</TranslationWrapper>
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleViewStore}
                  sx={{ 
                    borderRadius: 1,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <TranslationWrapper>viewStore</TranslationWrapper>
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleContactSeller}
                  sx={{ 
                    borderRadius: 1,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <TranslationWrapper>contactSeller</TranslationWrapper>
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* Product Details Tabs */}
      <Box sx={{ mt: 4 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                fontWeight: 'bold',
                textTransform: 'none',
                minWidth: 120,
              },
            }}
          >
            <Tab label={<TranslationWrapper translationKey="description">Description</TranslationWrapper>} />
            <Tab label={<TranslationWrapper translationKey="specifications">Specifications</TranslationWrapper>} />
            <Tab label={<><TranslationWrapper translationKey="reviews">Reviews</TranslationWrapper> ({reviewStats?.totalReviews || 0})</>} />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <TranslationWrapper>productDescription</TranslationWrapper>
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {product.description}
                </Typography>
                
                {/* Product Images in Description */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {product.images?.map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`${product.name} detail ${index + 1}`}
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto',
                        borderRadius: '4px'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <TranslationWrapper>productSpecifications</TranslationWrapper>
                </Typography>
                <List>
                  {Object.entries(product.specifications || {
                    Brand: product.brand || 'Azone',
                    Model: product.model || 'Standard',
                    Material: product.material || 'Premium',
                    Weight: product.weight ? `${product.weight} kg` : '0.5 kg',
                    Dimensions: product.dimensions || '30 x 20 x 10 cm',
                    Warranty: product.warranty || '12 months'
                  }).map(([key, value]) => (
                    <ListItem 
                      key={key}
                      sx={{ 
                        py: 1,
                        px: 0,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                      }}
                    >
                      <Grid container>
                        <Grid item xs={4} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            {key}
                          </Typography>
                        </Grid>
                        <Grid item xs={8} sm={9}>
                          <Typography variant="body2">
                            {value}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <TranslationWrapper>customerReviews</TranslationWrapper>
                </Typography>
                
                {/* Review Summary */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 3,
                  mb: 3,
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {reviewStats?.averageRating || 0}
                    </Typography>
                    <Rating 
                      value={reviewStats?.averageRating || 0} 
                      precision={0.5} 
                      readOnly 
                      sx={{ color: theme.palette.warning.main, mt: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {reviewStats?.totalReviews || 0} <TranslationWrapper>reviews</TranslationWrapper>
                    </Typography>
                  </Box>
                  
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                  <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      <TranslationWrapper>ratingBreakdown</TranslationWrapper>
                    </Typography>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <Box 
                        key={star}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mb: 0.5
                        }}
                      >
                        <Typography variant="body2" sx={{ minWidth: 20 }}>
                          {star}
                        </Typography>
                        <StarIcon 
                          fontSize="small" 
                          sx={{ 
                            color: theme.palette.warning.main,
                            mr: 1
                          }} 
                        />
                        <Box 
                          sx={{ 
                            flexGrow: 1, 
                            bgcolor: alpha(theme.palette.divider, 0.5),
                            height: 8,
                            borderRadius: 4,
                            mr: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%`,
                              bgcolor: theme.palette.warning.main,
                              height: '100%'
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                {/* Reviews List - Placeholder */}
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    <TranslationWrapper>customerFeedback</TranslationWrapper>
                  </Typography>
                  
                  {/* Sample reviews - in a real app, these would come from the database */}
                  {[1, 2, 3].map((review) => (
                    <Box 
                      key={review}
                      sx={{ 
                        mb: 3,
                        pb: 3,
                        borderBottom: review < 3 ? `1px solid ${theme.palette.divider}` : 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 1.5,
                            bgcolor: theme.palette.primary.main
                          }}
                        >
                          {['JD', 'SM', 'AK'][review - 1]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {['John Doe', 'Sarah Miller', 'Alex Kim'][review - 1]}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Rating 
                              value={[5, 4, 5][review - 1]} 
                              size="small" 
                              readOnly 
                              sx={{ color: theme.palette.warning.main }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {['2 weeks ago', '1 month ago', '3 days ago'][review - 1]}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {[
                          'Great product! Exactly as described and arrived quickly. The quality is excellent and I would definitely buy from this seller again.',
                          'Good value for money. The product is nice but slightly different from the pictures. Overall satisfied with my purchase.',
                          'Excellent quality and fast shipping. The seller was very responsive to my questions. Highly recommended!'
                        ][review - 1]}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      mt: 2,
                      borderRadius: 1,
                      textTransform: 'none'
                    }}
                  >
                    <TranslationWrapper>viewAllReviews</TranslationWrapper>
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Product description */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          {t('productDescription')}
        </Typography>
        <Typography variant="body1">
          {product.description}
        </Typography>
      </Box>
      
      {/* Reviews Section */}
      <Box id="reviews-section">
        <ReviewSection productId={id} />
      </Box>
      
      {/* Related Products */}
      <RelatedProducts categoryId={product.category} currentProductId={id} />

      {/* Contact Seller Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            <TranslationWrapper>contactSeller</TranslationWrapper>: {product.seller?.name || "Seller"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <TranslationWrapper>contactSellerDescription</TranslationWrapper>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t('message')}
            type="text"
            fullWidth
            multiline
            rows={4}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder={t('enterYourMessage')}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setContactDialogOpen(false)} 
            color="inherit"
          >
            <TranslationWrapper>cancel</TranslationWrapper>
          </Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            color="primary"
            disabled={!contactMessage.trim()}
          >
            <TranslationWrapper>send</TranslationWrapper>
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Product Image Gallery component
const ProductImageGallery = ({ images, name }) => {
  const theme = useTheme();
  const [mainImage, setMainImage] = useState(images?.[0] || '');
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const imageContainerRef = useRef(null);

  const handleThumbnailClick = (image) => {
    setMainImage(image);
  };

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setShowZoom(true);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
      {/* Thumbnails */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'row', sm: 'column' },
        gap: 1,
        order: { xs: 2, sm: 1 },
        overflowX: { xs: 'auto', sm: 'visible' },
        overflowY: { xs: 'visible', sm: 'auto' },
        maxHeight: { sm: '500px' },
        py: 1
      }}>
        {images?.map((image, index) => (
          <Box
            key={index}
            onClick={() => handleThumbnailClick(image)}
            sx={{
              width: { xs: 60, sm: 80 },
              height: { xs: 60, sm: 80 },
              flexShrink: 0,
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              border: mainImage === image ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <img
              src={image}
              alt={`${name} - view ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ))}
      </Box>

      {/* Main Image */}
      <Box 
        ref={imageContainerRef}
        sx={{ 
          position: 'relative',
          width: '100%',
          height: { xs: 300, sm: 400, md: 500 },
          overflow: 'hidden',
          borderRadius: 1,
          order: { xs: 1, sm: 2 },
          flexGrow: 1,
          border: `1px solid ${theme.palette.divider}`,
          cursor: 'zoom-in',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={mainImage || images?.[0]}
          alt={name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            display: 'block'
          }}
        />
        
        {/* Zoom overlay */}
        {showZoom && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${mainImage || images?.[0]})`,
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundSize: '200%',
              backgroundRepeat: 'no-repeat',
              opacity: 0.9,
              zIndex: 1,
            }}
          />
        )}
        
        <Tooltip title={<TranslationWrapper>Hover to zoom</TranslationWrapper>}>
          <ZoomInIcon 
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8, 
              color: 'rgba(255,255,255,0.8)',
              bgcolor: 'rgba(0,0,0,0.3)',
              borderRadius: '50%',
              p: 0.5,
              fontSize: 30
            }} 
          />
        </Tooltip>
      </Box>
    </Box>
  );
};

// Product Color and Size Selector component
const ProductVariantSelector = ({ variants, onVariantChange }) => {
  const theme = useTheme();
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  
  const colors = [...new Set(variants?.map(v => v.color) || [])];
  const sizes = [...new Set(variants?.filter(v => !selectedColor || v.color === selectedColor).map(v => v.size) || [])];
  
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [colors]);
  
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedColor]);
  
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = variants?.find(v => v.color === selectedColor && v.size === selectedSize);
      if (variant) {
        onVariantChange(variant);
      }
    }
  }, [selectedColor, selectedSize, variants, onVariantChange]);
  
  return (
    <Box sx={{ mb: 3 }}>
      {colors.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            <TranslationWrapper>Color</TranslationWrapper>:
            {selectedColor && (
              <Typography component="span" color="text.secondary" sx={{ ml: 1, fontWeight: 'normal' }}>
                {selectedColor}
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {colors.map((color) => (
              <Box
                key={color}
                onClick={() => setSelectedColor(color)}
                sx={{
                  border: `2px solid ${selectedColor === color ? theme.palette.primary.main : 'transparent'}`,
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  width: 60,
                  height: 60,
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: color ? color.toLowerCase() : '#cccccc',
                    color: color ? theme.palette.getContrastText(color.toLowerCase()) : '#000000',
                    p: 1,
                  }}
                >
                  {color}
                </Box>
                {selectedColor === color && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      color: theme.palette.primary.main,
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      fontSize: 16,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
      
      {sizes.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            <TranslationWrapper>Size</TranslationWrapper>:
            {selectedSize && (
              <Typography component="span" color="text.secondary" sx={{ ml: 1, fontWeight: 'normal' }}>
                {selectedSize}
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sizes.map((size) => (
              <Box
                key={size}
                onClick={() => setSelectedSize(size)}
                sx={{
                  border: `2px solid ${selectedSize === size ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 1,
                  padding: '6px 16px',
                  cursor: 'pointer',
                  position: 'relative',
                  minWidth: 50,
                  textAlign: 'center',
                  bgcolor: selectedSize === size ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Typography variant="body2">{size}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Related Products component
const RelatedProducts = ({ categoryId, currentProductId }) => {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const relatedProducts = await getRelatedProducts(categoryId, currentProductId, 10);
        setProducts(relatedProducts);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId && currentProductId) {
      fetchRelatedProducts();
    }
  }, [categoryId, currentProductId]);
  
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <TranslationWrapper>Related Products</TranslationWrapper>
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Box key={item} sx={{ minWidth: 180, maxWidth: 180 }}>
              <Skeleton variant="rectangular" width={180} height={180} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
  
  if (products.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        <TranslationWrapper>Related Products</TranslationWrapper>
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {products.map((product) => (
          <Card 
            key={product.id} 
            sx={{ 
              minWidth: 180, 
              maxWidth: 180, 
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
              borderRadius: 1,
            }}
            onClick={() => handleProductClick(product.id)}
          >
            <CardMedia
              component="img"
              height="180"
              image={getProductImageUrl(product)}
              alt={product.name}
              onError={(e) => handleImageError(e)}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" noWrap title={product.name}>
                {product.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                  {formatCurrency(product.discount > 0 
                    ? ((product.price * (100 - product.discount)) / 100)
                    : product.price
                  )}
                </Typography>
                {product.discount > 0 && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ ml: 1, textDecoration: 'line-through' }}
                  >
                    {formatCurrency(product.price)}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ProductDetail;
