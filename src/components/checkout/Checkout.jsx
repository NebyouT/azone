import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Divider,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as ConfirmIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../firebase/services';
import { getWalletBalance } from '../../firebase/walletServices';
import PaymentOptions from './PaymentOptions';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
};

const steps = [
  { label: 'Review Cart', icon: <CartIcon /> },
  { label: 'Shipping Details', icon: <ShippingIcon /> },
  { label: 'Payment Method', icon: <PaymentIcon /> },
  { label: 'Confirm Order', icon: <ConfirmIcon /> }
];

const Checkout = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, clearCart } = useCart();
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: 'Addis Ababa',
    region: 'Addis Ababa',
    zipCode: '',
    deliveryInstructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Calculate totals
  const subtotal = cart.items && Array.isArray(cart.items) 
    ? cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    : 0;
  const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping for orders over 1000 ETB
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + shippingCost + tax;
  
  // Load user data and wallet balance
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        // Pre-fill shipping details with user data if available
        setShippingDetails(prev => ({
          ...prev,
          fullName: currentUser.displayName || '',
          phoneNumber: currentUser.phoneNumber || ''
        }));
        
        // Get wallet balance
        const balance = await getWalletBalance(currentUser.uid);
        setWalletBalance(balance);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Check if cart is empty
  useEffect(() => {
    if (cart.items && cart.items.length === 0 && !orderComplete) {
      navigate('/cart');
    }
  }, [cart, navigate, orderComplete]);
  
  // Handle shipping details change
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };
  
  // Handle next step
  const handleNext = () => {
    // Validate current step
    if (activeStep === 1) {
      // Validate shipping details
      const { fullName, phoneNumber, address, city } = shippingDetails;
      if (!fullName || !phoneNumber || !address || !city) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    if (activeStep === 2) {
      // Validate payment method
      if (paymentMethod === 'wallet' && walletBalance < total) {
        setError('Insufficient wallet balance');
        return;
      }
    }
    
    setError('');
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError('');
  };
  
  // Handle order submission
  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate cart items to ensure all required fields exist
      const validItems = cart.items.map(item => ({
        productId: item.id || '',
        sellerId: item.sellerId || '',  // This might be undefined
        name: item.name || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        imageUrl: item.imageUrl || ''
      }));
      
      // Create order object with validated data
      const orderData = {
        items: validItems,
        shippingDetails: {
          fullName: shippingDetails.fullName || '',
          phoneNumber: shippingDetails.phoneNumber || '',
          address: shippingDetails.address || '',
          city: shippingDetails.city || 'Addis Ababa',
          region: shippingDetails.region || 'Addis Ababa',
          zipCode: shippingDetails.zipCode || '',
          deliveryInstructions: shippingDetails.deliveryInstructions || ''
        },
        paymentMethod,
        subtotal: subtotal || 0,
        shippingCost: shippingCost || 0,
        tax: tax || 0,
        total: total || 0,
        paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
        orderDate: new Date(),
        status: 'pending'
      };
      
      // Create order in Firestore
      const order = await createOrder(currentUser.uid, orderData);
      
      // Set order ID and mark as complete
      setOrderId(order.id);
      setOrderComplete(true);
      
      // Clear cart
      clearCart();
      
      // Move to final step
      setActiveStep(steps.length - 1);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Cart
            </Typography>
            
            {cart.items && cart.items.length === 0 ? (
              <Alert severity="info">Your cart is empty</Alert>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  {cart.items.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.name}
                        sx={{ width: 80, height: 80, objectFit: 'cover', mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.quantity}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: {formatCurrency(item.price)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">
                          {formatCurrency(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Subtotal</Typography>
                    <Typography variant="body1">{formatCurrency(subtotal)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Shipping</Typography>
                    <Typography variant="body1">
                      {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Tax (15% VAT)</Typography>
                    <Typography variant="body1">{formatCurrency(tax)}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">{formatCurrency(total)}</Typography>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Shipping Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={shippingDetails.fullName}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={shippingDetails.phoneNumber}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Address"
                  name="address"
                  value={shippingDetails.address}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="City"
                  name="city"
                  value={shippingDetails.city}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Region"
                  name="region"
                  value={shippingDetails.region}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="zipCode"
                  value={shippingDetails.zipCode}
                  onChange={handleShippingChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Delivery Instructions (Optional)"
                  name="deliveryInstructions"
                  value={shippingDetails.deliveryInstructions}
                  onChange={handleShippingChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            
            <PaymentOptions 
              onPaymentMethodChange={handlePaymentMethodChange} 
              totalAmount={total}
            />
            
            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Items ({cart.items && cart.items.length})</Typography>
                <Typography variant="body1">{formatCurrency(subtotal)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Shipping</Typography>
                <Typography variant="body1">
                  {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax</Typography>
                <Typography variant="body1">{formatCurrency(tax)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">{formatCurrency(total)}</Typography>
              </Box>
            </Paper>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            {orderComplete ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <ConfirmIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography variant="h5" gutterBottom>
                  Thank You For Your Order!
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  Your order has been placed successfully.
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order ID: {orderId}
                </Typography>
                
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/orders')}
                    sx={{ mr: 2 }}
                  >
                    View Orders
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                  >
                    Continue Shopping
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Shipping To
                      </Typography>
                      <Typography variant="body1">
                        {shippingDetails.fullName}
                      </Typography>
                      <Typography variant="body2">
                        {shippingDetails.address}
                      </Typography>
                      <Typography variant="body2">
                        {shippingDetails.city}, {shippingDetails.region} {shippingDetails.zipCode}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {shippingDetails.phoneNumber}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Payment Method
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {paymentMethod.replace(/_/g, ' ')}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Order Total
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(total)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Please review your order details before placing the order.
                </Alert>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Place Order'}
                </Button>
              </Box>
            )}
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={() => step.icon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
        
        {!orderComplete && activeStep !== steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
            >
              {activeStep === steps.length - 2 ? 'Review Order' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Checkout;
