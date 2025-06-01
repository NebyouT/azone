import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Rating,
  Paper,
  Chip,
  Badge,
  Skeleton,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { getProductImageUrl, handleImageError } from '../../utils/imageUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Calculate discounted price if applicable
  const discountedPrice = product.discount > 0 
    ? (product.price * (100 - product.discount)) / 100 
    : product.price;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Implement wishlist functionality with Firebase
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    // TODO: Implement quick view modal
    console.log('Quick view', product.id);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        height: isMobile ? '330px' : '420px', // Reduced height for mobile
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: 0,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        margin: 0, // Reset margin
        boxSizing: 'border-box', // Ensure padding doesn't affect dimensions
        ...(isMobile && {
          // Mobile-specific styles
          maxWidth: '100%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', // Lighter shadow for mobile
          mb: 1, // Add bottom margin on mobile
        }),
        '&:hover': {
          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          '& .product-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
          '& .product-image': {
            transform: 'scale(1.05)',
          }
        },
        cursor: 'pointer',
      }}
      onClick={handleCardClick}
    >
      {/* Discount badge */}
      {product.discount > 0 && (
        <Chip
          label={`${product.discount}% OFF`}
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
            fontWeight: 'bold',
            fontSize: '0.7rem',
            height: '24px',
          }}
        />
      )}

      {/* Favorite button */}
      <IconButton
        size="small"
        onClick={handleToggleFavorite}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.9)',
          },
          width: 30,
          height: 30,
        }}
      >
        {isFavorite ? (
          <FavoriteIcon fontSize="small" color="error" />
        ) : (
          <FavoriteBorderIcon fontSize="small" />
        )}
      </IconButton>

      {/* Image container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '160px' : '220px', // Reduced height for mobile
          overflow: 'hidden',
          backgroundColor: '#f8f8f8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
        }}
      >
        {!imageLoaded && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave" 
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
        <Box
          component="img"
          src={getProductImageUrl(product)}
          alt={product.name}
          onError={(e) => handleImageError(e)}
          onLoad={handleImageLoad}
          className="product-image"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Changed to cover to fill the space and crop if needed
            objectPosition: 'center',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Quick actions overlay */}
        <Box
          className="product-actions"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '8px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            opacity: 0,
            transform: 'translateY(100%)',
            transition: 'all 0.3s ease',
            gap: 1,
          }}
        >
          <Tooltip title="Quick view">
            <IconButton
              size="small"
              onClick={handleQuickView}
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: 'primary.main' } 
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add to cart">
            <IconButton
              size="small"
              onClick={handleAddToCart}
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: 'primary.main' } 
              }}
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Product info */}
      <Box
        sx={{
          pt: isMobile ? 1 : 2, // Top padding
          pr: isMobile ? 1 : 2, // Right padding
          pb: isMobile ? 1 : 2, // Bottom padding
          pl: 0, // Remove left padding
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
          height: isMobile ? '130px' : '180px', // Reduced height for mobile
          overflow: 'hidden', // Prevent content overflow
        }}
      >
        <Box>
          {/* Category */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: 0.5,
              mb: 0.5,
              display: 'block',
            }}
          >
            {product.category}
          </Typography>

          {/* Product name */}
          <Typography
            variant={isMobile ? 'subtitle2' : 'subtitle1'}
            component="h3"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.2,
              height: isMobile ? '2.2em' : '2.4em',
              mb: 0.5,
              fontSize: isMobile ? '0.8rem' : 'inherit',
            }}
          >
            {product.name}
          </Typography>

          {/* Ratings */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={product.rating || 0}
              precision={0.5}
              size={isMobile ? "small" : "small"}
              readOnly
              sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              ({product.reviewCount || 0})
            </Typography>
          </Box>
        </Box>

        <Box>
          {/* Free shipping badge if applicable */}
          {product.freeShipping && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 0.5 : 1 }}>
              <ShippingIcon fontSize="small" color="primary" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                Free Shipping
              </Typography>
            </Box>
          )}

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              component="span"
              color="primary.main"
              sx={{ fontWeight: 'bold', mr: 1, fontSize: isMobile ? '0.9rem' : 'inherit' }}
            >
              ${discountedPrice.toFixed(2)}
            </Typography>
            
            {product.discount > 0 && (
              <Typography
                variant="body2"
                component="span"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                ${product.price.toFixed(2)}
              </Typography>
            )}
          </Box>

          {/* Add to cart button - only show on mobile or when not hovering */}
          {isMobile && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ShoppingCartIcon fontSize="small" />}
              size="small"
              onClick={handleAddToCart}
              fullWidth
              sx={{ mt: 0.5, borderRadius: 0, py: 0.5, fontSize: '0.75rem' }}
            >
              Add to Cart
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductCard;
