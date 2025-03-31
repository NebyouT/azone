import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Divider,
  Button,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Image as ImageIcon,
  Comment as CommentIcon,
  Star as StarIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  getProductReviews, 
  getReviewStatistics, 
  markReviewHelpfulness,
  getEligibleOrdersForReview,
  addReview
} from '../../firebase/reviewServices';
import { formatDate } from '../../utils/formatters';

const ReviewSection = ({ productId }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  // State
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  
  // Fetch reviews and statistics
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true);
        
        // Get reviews with current filters
        const reviewsData = await getProductReviews(
          productId,
          20,
          sortBy,
          sortOrder,
          ratingFilter
        );
        
        // Get statistics
        const statsData = await getReviewStatistics(productId);
        
        setReviews(reviewsData);
        setStatistics(statsData);
        
        // If user is logged in, check for eligible orders
        if (currentUser) {
          const eligibleOrdersData = await getEligibleOrdersForReview(currentUser.uid);
          
          // Filter to only include orders with this product
          const filteredOrders = eligibleOrdersData.filter(order => 
            order.products.some(product => product.id === productId)
          );
          
          setEligibleOrders(filteredOrders);
        }
      } catch (error) {
        console.error('Error fetching review data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviewData();
  }, [productId, currentUser, ratingFilter, sortBy, sortOrder]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Set filter based on tab
    if (newValue === 0) {
      setRatingFilter(0); // All reviews
    } else if (newValue === 1) {
      setRatingFilter(0); // All reviews, but with images
      // We'll filter in the render function
    } else {
      setRatingFilter(6 - newValue); // 5, 4, 3, 2, 1 stars
    }
  };
  
  // Handle sort change
  const handleSortChange = (sortField, order) => {
    setSortBy(sortField);
    setSortOrder(order);
  };
  
  // Handle review dialog
  const handleOpenReviewDialog = () => {
    if (eligibleOrders.length > 0) {
      setSelectedOrder(eligibleOrders[0]);
      setReviewDialogOpen(true);
    }
  };
  
  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setReviewImages([]);
    setReviewText('');
    setReviewRating(5);
    setError('');
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 6 images
    if (reviewImages.length + files.length > 6) {
      setError('You can upload a maximum of 6 images');
      return;
    }
    
    // Preview images
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setReviewImages([...reviewImages, ...newImages]);
  };
  
  // Remove image
  const handleRemoveImage = (index) => {
    const newImages = [...reviewImages];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newImages[index].preview);
    
    newImages.splice(index, 1);
    setReviewImages(newImages);
  };
  
  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      setError('Please enter a review');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Extract files for upload
      const imageFiles = reviewImages.map(img => img.file);
      
      await addReview(
        currentUser.uid,
        productId,
        selectedOrder.id,
        reviewRating,
        reviewText,
        imageFiles
      );
      
      // Close dialog and refresh reviews
      handleCloseReviewDialog();
      
      // Refresh reviews and statistics
      const reviewsData = await getProductReviews(
        productId,
        20,
        sortBy,
        sortOrder,
        ratingFilter
      );
      
      const statsData = await getReviewStatistics(productId);
      
      setReviews(reviewsData);
      setStatistics(statsData);
      
      // Update eligible orders
      const eligibleOrdersData = await getEligibleOrdersForReview(currentUser.uid);
      const filteredOrders = eligibleOrdersData.filter(order => 
        order.products.some(product => product.id === productId)
      );
      setEligibleOrders(filteredOrders);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle helpfulness vote
  const handleHelpfulnessVote = async (reviewId, isHelpful) => {
    if (!currentUser) {
      // Prompt to login
      return;
    }
    
    try {
      await markReviewHelpfulness(reviewId, currentUser.uid, isHelpful);
      
      // Update reviews
      const reviewsData = await getProductReviews(
        productId,
        20,
        sortBy,
        sortOrder,
        ratingFilter
      );
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error marking review helpfulness:', error);
    }
  };
  
  // Image viewer
  const handleOpenImageViewer = (imageUrl) => {
    setCurrentImage(imageUrl);
    setImageViewerOpen(true);
  };
  
  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
  };
  
  // Render rating distribution
  const renderRatingDistribution = () => {
    if (!statistics) return null;
    
    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = statistics.ratingCounts[rating] || 0;
          const percentage = statistics.totalReviews > 0 
            ? (count / statistics.totalReviews) * 100 
            : 0;
            
          return (
            <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ minWidth: 40 }}>
                <Typography variant="body2">{rating} ★</Typography>
              </Box>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={percentage} 
                  sx={{ 
                    height: 8,
                    borderRadius: 0,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {count}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };
  
  // Render review card
  const renderReviewCard = (review) => {
    return (
      <Card 
        key={review.id} 
        elevation={0}
        sx={{ 
          mb: 2, 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <Avatar 
              src={review.user.photoURL}
              alt={review.user.name}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle1">
                {review.user.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating 
                  value={review.rating} 
                  readOnly 
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(review.createdAt?.toDate())}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            {review.comment}
          </Typography>
          
          {review.images && review.images.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {review.images.map((image, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                  onClick={() => handleOpenImageViewer(image)}
                >
                  <img 
                    src={image} 
                    alt={`Review ${index}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              startIcon={<ThumbUpIcon />}
              size="small"
              onClick={() => handleHelpfulnessVote(review.id, true)}
              sx={{ mr: 1 }}
            >
              {t('helpful')} ({review.helpful})
            </Button>
            <Button
              startIcon={<ThumbDownIcon />}
              size="small"
              onClick={() => handleHelpfulnessVote(review.id, false)}
            >
              {t('notHelpful')} ({review.notHelpful})
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // Render review dialog
  const renderReviewDialog = () => {
    return (
      <Dialog 
        open={reviewDialogOpen} 
        onClose={handleCloseReviewDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {t('writeReview')}
          <IconButton
            aria-label="close"
            onClick={handleCloseReviewDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('orderDetails')}
            </Typography>
            {selectedOrder && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="body2">
                  {t('orderNumber')}: {selectedOrder.orderNumber}
                </Typography>
                <Typography variant="body2">
                  {t('orderDate')}: {formatDate(selectedOrder.date?.toDate())}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    {t('productReviewing')}:
                  </Typography>
                  {selectedOrder.products
                    .filter(product => product.id === productId)
                    .map(product => (
                      <Box 
                        key={product.id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          p: 1,
                          border: `1px solid ${theme.palette.divider}`
                        }}
                      >
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 16 }}
                        />
                        <Typography variant="body2">
                          {product.name} (x{product.quantity})
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </Paper>
            )}
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('rating')}
            </Typography>
            <Rating
              name="review-rating"
              value={reviewRating}
              onChange={(event, newValue) => {
                setReviewRating(newValue);
              }}
              size="large"
              sx={{ color: theme.palette.warning.main }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('reviewText')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={t('writeYourReview')}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              variant="outlined"
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {t('addPhotos')} ({t('optional')})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {reviewImages.map((image, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    position: 'relative',
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <img 
                    src={image.preview} 
                    alt={`Upload ${index}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: alpha('#000', 0.5),
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: alpha('#000', 0.7),
                      },
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              {reviewImages.length < 6 && (
                <Box
                  component="label"
                  htmlFor="review-image-upload"
                  sx={{
                    width: 100,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${theme.palette.divider}`,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <input
                    id="review-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <AddPhotoIcon color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {t('addPhoto')}
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('maxPhotos', { count: 6 })}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSubmitReview}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? t('submitting') : t('submitReview')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render image viewer
  const renderImageViewer = () => {
    return (
      <Dialog
        open={imageViewerOpen}
        onClose={handleCloseImageViewer}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            aria-label="close"
            onClick={handleCloseImageViewer}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#fff',
              backgroundColor: alpha('#000', 0.5),
              '&:hover': {
                backgroundColor: alpha('#000', 0.7),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <img 
            src={currentImage} 
            alt="Review" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </DialogContent>
      </Dialog>
    );
  };
  
  // Filter reviews based on tab
  const filteredReviews = tabValue === 1
    ? reviews.filter(review => review.images && review.images.length > 0)
    : reviews;
  
  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        {t('customerReviews')}
      </Typography>
      
      <Grid container spacing={4}>
        {/* Rating summary */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h3" sx={{ mr: 1 }}>
                {statistics?.averageRating.toFixed(1) || '0.0'}
              </Typography>
              <Box>
                <Rating 
                  value={statistics?.averageRating || 0} 
                  precision={0.5} 
                  readOnly 
                  sx={{ color: theme.palette.warning.main }}
                />
                <Typography variant="body2" color="text.secondary">
                  {statistics?.totalReviews || 0} {t('reviews')}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {renderRatingDistribution()}
          
          {currentUser && eligibleOrders.length > 0 && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleOpenReviewDialog}
              sx={{ mb: 2 }}
            >
              {t('writeReview')}
            </Button>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('sortReviewsBy')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={t('mostRecent')}
                onClick={() => handleSortChange('createdAt', 'desc')}
                color={sortBy === 'createdAt' && sortOrder === 'desc' ? 'primary' : 'default'}
                variant={sortBy === 'createdAt' && sortOrder === 'desc' ? 'filled' : 'outlined'}
                sx={{ borderRadius: 0 }}
              />
              <Chip
                label={t('highestRated')}
                onClick={() => handleSortChange('rating', 'desc')}
                color={sortBy === 'rating' && sortOrder === 'desc' ? 'primary' : 'default'}
                variant={sortBy === 'rating' && sortOrder === 'desc' ? 'filled' : 'outlined'}
                sx={{ borderRadius: 0 }}
              />
              <Chip
                label={t('lowestRated')}
                onClick={() => handleSortChange('rating', 'asc')}
                color={sortBy === 'rating' && sortOrder === 'asc' ? 'primary' : 'default'}
                variant={sortBy === 'rating' && sortOrder === 'asc' ? 'filled' : 'outlined'}
                sx={{ borderRadius: 0 }}
              />
              <Chip
                label={t('mostHelpful')}
                onClick={() => handleSortChange('helpful', 'desc')}
                color={sortBy === 'helpful' && sortOrder === 'desc' ? 'primary' : 'default'}
                variant={sortBy === 'helpful' && sortOrder === 'desc' ? 'filled' : 'outlined'}
                sx={{ borderRadius: 0 }}
              />
            </Box>
          </Box>
        </Grid>
        
        {/* Reviews list */}
        <Grid item xs={12} md={8}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: 'auto',
                px: 2
              }
            }}
          >
            <Tab 
              label={t('allReviews')} 
              icon={<CommentIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={t('withPhotos')} 
              icon={<ImageIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="5 ★" 
              icon={<StarIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="4 ★" 
              icon={<StarIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="3 ★" 
              icon={<StarIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="2 ★" 
              icon={<StarIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="1 ★" 
              icon={<StarIcon />} 
              iconPosition="start"
            />
          </Tabs>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography>{t('loadingReviews')}</Typography>
            </Box>
          ) : filteredReviews.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1">
                {t('noReviewsYet')}
              </Typography>
              {currentUser && eligibleOrders.length > 0 && (
                <Button
                  variant="contained"
                  onClick={handleOpenReviewDialog}
                  sx={{ mt: 2 }}
                >
                  {t('beFirstToReview')}
                </Button>
              )}
            </Box>
          ) : (
            filteredReviews.map(review => renderReviewCard(review))
          )}
        </Grid>
      </Grid>
      
      {/* Review dialog */}
      {renderReviewDialog()}
      
      {/* Image viewer */}
      {renderImageViewer()}
    </Box>
  );
};

export default ReviewSection;
