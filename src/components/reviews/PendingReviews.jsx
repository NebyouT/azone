import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import { RateReview as RateReviewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getEligibleOrdersForReview } from '../../firebase/reviewServices';
import { formatDate } from '../../utils/formatters';

const PendingReviews = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const orders = await getEligibleOrdersForReview(currentUser.uid);
        setPendingOrders(orders);
      } catch (error) {
        console.error('Error fetching pending reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingReviews();
  }, [currentUser]);
  
  const handleReviewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (pendingOrders.length === 0) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          textAlign: 'center',
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('noPendingReviews')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('allProductsReviewed')}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('pendingReviews')}
      </Typography>
      
      {pendingOrders.map(order => (
        <Paper 
          key={order.id}
          elevation={0}
          sx={{ 
            mb: 3, 
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="subtitle2">
              {t('orderNumber')}: {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('orderDate')}: {formatDate(order.date?.toDate())}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('productsToReview')}:
            </Typography>
            
            <Grid container spacing={2}>
              {order.products.map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      display: 'flex',
                      height: '100%',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{ width: 80, height: 80, objectFit: 'cover' }}
                      image={product.imageUrl}
                      alt={product.name}
                    />
                    <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                      <Typography variant="subtitle2" noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('quantity')}: {product.quantity}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<RateReviewIcon />}
                        onClick={() => handleReviewProduct(product.id)}
                        sx={{ mt: 1 }}
                      >
                        {t('writeReview')}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default PendingReviews;
