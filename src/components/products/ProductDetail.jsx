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
  ZoomIn as ZoomInIcon,
  Store as StoreIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { getProductById, getRelatedProducts, getShopSettings } from '../../firebase/services';
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
  const [sellerInfo, setSellerInfo] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  
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
        
        // Fetch seller information if sellerId exists
        if (productData.sellerId) {
          try {
            setSellerLoading(true);
            const shopSettings = await getShopSettings(productData.sellerId);
            setSellerInfo(shopSettings);
          } catch (err) {
            console.error('Error fetching seller information:', err);
          } finally {
            setSellerLoading(false);
          }
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
      navigate(`/store/${product.seller.id}`);
    } else if (product?.sellerId) {
      navigate(`/store/${product.sellerId}`);
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
          <ProductImageGallery 
            images={[
              product.imageUrl, 
              ...(Array.isArray(product.additionalImages) ? product.additionalImages : [])
            ].filter(Boolean)} 
            name={product.name} 
          />
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
                  {product.inStock ? (
                    product.quantity > 10 
                      ? <TranslationWrapper translationKey="inStock">In Stock</TranslationWrapper> 
                      : product.quantity > 0 
                        ? <><TranslationWrapper translationKey="onlyLeft">Only</TranslationWrapper> {product.quantity} <TranslationWrapper translationKey="items">items</TranslationWrapper> left</> 
                        : <TranslationWrapper translationKey="outOfStock">Out of Stock</TranslationWrapper>
                  ) : (
                    <TranslationWrapper translationKey="outOfStock">Out of Stock</TranslationWrapper>
                  )}
                </Typography>
              </Box>
            </Box>
            
            {/* Short Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {product.shortDescription || product.description?.substring(0, 150) + '...'}
              </Typography>
            </Box>
            
            {/* Product Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {product.tags.map((tag, index) => (
                  <Chip 
                    key={`tag-${index}`} 
                    label={tag} 
                    size="small" 
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Box>
            )}
            
            {/* Variants Selection */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <ProductVariantSelector 
                variants={product.variants} 
                onVariantChange={handleVariantChange}
              />
            )}
            
            {/* Color Options */}
            {Array.isArray(product.colorOptions) && product.colorOptions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  <TranslationWrapper>colors</TranslationWrapper>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {product.colorOptions.map((color, index) => (
                    <Chip 
                      key={`color-${index}`} 
                      label={color} 
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Size Options */}
            {Array.isArray(product.sizeOptions) && product.sizeOptions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  <TranslationWrapper>sizes</TranslationWrapper>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {product.sizeOptions.map((size, index) => (
                    <Chip 
                      key={`size-${index}`} 
                      label={size} 
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Shipping Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                <TranslationWrapper>shipping</TranslationWrapper>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  {product.shippingCostType === 'free' ? (
                    <TranslationWrapper>freeShipping</TranslationWrapper>
                  ) : (
                    <>
                      <TranslationWrapper>shippingCost</TranslationWrapper>: {formatCurrency(product.shippingCost || 0)}
                    </>
                  )}
                  {product.estimatedDeliveryDays && (
                    <> • <TranslationWrapper>estimatedDelivery</TranslationWrapper>: {product.estimatedDeliveryDays} <TranslationWrapper>days</TranslationWrapper></>
                  )}
                </Typography>
              </Box>
              
              {/* Shipping Regions */}
              {Array.isArray(product.shippingRegions) && product.shippingRegions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <TranslationWrapper>shipsTo</TranslationWrapper>: {product.shippingRegions.join(', ')}
                  </Typography>
                </Box>
              )}
              
              {/* Return Policy */}
              {product.returnPolicy && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    <TranslationWrapper>returnPolicy</TranslationWrapper>: {product.returnPolicy}
                  </Typography>
                </Box>
              )}
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
                  {product.quantity} <TranslationWrapper>available</TranslationWrapper>
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
                disabled={!product.inStock || product.quantity <= 0}
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
                disabled={!product.inStock || product.quantity <= 0}
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
              {sellerLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
                  <Box>
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" width={80} />
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      src={product.sellerAvatar || ""}
                      alt={sellerInfo?.name || product.sellerName || "Seller"}
                      sx={{ width: 40, height: 40, mr: 1.5 }}
                    >
                      {!product.sellerAvatar && <StoreIcon />}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {sellerInfo?.name || product.sellerName || "Seller"}
                        </Typography>
                        {product.sellerVerified && (
                          <VerifiedIcon 
                            fontSize="small" 
                            color="primary" 
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {sellerInfo?.description || product.sellerDescription || t('seller')}
                        {product.sellerRating && ` • ${product.sellerRating.toFixed(1)} ${t('rating')}`}
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
                </>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* Product Details Tabs */}
      <Box sx={{ mt: 4 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
          <Box 
            sx={{ 
              display: 'flex',
              borderBottom: `1px solid ${theme.palette.divider}`,
              px: 2,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: 6
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 3
              }
            }}
          >
            {[
              { key: 'description', label: 'Description' },
              { key: 'specifications', label: 'Specifications' },
              { key: 'reviews', label: `Reviews (${reviewStats?.totalReviews || 0})` }
            ].map((tab, index) => (
              <Box
                key={tab.key}
                onClick={() => handleTabChange(null, index)}
                sx={{
                  py: 2,
                  px: 3,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: activeTab === index ? theme.palette.primary.main : theme.palette.text.primary,
                  borderBottom: activeTab === index ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <TranslationWrapper translationKey={tab.key}>{tab.label}</TranslationWrapper>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <TranslationWrapper>productDescription</TranslationWrapper>
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {product.description}
                </Typography>
                
                {/* Product Features */}
                {Array.isArray(product.features) && product.features.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <TranslationWrapper>keyFeatures</TranslationWrapper>
                    </Typography>
                    <ul>
                      {product.features.map((feature, index) => (
                        <li key={`feature-${index}`}>
                          <Typography variant="body1">{feature}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
                
                {/* Product Images in Description */}
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.isArray(product.additionalImages) && product.additionalImages.map((image, index) => (
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
                  {/* Display all available product specifications */}
                  {[
                    { key: 'Brand', value: product.brand },
                    { key: 'Category', value: product.category },
                    { key: 'Subcategory', value: product.subcategory },
                    { key: 'Materials', value: product.materials },
                    { key: 'Country of Origin', value: product.countryOfOrigin },
                    { key: 'Weight', value: product.weight },
                    { key: 'Dimensions', value: product.dimensions },
                    { key: 'Warranty', value: product.warranty },
                    ...(Array.isArray(product.specifications) ? product.specifications.map(spec => ({ key: 'Specification', value: spec })) : [])
                  ].filter(item => item.value && item.value.trim() !== '').map((item, index) => (
                    <ListItem 
                      key={`spec-${index}`}
                      sx={{ 
                        py: 1,
                        px: 0,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                      }}
                    >
                      <Grid container>
                        <Grid item xs={4} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            {item.key}
                          </Typography>
                        </Grid>
                        <Grid item xs={8} sm={9}>
                          <Typography variant="body2">
                            {item.value}
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
                
                {/* Review List */}
                <Box sx={{ mb: 3 }}>
                  <ReviewSection productId={id} />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
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

      {/* Reviews Section */}
      <Box id="reviews-section">
        <ReviewSection productId={id} />
      </Box>
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
  
  // Set main image when images prop changes
  useEffect(() => {
    if (images && images.length > 0) {
      setMainImage(images[0]);
    }
  }, [images]);

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

  // If no images are provided, show a placeholder
  if (!images || images.length === 0) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          height: { xs: 300, sm: 400, md: 500 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          <TranslationWrapper>No images available</TranslationWrapper>
        </Typography>
      </Box>
    );
  }

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
        {images.map((image, index) => (
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
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Available';
              }}
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
          src={mainImage || images[0]}
          alt={name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            display: 'block'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x500?text=Image+Not+Available';
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
              backgroundImage: `url(${mainImage || images[0]})`,
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

// Product Variant Selector component - AliExpress Style
const ProductVariantSelector = ({ variants, onVariantChange }) => {
  const theme = useTheme();
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  useEffect(() => {
    // Initialize with first variant
    if (variants && variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
      onVariantChange(variants[0]);
    }
  }, [variants, onVariantChange, selectedVariant]);
  
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    onVariantChange(variant);
  };
  
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        <TranslationWrapper>Variants</TranslationWrapper>
      </Typography>
      
      {/* AliExpress style variant grid with images */}
      <Grid container spacing={1}>
        {variants.map((variant, index) => (
          <Grid item xs={4} sm={3} md={2} key={`variant-${index}`}>
            <Box 
              onClick={() => handleVariantChange(variant)}
              sx={{
                border: `2px solid ${selectedVariant === variant ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 0, // Flat design
                cursor: 'pointer',
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }
              }}
            >
              {/* Variant Image */}
              <Box 
                sx={{ 
                  width: '100%',
                  height: 80,
                  position: 'relative',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {variant.imageUrl ? (
                  <img 
                    src={variant.imageUrl} 
                    alt={variant.name || variant.options} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" align="center">
                      No Image
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Variant Name/Option */}
              <Box sx={{ p: 1, flexGrow: 1 }}>
                <Typography 
                  variant="caption" 
                  component="div" 
                  align="center"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: selectedVariant === variant ? 'bold' : 'normal'
                  }}
                >
                  {variant.name || variant.options}
                </Typography>
                
                {/* Price */}
                {variant.price && (
                  <Typography 
                    variant="caption" 
                    component="div" 
                    align="center"
                    color="error.main"
                    fontWeight="bold"
                    sx={{ mt: 0.5 }}
                  >
                    ETB {variant.price}
                  </Typography>
                )}
              </Box>
              
              {/* Selected Indicator */}
              {selectedVariant === variant && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0,
                    bgcolor: theme.palette.primary.main,
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckIcon sx={{ color: '#fff', fontSize: 16 }} />
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
      
      {/* Selected Variant Info */}
      {selectedVariant && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2">
            <strong>Selected:</strong> {selectedVariant.name || selectedVariant.options}
            
          </Typography>
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
