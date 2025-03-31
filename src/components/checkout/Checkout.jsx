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
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  StepIcon,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  FormControl,
  Checkbox
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as ConfirmIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { createOrder } from '../../firebase/services';
import { getWalletBalance } from '../../firebase/walletServices';
import PaymentOptions from './PaymentOptions';
import SavedAddresses from './SavedAddresses';
import { 
  getSavedAddresses, 
  saveAddress, 
  updateAddress, 
  deleteAddress, 
  updateDefaultAddress,
  getDefaultAddress
} from '../../firebase/shippingServices';

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

// Custom StepIcon component
const CustomStepIcon = (props) => {
  const { active, completed, icon } = props;
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        borderRadius: '50%',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active || completed 
          ? theme.palette.primary.gradient
          : alpha(theme.palette.text.disabled, 0.1),
        color: active || completed ? 'white' : theme.palette.text.disabled,
        boxShadow: active || completed ? theme.shadows[2] : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {steps[icon - 1].icon}
    </Box>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, clearCart } = useCart();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [shippingTabValue, setShippingTabValue] = useState(0); // 0 for saved addresses, 1 for new address
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Calculate totals
  const subtotal = cart.items && Array.isArray(cart.items) 
    ? cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    : 0;
  const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping for orders over 1000 ETB
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + shippingCost + tax;

  // Load user data, wallet balance, and saved addresses
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
        
        // Get saved addresses
        setAddressesLoading(true);
        const addresses = await getSavedAddresses(currentUser.uid);
        setSavedAddresses(addresses);
        
        // If there's a default address, select it
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingDetails({
            fullName: defaultAddress.fullName || '',
            phoneNumber: defaultAddress.phoneNumber || '',
            address: defaultAddress.address || '',
            city: defaultAddress.city || 'Addis Ababa',
            region: defaultAddress.region || 'Addis Ababa',
            zipCode: defaultAddress.zipCode || '',
            deliveryInstructions: defaultAddress.deliveryInstructions || ''
          });
        }
        
        setAddressesLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setAddressesLoading(false);
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

  // Handle shipping tab change
  const handleShippingTabChange = (event, newValue) => {
    setShippingTabValue(newValue);
  };

  // Handle address selection
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    
    // Find the selected address and update shipping details
    const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      setShippingDetails({
        fullName: selectedAddress.fullName || '',
        phoneNumber: selectedAddress.phoneNumber || '',
        address: selectedAddress.address || '',
        city: selectedAddress.city || 'Addis Ababa',
        region: selectedAddress.region || 'Addis Ababa',
        zipCode: selectedAddress.zipCode || '',
        deliveryInstructions: selectedAddress.deliveryInstructions || ''
      });
    }
  };

  // Handle save address
  const handleSaveAddress = async (addressData) => {
    try {
      setAddressesLoading(true);
      
      // Save address to Firebase
      await saveAddress(currentUser.uid, addressData, true);
      
      // Refresh saved addresses
      const addresses = await getSavedAddresses(currentUser.uid);
      setSavedAddresses(addresses);
      
      // Select the newly added address (it should be the default one now)
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setShippingDetails({
          fullName: defaultAddress.fullName || '',
          phoneNumber: defaultAddress.phoneNumber || '',
          address: defaultAddress.address || '',
          city: defaultAddress.city || 'Addis Ababa',
          region: defaultAddress.region || 'Addis Ababa',
          zipCode: defaultAddress.zipCode || '',
          deliveryInstructions: defaultAddress.deliveryInstructions || ''
        });
      }
      
      setAddressesLoading(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setAddressesLoading(false);
    }
  };

  // Handle update address
  const handleUpdateAddress = async (addressId, addressData) => {
    try {
      setAddressesLoading(true);
      
      // Update address in Firebase
      await updateAddress(currentUser.uid, addressId, addressData);
      
      // Refresh saved addresses
      const addresses = await getSavedAddresses(currentUser.uid);
      setSavedAddresses(addresses);
      
      // If the updated address is the selected one, update shipping details
      if (addressId === selectedAddressId) {
        setShippingDetails({
          fullName: addressData.fullName || '',
          phoneNumber: addressData.phoneNumber || '',
          address: addressData.address || '',
          city: addressData.city || 'Addis Ababa',
          region: addressData.region || 'Addis Ababa',
          zipCode: addressData.zipCode || '',
          deliveryInstructions: addressData.deliveryInstructions || ''
        });
      }
      
      setAddressesLoading(false);
    } catch (err) {
      console.error('Error updating address:', err);
      setAddressesLoading(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      setAddressesLoading(true);
      
      // Delete address from Firebase
      await deleteAddress(currentUser.uid, addressId);
      
      // Refresh saved addresses
      const addresses = await getSavedAddresses(currentUser.uid);
      setSavedAddresses(addresses);
      
      // If the deleted address was the selected one, select another one if available
      if (addressId === selectedAddressId) {
        if (addresses.length > 0) {
          const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
          setSelectedAddressId(defaultAddress.id);
          setShippingDetails({
            fullName: defaultAddress.fullName || '',
            phoneNumber: defaultAddress.phoneNumber || '',
            address: defaultAddress.address || '',
            city: defaultAddress.city || 'Addis Ababa',
            region: defaultAddress.region || 'Addis Ababa',
            zipCode: defaultAddress.zipCode || '',
            deliveryInstructions: defaultAddress.deliveryInstructions || ''
          });
        } else {
          setSelectedAddressId(null);
          setShippingDetails({
            fullName: currentUser.displayName || '',
            phoneNumber: currentUser.phoneNumber || '',
            address: '',
            city: 'Addis Ababa',
            region: 'Addis Ababa',
            zipCode: '',
            deliveryInstructions: ''
          });
          setShippingTabValue(1); // Switch to new address tab
        }
      }
      
      setAddressesLoading(false);
    } catch (err) {
      console.error('Error deleting address:', err);
      setAddressesLoading(false);
    }
  };

  // Handle set default address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      setAddressesLoading(true);
      
      // Update default address in Firebase
      await updateDefaultAddress(currentUser.uid, addressId);
      
      // Refresh saved addresses
      const addresses = await getSavedAddresses(currentUser.uid);
      setSavedAddresses(addresses);
      
      setAddressesLoading(false);
    } catch (err) {
      console.error('Error setting default address:', err);
      setAddressesLoading(false);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // If wallet is selected but balance is insufficient, show error
    if (method === 'wallet' && walletBalance < total) {
      setError(`Insufficient wallet balance. You need ${formatCurrency(total - walletBalance)} more.`);
    } else {
      setError('');
    }
  };

  // Handle next step
  const handleNext = () => {
    // Validate current step
    if (activeStep === 1) {
      // Validate shipping details
      if (shippingTabValue === 0) {
        // If using saved address, validate that one is selected
        if (!selectedAddressId) {
          setError('Please select an address');
          return;
        }
      } else {
        // If using new address, validate fields
        const { fullName, phoneNumber, address, city } = shippingDetails;
        if (!fullName || !phoneNumber || !address || !city) {
          setError('Please fill in all required fields');
          return;
        }
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
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Review Your Cart
            </Typography>
            
            {cart.items && cart.items.length === 0 ? (
              <Alert severity="info">Your cart is empty</Alert>
            ) : (
              <>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: { xs: 1, sm: 2 }, 
                    mb: 3,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {cart.items.map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        mb: 2, 
                        pb: 2, 
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}
                    >
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.name}
                        sx={{ 
                          width: { xs: '100%', sm: 80 }, 
                          height: { xs: 120, sm: 80 }, 
                          objectFit: 'cover', 
                          mr: { xs: 0, sm: 2 },
                          mb: { xs: 1, sm: 0 },
                          borderRadius: 1
                        }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{item.name}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'space-between', sm: 'flex-start' }, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            Quantity: {item.quantity}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price: {formatCurrency(item.price)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: { xs: 1, sm: 0 }, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Typography 
                          variant="subtitle1"
                          sx={{ 
                            fontWeight: 'bold',
                            background: theme.palette.primary.gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {formatCurrency(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(10px)',
                  }}
                >
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
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        background: theme.palette.primary.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(total)}
                    </Typography>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Shipping Details
            </Typography>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Tabs 
                value={shippingTabValue} 
                onChange={handleShippingTabChange}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab 
                  label="Saved Addresses" 
                  disabled={savedAddresses.length === 0}
                />
                <Tab label="New Address" />
              </Tabs>
              
              {shippingTabValue === 0 ? (
                <SavedAddresses
                  addresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleAddressSelect}
                  onSaveAddress={handleSaveAddress}
                  onUpdateAddress={handleUpdateAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onSetDefaultAddress={handleSetDefaultAddress}
                  loading={addressesLoading}
                />
              ) : (
                <Box>
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
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
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
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
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
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
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
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Region"
                        name="region"
                        value={shippingDetails.region}
                        onChange={handleShippingChange}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Zip Code"
                        name="zipCode"
                        value={shippingDetails.zipCode}
                        onChange={handleShippingChange}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
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
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={() => setSaveNewAddress(!saveNewAddress)}
                          sx={{ 
                            borderColor: saveNewAddress ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.23),
                            color: saveNewAddress ? theme.palette.primary.main : theme.palette.text.primary,
                            backgroundColor: saveNewAddress ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            '&:hover': {
                              backgroundColor: saveNewAddress ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.text.primary, 0.08)
                            }
                          }}
                        >
                          {saveNewAddress ? 'Address Will Be Saved' : 'Save This Address'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <PaymentOptions
              onPaymentMethodChange={handlePaymentMethodChange}
              totalAmount={total}
              walletBalance={walletBalance}
              theme={theme}
              isMobile={isMobile}
            />
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: { xs: 2, sm: 3 },
                mt: 3,
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                <Typography variant="body1">Tax</Typography>
                <Typography variant="body1">{formatCurrency(tax)}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    background: theme.palette.primary.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {formatCurrency(total)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            {orderComplete ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 3,
                  px: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  background: alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: 'blur(10px)',
                  boxShadow: theme.shadows[1],
                }}
              >
                <ConfirmIcon 
                  color="success" 
                  sx={{ 
                    fontSize: { xs: 48, sm: 64 }, 
                    mb: 2,
                    background: theme.palette.success.light,
                    borderRadius: '50%',
                    p: 1,
                    boxShadow: theme.shadows[2],
                  }} 
                />
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Thank You For Your Order!
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  Your order has been placed successfully.
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order ID: {orderId}
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/orders')}
                    sx={{ 
                      background: theme.palette.primary.gradient,
                      '&:hover': {
                        background: theme.palette.primary.gradientDark,
                      },
                    }}
                  >
                    View Orders
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        background: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    Continue Shopping
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Order Summary
                </Typography>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mb: 3,
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Payment Method
                  </Typography>
                  
                  <Typography variant="body2">
                    Wallet Payment
                  </Typography>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mt: 2,
                      borderRadius: 1,
                      '& .MuiAlert-icon': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {formatCurrency(total)} will be deducted from your wallet balance.
                  </Alert>
                </Paper>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Order Items
                  </Typography>
                  
                  {cart.items.map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        display: 'flex', 
                        mb: 2,
                        pb: 1,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {item.name} x {item.quantity}
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 'medium',
                        }}
                      >
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total</Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        background: theme.palette.primary.gradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(total)}
                    </Typography>
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
    <Container 
      maxWidth="md" 
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 4,
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          boxShadow: theme.shadows[3],
        }}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            mb: 3,
            background: theme.palette.primary.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          Checkout
        </Typography>
        
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 4,
            display: { xs: 'none', sm: 'flex' }
          }}
        >
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={CustomStepIcon}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Mobile Stepper - just shows current step */}
        <Box 
          sx={{ 
            display: { xs: 'flex', sm: 'none' }, 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
            Step {activeStep + 1} of {steps.length}:
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {steps[activeStep].label}
          </Typography>
          <Box sx={{ ml: 1 }}>
            {steps[activeStep].icon}
          </Box>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 1,
              '& .MuiAlert-icon': {
                color: theme.palette.error.main,
              },
            }}
          >
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading || orderComplete}
            onClick={handleBack}
            sx={{
              order: { xs: 2, sm: 1 },
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                background: alpha(theme.palette.primary.main, 0.1),
              },
              '&.Mui-disabled': {
                borderColor: alpha(theme.palette.text.disabled, 0.3),
              },
            }}
          >
            Back
          </Button>
          
          <Box sx={{ order: { xs: 1, sm: 2 } }}>
            {activeStep === steps.length - 1 && !orderComplete ? (
              <Button
                variant="contained"
                color="primary"
                onClick={placeOrder}
                disabled={loading}
                sx={{ 
                  background: theme.palette.primary.gradient,
                  '&:hover': {
                    background: theme.palette.primary.gradientDark,
                  },
                  minWidth: { xs: '100%', sm: 'auto' },
                }}
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
                disabled={activeStep === steps.length - 1 || loading || orderComplete}
                sx={{ 
                  background: theme.palette.primary.gradient,
                  '&:hover': {
                    background: theme.palette.primary.gradientDark,
                  },
                  minWidth: { xs: '100%', sm: 'auto' },
                }}
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
