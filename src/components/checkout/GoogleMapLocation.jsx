import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, MAP_LIBRARIES } from '../../config/mapConfig';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

// Use the default center from config
const defaultCenter = DEFAULT_MAP_CENTER;

// Use the libraries from config
const libraries = MAP_LIBRARIES;

const GoogleMapLocation = ({ onLocationSelect, initialLocation = null }) => {
  const theme = useTheme();
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(initialLocation || defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(initialLocation || defaultCenter);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });
  
  // Get current location
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCenter(currentPosition);
          setMarkerPosition(currentPosition);
          
          // Reverse geocode to get address
          if (map && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: currentPosition }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setAddress(results[0].formatted_address);
                
                // Pass location data to parent
                onLocationSelect({
                  coordinates: currentPosition,
                  address: results[0].formatted_address
                });
              } else {
                setError('Could not find address for this location');
              }
            });
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setError('Error getting your location. Please try again or select manually.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, [map, onLocationSelect]);
  
  // Initialize map
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);
  
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);
  
  // Handle map click
  const handleMapClick = useCallback((event) => {
    const clickedPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setMarkerPosition(clickedPosition);
    
    // Reverse geocode to get address
    if (map && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: clickedPosition }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
          
          // Pass location data to parent
          onLocationSelect({
            coordinates: clickedPosition,
            address: results[0].formatted_address
          });
        } else {
          setError('Could not find address for this location');
        }
      });
    }
  }, [map, onLocationSelect]);
  
  // Search for address
  const searchAddress = useCallback(() => {
    if (!address) return;
    
    setLoading(true);
    setError('');
    
    if (map && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const position = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          
          setCenter(position);
          setMarkerPosition(position);
          
          // Pass location data to parent
          onLocationSelect({
            coordinates: position,
            address: results[0].formatted_address
          });
        } else {
          setError('Could not find this address. Please try another search.');
        }
        
        setLoading(false);
      });
    }
  }, [address, map, onLocationSelect]);
  
  // Handle address input change
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };
  
  // Handle enter key in search field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchAddress();
    }
  };
  
  // Load initial location if provided
  useEffect(() => {
    if (initialLocation) {
      setCenter(initialLocation);
      setMarkerPosition(initialLocation);
      
      // Reverse geocode to get address if not already set
      if (map && window.google && !address) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: initialLocation }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    }
  }, [initialLocation, map, address]);
  
  if (loadError) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading Google Maps: {loadError.message}
        </Alert>
        <Typography variant="body1" gutterBottom>
          To use the Google Maps feature, you need to:
        </Typography>
        <ol>
          <li>
            <Typography variant="body2" paragraph>
              Get a Google Maps API key from the <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              Enable the "Maps JavaScript API" and "Places API" services
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              Add your API key to the <code>src/config/mapConfig.js</code> file
            </Typography>
          </li>
        </ol>
        <Typography variant="body2" color="textSecondary">
          Until then, you can manually enter coordinates in the fields below.
        </Typography>
      </Paper>
    );
  }
  
  if (!isLoaded) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '400px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          p: 3
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading Google Maps...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Pin Your Location
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Search Address"
          value={address}
          onChange={handleAddressChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your address"
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={searchAddress}
          disabled={loading}
          sx={{ ml: 1 }}
        >
          <SearchIcon />
        </IconButton>
        <Tooltip title="Use my current location">
          <IconButton 
            color="primary" 
            onClick={getCurrentLocation}
            disabled={loading}
            sx={{ ml: 1 }}
          >
            <MyLocationIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 0,
          borderRadius: 2,
          overflow: 'hidden',
          background: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'all',
                elementType: 'all',
                stylers: [
                  { saturation: -100 }
                ]
              }
            ]
          }}
        >
          {window.google && (
            <Marker
              position={markerPosition}
              animation={window.google.maps.Animation.DROP}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: window.google ? new window.google.maps.Size(40, 40) : null
              }}
            />
          )}
        </GoogleMap>
        
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Click on the map to pin your exact location
        </Typography>
      </Box>
    </Box>
  );
};

export default GoogleMapLocation;
