import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Save as SaveIcon,
  Place as PlaceIcon
} from '@mui/icons-material';

// Known locations in Addis Ababa and Dire Dawa
const KNOWN_LOCATIONS = {
  'Addis Ababa': [
    'Bole', 'Kazanchis', 'Piassa', 'Merkato', 'Meskel Square', 'Mexico Square', 
    'Sarbet', 'Megenagna', 'Ayat', 'CMC', 'Gerji', 'Lideta', 'Jemo', 'Lebu',
    'Kality', 'Akaki', 'Shola', 'Arat Kilo', 'Sidist Kilo', 'Addis Ketema'
  ],
  'Dire Dawa': [
    'Kezira', 'Addis Ketema', 'Melka Jebdu', 'Sabian', 'Ashewa', 'Gendekore',
    'Legehare', 'Dechatu', 'Konel', 'Taiwan'
  ]
};

// Sub-cities in Addis Ababa and Dire Dawa
const SUB_CITIES = {
  'Addis Ababa': [
    'Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos',
    'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'
  ],
  'Dire Dawa': [
    'Dire Dawa City Administration'
  ]
};

const SavedAddresses = ({ 
  addresses, 
  selectedAddressId, 
  onSelectAddress, 
  onSaveAddress, 
  onUpdateAddress, 
  onDeleteAddress, 
  onSetDefaultAddress,
  loading 
}) => {
  const theme = useTheme();
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [addressFormMode, setAddressFormMode] = useState('add'); // 'add' or 'edit'
  const [currentAddress, setCurrentAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phoneNumber: '',
    addressType: 'home', // 'home', 'work', 'other'
    address: '',
    city: 'Addis Ababa',
    subCity: '',
    woreda: '',
    kebele: '',
    knownLocation: '',
    customLocation: '',
    deliveryInstructions: ''
  });
  const [formError, setFormError] = useState('');
  
  // Handle address selection
  const handleAddressSelect = (addressId) => {
    onSelectAddress(addressId);
  };
  
  // Open address dialog for adding new address
  const handleAddAddress = () => {
    setAddressFormMode('add');
    setCurrentAddress(null);
    setAddressForm({
      fullName: '',
      phoneNumber: '',
      addressType: 'home',
      address: '',
      city: 'Addis Ababa',
      subCity: '',
      woreda: '',
      kebele: '',
      knownLocation: '',
      customLocation: '',
      deliveryInstructions: ''
    });
    setOpenAddressDialog(true);
  };
  
  // Open address dialog for editing existing address
  const handleEditAddress = (address) => {
    setAddressFormMode('edit');
    setCurrentAddress(address);
    setAddressForm({
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber || '',
      addressType: address.addressType || 'home',
      address: address.address || '',
      city: address.city || 'Addis Ababa',
      subCity: address.subCity || '',
      woreda: address.woreda || '',
      kebele: address.kebele || '',
      knownLocation: address.knownLocation || '',
      customLocation: address.customLocation || '',
      deliveryInstructions: address.deliveryInstructions || ''
    });
    setOpenAddressDialog(true);
  };
  
  // Handle address form input change
  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    
    // Reset known location when city changes
    if (name === 'city') {
      setAddressForm(prev => ({
        ...prev,
        [name]: value,
        knownLocation: '',
        subCity: ''
      }));
    } else {
      setAddressForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle known location selection
  const handleKnownLocationChange = (event, value) => {
    setAddressForm(prev => ({
      ...prev,
      knownLocation: value || ''
    }));
  };
  
  // Save or update address
  const handleSaveAddress = () => {
    // Validate form
    if (!addressForm.fullName || !addressForm.phoneNumber || !addressForm.address || 
        !addressForm.city || !addressForm.subCity || !addressForm.woreda || !addressForm.kebele) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setFormError('');
    
    // Prepare address data with the combined address field
    const locationInfo = addressForm.knownLocation 
      ? `Near ${addressForm.knownLocation}` 
      : addressForm.customLocation 
        ? `Near ${addressForm.customLocation}` 
        : '';
    
    const formattedAddress = {
      ...addressForm,
      address: `${addressForm.address}${locationInfo ? `, ${locationInfo}` : ''}`,
      // Format the full address for display
      formattedAddress: `${addressForm.address}, Kebele ${addressForm.kebele}, Woreda ${addressForm.woreda}, ${addressForm.subCity}, ${addressForm.city}`
    };
    
    if (addressFormMode === 'add') {
      onSaveAddress(formattedAddress);
    } else {
      onUpdateAddress(currentAddress.id, formattedAddress);
    }
    
    setOpenAddressDialog(false);
  };
  
  // Delete address
  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      onDeleteAddress(addressId);
    }
  };
  
  // Set address as default
  const handleSetDefaultAddress = (addressId) => {
    onSetDefaultAddress(addressId);
  };
  
  // Get address type icon
  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon fontSize="small" />;
      case 'work':
        return <BusinessIcon fontSize="small" />;
      default:
        return <LocationOnIcon fontSize="small" />;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Saved Addresses
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddAddress}
          size="small"
        >
          Add New Address
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : addresses.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          You don't have any saved addresses. Add a new address to save it for future use.
        </Alert>
      ) : (
        <RadioGroup
          value={selectedAddressId || ''}
          onChange={(e) => handleAddressSelect(e.target.value)}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {addresses.map((address) => (
              <Paper
                key={address.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: selectedAddressId === address.id ? theme.palette.primary.main : 'inherit',
                  background: alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[2]
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Radio
                    checked={selectedAddressId === address.id}
                    onChange={() => handleAddressSelect(address.id)}
                    value={address.id}
                    name="address-radio"
                    sx={{ mt: -0.5, mr: 1 }}
                  />
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {getAddressTypeIcon(address.addressType)}
                      <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {address.addressType === 'home' ? 'Home' : 
                         address.addressType === 'work' ? 'Work' : 'Other'}
                      </Typography>
                      
                      {address.isDefault && (
                        <Box 
                          sx={{ 
                            ml: 1, 
                            px: 1, 
                            py: 0.2, 
                            borderRadius: 1, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        >
                          DEFAULT
                        </Box>
                      )}
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      {address.fullName}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {address.phoneNumber}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {address.address}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {address.formattedAddress || `Kebele ${address.kebele}, Woreda ${address.woreda}, ${address.subCity}, ${address.city}`}
                    </Typography>
                    
                    {address.deliveryInstructions && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        Note: {address.deliveryInstructions}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditAddress(address)}
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteAddress(address.id)}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    
                    {!address.isDefault && (
                      <IconButton 
                        size="small" 
                        onClick={() => handleSetDefaultAddress(address.id)}
                        sx={{ color: theme.palette.warning.main }}
                        title="Set as default"
                      >
                        <StarBorderIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </RadioGroup>
      )}
      
      {/* Address Form Dialog */}
      <Dialog 
        open={openAddressDialog} 
        onClose={() => setOpenAddressDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {addressFormMode === 'add' ? 'Add New Address' : 'Edit Address'}
        </DialogTitle>
        
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="fullName"
                value={addressForm.fullName}
                onChange={handleAddressFormChange}
                error={formError && !addressForm.fullName}
                helperText={formError && !addressForm.fullName ? 'Full name is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={addressForm.phoneNumber}
                onChange={handleAddressFormChange}
                error={formError && !addressForm.phoneNumber}
                helperText={formError && !addressForm.phoneNumber ? 'Phone number is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Address Type
              </Typography>
              
              <RadioGroup
                row
                name="addressType"
                value={addressForm.addressType}
                onChange={handleAddressFormChange}
              >
                <FormControlLabel value="home" control={<Radio />} label="Home" />
                <FormControlLabel value="work" control={<Radio />} label="Work" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="city-label">City</InputLabel>
                <Select
                  labelId="city-label"
                  name="city"
                  value={addressForm.city}
                  label="City"
                  onChange={handleAddressFormChange}
                >
                  <MenuItem value="Addis Ababa">Addis Ababa</MenuItem>
                  <MenuItem value="Dire Dawa">Dire Dawa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="sub-city-label">Sub City</InputLabel>
                <Select
                  labelId="sub-city-label"
                  name="subCity"
                  value={addressForm.subCity}
                  label="Sub City"
                  onChange={handleAddressFormChange}
                  error={formError && !addressForm.subCity}
                >
                  {SUB_CITIES[addressForm.city]?.map((subCity) => (
                    <MenuItem key={subCity} value={subCity}>{subCity}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Woreda"
                name="woreda"
                value={addressForm.woreda}
                onChange={handleAddressFormChange}
                error={formError && !addressForm.woreda}
                helperText={formError && !addressForm.woreda ? 'Woreda is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Kebele"
                name="kebele"
                value={addressForm.kebele}
                onChange={handleAddressFormChange}
                error={formError && !addressForm.kebele}
                helperText={formError && !addressForm.kebele ? 'Kebele is required' : ''}
              />
            </Grid>
            
            
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Nearby Landmark
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={KNOWN_LOCATIONS[addressForm.city] || []}
                    value={addressForm.knownLocation}
                    onChange={handleKnownLocationChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select a Known Location"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Or Enter Custom Location"
                    name="customLocation"
                    value={addressForm.customLocation}
                    onChange={handleAddressFormChange}
                    disabled={!!addressForm.knownLocation}
                    helperText={addressForm.knownLocation ? "Clear known location to use custom" : ""}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Instructions (Optional)"
                name="deliveryInstructions"
                value={addressForm.deliveryInstructions}
                onChange={handleAddressFormChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenAddressDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAddress} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            {addressFormMode === 'add' ? 'Save Address' : 'Update Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedAddresses;
