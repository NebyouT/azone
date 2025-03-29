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
  const [paymentMethod, setPaymentMethod] = useState('wallet');
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
        
        // If wallet balance is insufficient, redirect to wallet page
        if (balance < total) {
          setError('Insufficient wallet balance. You will be redirected to add funds.');
          setTimeout(() => {
            navigate('/wallet', { 
              state: { 
                returnToCheckout: true, 
                requiredAmount: total 
              } 
            });
          }, 2000);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, [currentUser, navigate, total]);
  
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
      // Validate wallet balance
      if (walletBalance < total) {
        setError('Insufficient wallet balance');
        setTimeout(() => {
          navigate('/wallet', { 
            state: { 
              returnToCheckout: true, 
              requiredAmount: total 
            } 
          });
        }, 2000);
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
  
  // Place order
  const placeOrder = async () => {
    if (walletBalance < total) {
      setError('Insufficient wallet balance');
      setTimeout(() => {
        navigate('/wallet', { 
          state: { 
            returnToCheckout: true, 
            requiredAmount: total 
          } 
        });
      }, 2000);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create order
      const orderData = {
        items: cart.items,
        subtotal,
        shippingCost,
        tax,
        total,
        paymentMethod: 'wallet',
        shippingAddress: shippingDetails,
        status: 'pending',
        paymentStatus: 'pending' // Will be updated when the order is completed
      };
      
      const { id } = await createOrder(currentUser.uid, orderData);
      setOrderId(id);
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
                    <Typography variant="body1">Tax</Typography>
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
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={shippingDetails.fullName}
                    onChange={handleShippingChange}
                    error={error && !shippingDetails.fullName}
                    helperText={error && !shippingDetails.fullName ? 'Full name is required' : ''}
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
                    error={error && !shippingDetails.phoneNumber}
                    helperText={error && !shippingDetails.phoneNumber ? 'Phone number is required' : ''}
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
                    error={error && !shippingDetails.address}
                    helperText={error && !shippingDetails.address ? 'Address is required' : ''}
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
                    error={error && !shippingDetails.city}
                    helperText={error && !shippingDetails.city ? 'City is required' : ''}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
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
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <PaymentOptions
              onPaymentMethodChange={handlePaymentMethodChange}
              totalAmount={total}
            />
            
            <Paper variant="outlined" sx={{ p: 2 }}>
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
                  <Typography variant="subtitle1" gutterBottom>
                    Shipping Details
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
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
                    {shippingDetails.deliveryInstructions && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Instructions: {shippingDetails.deliveryInstructions}
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Payment Method
                  </Typography>
                  
                  <Typography variant="body2">
                    Wallet Payment
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {formatCurrency(total)} will be deducted from your wallet balance.
                  </Alert>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Items
                  </Typography>
                  
                  {cart.items.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', mb: 2 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {item.name} x {item.quantity}
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Shipping</Typography>
                    <Typography variant="body2">
                      {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax</Typography>
                    <Typography variant="body2">{formatCurrency(tax)}</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Total</Typography>
                    <Typography variant="subtitle1">{formatCurrency(total)}</Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step) => (
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
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading || orderComplete}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 && !orderComplete ? (
              <Button
                variant="contained"
                color="primary"
                onClick={placeOrder}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Place Order'
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={activeStep === steps.length - 1 || loading || (cart.items && cart.items.length === 0)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;
