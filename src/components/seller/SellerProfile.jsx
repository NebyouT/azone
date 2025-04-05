import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Chip,
  Avatar,
  Rating,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Paper,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Badge,
  LinearProgress,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Store as StoreIcon,
  Verified as VerifiedIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  LocationOn as LocationIcon,
  Storefront as StorefrontIcon,
  Inventory as InventoryIcon,
  LocalOffer as OfferIcon,
  Loyalty as LoyaltyIcon,
  Favorite as FavoriteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getShopSettings, getSellerProducts } from '../../firebase/services';
import { getAllReviewsForSeller, getReviewStatistics } from '../../firebase/reviewServices';
import ProductCard from '../products/ProductCard';
import { useLanguage } from '../../contexts/LanguageContext';
import TranslationWrapper from '../common/TranslationWrapper';
import { formatDistanceToNow } from 'date-fns';

const SellerProfile = () => {
  const { sellerId } = useParams();
  const theme = useTheme();
  const { t } = useLanguage();
  
  const [shopInfo, setShopInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        
        // Fetch shop settings
        const shopSettings = await getShopSettings(sellerId);
        setShopInfo(shopSettings);
        
        // Fetch seller products
        const sellerProducts = await getSellerProducts(sellerId);
        setProducts(sellerProducts);
        
        // Set featured products (newest 4)
        const featured = [...sellerProducts]
          .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
          .slice(0, 4);
        setFeaturedProducts(featured);
        
        // Set top rated products (highest rated 4)
        const topRated = [...sellerProducts]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);
        setTopRatedProducts(topRated);
        
        // Fetch reviews for all seller products
        const allReviews = await getAllReviewsForSeller(sellerId);
        setReviews(allReviews);
        
        // Calculate review statistics
        if (allReviews.length > 0) {
          const totalReviews = allReviews.length;
          const sumRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = sumRatings / totalReviews;
          
          // Count ratings by star level
          const ratingDistribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
          };
          
          allReviews.forEach(review => {
            ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
          });
          
          setReviewStats({
            totalReviews,
            averageRating,
            ratingDistribution
          });
        }
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Calculate percentage for rating distribution
  const getRatingPercentage = (rating) => {
    if (reviewStats.totalReviews === 0) return 0;
    return (reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Shop Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 0.8)})`
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Avatar
              sx={{ 
                width: 100, 
                height: 100,
                bgcolor: theme.palette.primary.main,
                boxShadow: 2
              }}
            >
              {shopInfo?.name ? shopInfo.name.charAt(0).toUpperCase() : <StoreIcon sx={{ fontSize: 40 }} />}
            </Avatar>
          </Grid>
          
          <Grid item xs={12} sm={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mr: 1 }}>
                {shopInfo?.name || "Seller Store"}
              </Typography>
              {shopInfo?.verified && (
                <VerifiedIcon color="primary" />
              )}
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              {shopInfo?.description || "No shop description available"}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {shopInfo?.joinDate && (
                <Chip 
                  icon={<TimeIcon fontSize="small" />} 
                  label={`Joined: ${new Date(shopInfo.joinDate).toLocaleDateString()}`}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                />
              )}
              
              <Chip 
                icon={<StarIcon fontSize="small" />} 
                label={`Rating: ${reviewStats.averageRating.toFixed(1) || "New"} (${reviewStats.totalReviews})`}
                size="small"
                sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.dark }}
              />
              
              <Chip 
                icon={<InventoryIcon fontSize="small" />} 
                label={`Products: ${products.length}`}
                size="small"
                sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark }}
              />
              
              {shopInfo?.location && (
                <Chip 
                  icon={<LocationIcon fontSize="small" />} 
                  label={shopInfo.location}
                  size="small"
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.dark }}
                />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {shopInfo?.phone && (
                <Button 
                  variant="outlined" 
                  startIcon={<PhoneIcon />}
                  size="small"
                  href={`tel:${shopInfo.phone}`}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {shopInfo.phone}
                </Button>
              )}
              
              {shopInfo?.email && (
                <Button 
                  variant="outlined" 
                  startIcon={<EmailIcon />}
                  size="small"
                  href={`mailto:${shopInfo.email}`}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {shopInfo.email}
                </Button>
              )}
              
              <Button 
                variant="contained" 
                startIcon={<FavoriteIcon />}
                size="small"
                color="primary"
                sx={{ mt: 1 }}
              >
                Follow Store
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              <LoyaltyIcon sx={{ mr: 1, verticalAlign: 'middle', color: theme.palette.secondary.main }} />
              <TranslationWrapper>Featured Products</TranslationWrapper>
            </Typography>
            <Chip 
              label="New Arrivals" 
              color="secondary" 
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Grid container spacing={2}>
            {featuredProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={3}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {/* Shop Content */}
      <Box sx={{ mb: 4 }}>
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorefrontIcon sx={{ mr: 1 }} />
                    <TranslationWrapper>All Products</TranslationWrapper>
                    <Chip 
                      label={products.length} 
                      size="small" 
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ mr: 1 }} />
                    <TranslationWrapper>Reviews</TranslationWrapper>
                    <Chip 
                      label={reviewStats.totalReviews} 
                      size="small" 
                      sx={{ ml: 1, height: 20, minWidth: 20 }}
                    />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1 }} />
                    <TranslationWrapper>About</TranslationWrapper>
                  </Box>
                } 
              />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {/* All Products Tab */}
            {activeTab === 0 && (
              <Box>
                {products.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      <TranslationWrapper>No products available</TranslationWrapper>
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        <TranslationWrapper>All Products</TranslationWrapper> ({products.length})
                      </Typography>
                      {/* Add filtering options here if needed */}
                    </Box>
                    
                    <Grid container spacing={3}>
                      {products.map((product) => (
                        <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                          <ProductCard product={product} />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            )}
            
            {/* Reviews Tab */}
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={4}>
                  {/* Review Summary */}
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        border: `1px solid ${theme.palette.divider}`,
                        height: '100%'
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        <TranslationWrapper>Rating Summary</TranslationWrapper>
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h3" color="primary" fontWeight="bold">
                          {reviewStats.averageRating.toFixed(1)}
                        </Typography>
                        <Rating 
                          value={reviewStats.averageRating} 
                          precision={0.5} 
                          readOnly 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {reviewStats.totalReviews} <TranslationWrapper>reviews</TranslationWrapper>
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Rating Distribution */}
                      <Box>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: 40 }}>
                              <Typography>{rating}</Typography>
                              <StarIcon fontSize="small" sx={{ ml: 0.5, color: theme.palette.warning.main }} />
                            </Box>
                            <Box sx={{ flexGrow: 1, mx: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={getRatingPercentage(rating)}
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: alpha(theme.palette.divider, 0.5),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: rating > 3 
                                      ? theme.palette.success.main 
                                      : rating > 1 
                                        ? theme.palette.warning.main 
                                        : theme.palette.error.main
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                              {reviewStats.ratingDistribution[rating] || 0}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Review List */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      <TranslationWrapper>Customer Reviews</TranslationWrapper>
                    </Typography>
                    
                    {reviews.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                          <TranslationWrapper>No reviews yet for this seller</TranslationWrapper>
                        </Typography>
                      </Box>
                    ) : (
                      <List sx={{ width: '100%' }}>
                        {reviews.map((review) => (
                          <Paper
                            key={review.id}
                            elevation={0}
                            sx={{ 
                              mb: 2, 
                              p: 2, 
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            <Box sx={{ display: 'flex', mb: 1 }}>
                              <ListItemAvatar>
                                <Avatar 
                                  src={review.userAvatar}
                                  alt={review.userName}
                                  sx={{ bgcolor: theme.palette.primary.main }}
                                >
                                  {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                              </ListItemAvatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {review.userName || "Anonymous User"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {review.createdAt ? (
                                      formatDistanceToNow(
                                        new Date(review.createdAt.toDate ? review.createdAt.toDate() : review.createdAt),
                                        { addSuffix: true }
                                      )
                                    ) : "Recently"}
                                  </Typography>
                                </Box>
                                <Rating value={review.rating} size="small" readOnly />
                              </Box>
                            </Box>
                            
                            <Box sx={{ ml: 7 }}>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {review.comment}
                              </Typography>
                              
                              {review.productName && (
                                <Chip 
                                  label={`Product: ${review.productName}`}
                                  size="small"
                                  sx={{ 
                                    mr: 1,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                  }}
                                />
                              )}
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Tooltip title="Helpful">
                                  <IconButton size="small" color="default">
                                    <ThumbUpIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Typography variant="caption" sx={{ mr: 2 }}>
                                  {review.helpfulCount || 0}
                                </Typography>
                                
                                <Tooltip title="Not Helpful">
                                  <IconButton size="small" color="default">
                                    <ThumbDownIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Typography variant="caption">
                                  {review.notHelpfulCount || 0}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* About Tab */}
            {activeTab === 2 && (
              <Box>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      <TranslationWrapper>About the Store</TranslationWrapper>
                    </Typography>
                    
                    <Typography variant="body1" paragraph>
                      {shopInfo?.description || "No description available for this store."}
                    </Typography>
                    
                    {shopInfo?.returnPolicy && (
                      <>
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                          <TranslationWrapper>Return Policy</TranslationWrapper>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {shopInfo.returnPolicy}
                        </Typography>
                      </>
                    )}
                    
                    {shopInfo?.shippingPolicy && (
                      <>
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                          <TranslationWrapper>Shipping Policy</TranslationWrapper>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {shopInfo.shippingPolicy}
                        </Typography>
                      </>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2, 
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 3
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        <TranslationWrapper>Store Information</TranslationWrapper>
                      </Typography>
                      
                      <List dense>
                        {shopInfo?.joinDate && (
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                                <TimeIcon color="primary" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<TranslationWrapper>Joined</TranslationWrapper>}
                              secondary={new Date(shopInfo.joinDate).toLocaleDateString()}
                            />
                          </ListItem>
                        )}
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                              <InventoryIcon color="success" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={<TranslationWrapper>Total Products</TranslationWrapper>}
                            secondary={products.length}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                              <StarIcon color="warning" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={<TranslationWrapper>Average Rating</TranslationWrapper>}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Rating value={reviewStats.averageRating} size="small" readOnly precision={0.5} />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  ({reviewStats.totalReviews} <TranslationWrapper>reviews</TranslationWrapper>)
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        {shopInfo?.location && (
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                                <LocationIcon color="info" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<TranslationWrapper>Location</TranslationWrapper>}
                              secondary={shopInfo.location}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                    
                    {topRatedProducts.length > 0 && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      >
                        <Typography variant="h6" gutterBottom>
                          <TranslationWrapper>Top Rated Products</TranslationWrapper>
                        </Typography>
                        
                        <List dense>
                          {topRatedProducts.slice(0, 3).map((product) => (
                            <ListItem 
                              key={product.id}
                              sx={{ 
                                mb: 1, 
                                borderRadius: 1,
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                              }}
                              button
                              component="a"
                              href={`/products/${product.id}`}
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  variant="rounded"
                                  src={product.imageUrl || product.images?.[0]}
                                  alt={product.name}
                                >
                                  <InventoryIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={product.name}
                                secondary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Rating value={product.rating || 0} size="small" readOnly precision={0.5} />
                                    <Typography variant="caption" sx={{ ml: 1 }}>
                                      ({product.reviewCount || 0})
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SellerProfile;
