import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Rating,
  Box,
  Chip
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { getProductImageUrl, handleImageError } from '../../utils/imageUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

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

  return (
    <Card 
      sx={{ 
        width: '100%',
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        },
        cursor: 'pointer',
        borderRadius: 0
      }}
      onClick={handleCardClick}
    >
      <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          image={getProductImageUrl(product)}
          alt={product.name}
          onError={(e) => handleImageError(e)}
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
          onClick={handleToggleFavorite}
        >
          {isFavorite ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>
        {product.discount > 0 && (
          <Chip
            label={`${product.discount}% OFF`}
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 'bold',
            }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: 150, p: 2 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="div" 
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
            height: '2.4em',
            mb: 1
          }}
        >
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating 
            value={product.rating || 0} 
            precision={0.5} 
            size="small" 
            readOnly 
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviewCount || 0})
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            fontSize: '0.75rem'
          }}
        >
          {product.category}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
            height: '2.4em',
            fontSize: '0.75rem'
          }}
        >
          {product.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 0 }}>
        <Box>
          {product.discount > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mr: 1 }}>
                ${((product.price * (100 - product.discount)) / 100).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                ${product.price.toFixed(2)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              ${product.price.toFixed(2)}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartIcon />}
          size="small"
          onClick={handleAddToCart}
        >
          Add
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
