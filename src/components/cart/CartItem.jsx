import {
  Box,
  Typography,
  IconButton,
  TextField,
  Card,
  CardMedia,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { CART_FALLBACK_IMAGE, handleImageError } from '../../utils/imageUtils';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      updateQuantity(item.id, value);
    }
  };

  const handleIncreaseQuantity = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemoveItem = () => {
    removeFromCart(item.id);
  };

  return (
    <Card sx={{ mb: 2, display: 'flex', p: 2 }}>
      <CardMedia
        component="img"
        sx={{ width: 100, height: 100, objectFit: 'cover' }}
        image={item.imageUrl || item.images?.[0] || CART_FALLBACK_IMAGE}
        alt={item.name}
        onError={(e) => handleImageError(e, CART_FALLBACK_IMAGE)}
      />
      
      <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div">
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ETB {item.price.toFixed(2)} each
            </Typography>
          </Box>
          
          <IconButton 
            aria-label="delete item" 
            onClick={handleRemoveItem}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              aria-label="decrease quantity" 
              onClick={handleDecreaseQuantity}
              disabled={item.quantity <= 1}
              size="small"
            >
              <RemoveIcon />
            </IconButton>
            
            <TextField
              value={item.quantity}
              onChange={handleQuantityChange}
              inputProps={{ 
                min: 1, 
                style: { textAlign: 'center', padding: '8px', width: '40px' } 
              }}
              variant="outlined"
              size="small"
            />
            
            <IconButton 
              aria-label="increase quantity" 
              onClick={handleIncreaseQuantity}
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" component="div">
            ETB {(item.price * item.quantity).toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CartItem;
