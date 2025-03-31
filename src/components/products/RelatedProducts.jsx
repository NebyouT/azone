import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActionArea,
  Rating,
  Skeleton,
  useTheme,
  alpha,
  IconButton,
  Chip
} from '@mui/material';
import { 
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getRelatedProducts } from '../../firebase/services';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { PRODUCT_FALLBACK_IMAGE, getProductImageUrl, handleImageError } from '../../utils/imageUtils';

const RelatedProducts = ({ categoryId, currentProductId, limit = 4 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const relatedProducts = await getRelatedProducts(categoryId, currentProductId, limit);
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
  }, [categoryId, currentProductId, limit]);

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = (event, product) => {
    event.stopPropagation();
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {t('relatedProducts')}
        </Typography>
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        {t('relatedProducts')}
      </Typography>
      <Grid container spacing={2}>
        {products.map((product) => {
          const discountedPrice = product.discount > 0 
            ? ((product.price * (100 - product.discount)) / 100).toFixed(2)
            : product.price.toFixed(2);
            
          return (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <CardActionArea onClick={() => handleProductClick(product.id)}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={getProductImageUrl(product)}
                      alt={product.name}
                      onError={(e) => handleImageError(e)}
                      sx={{ 
                        objectFit: 'cover',
                        bgcolor: 'white'
                      }}
                    />
                    {product.discount > 0 && (
                      <Chip
                        label={`-${product.discount}%`}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="div" 
                      sx={{ 
                        fontWeight: 'medium',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        height: '2.5rem',
                        lineHeight: '1.25rem'
                      }}
                    >
                      {product.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Rating 
                        value={product.rating || 0} 
                        precision={0.5} 
                        size="small" 
                        readOnly 
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                      >
                        ({product.reviewCount || 0})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        component="div"
                        sx={{ 
                          fontWeight: 'bold',
                          color: product.discount > 0 ? 'error.main' : 'inherit'
                        }}
                      >
                        {formatCurrency(discountedPrice)}
                      </Typography>
                      
                      {product.discount > 0 && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            ml: 1, 
                            textDecoration: 'line-through',
                            color: 'text.secondary'
                          }}
                        >
                          {formatCurrency(product.price)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
                
                <IconButton
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                    },
                    zIndex: 1
                  }}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  <ShoppingCartIcon fontSize="small" />
                </IconButton>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default RelatedProducts;
