import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Component to select product variants like size, color, etc.
 * 
 * @param {Object} props
 * @param {Array} props.variants - Array of variant objects
 * @param {Function} props.onVariantChange - Callback when variant is selected
 */
const ProductVariantSelector = ({ variants = [], onVariantChange }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [selectedVariants, setSelectedVariants] = useState({});
  
  // Group variants by type (e.g., color, size)
  const variantGroups = variants.reduce((groups, variant) => {
    const { type, value, price, stock, image } = variant;
    
    if (!groups[type]) {
      groups[type] = [];
    }
    
    // Only add unique values
    if (!groups[type].some(v => v.value === value)) {
      groups[type].push({ value, price, stock, image });
    }
    
    return groups;
  }, {});
  
  useEffect(() => {
    // Notify parent component when selection changes
    if (Object.keys(selectedVariants).length > 0) {
      onVariantChange(selectedVariants);
    }
  }, [selectedVariants, onVariantChange]);
  
  const handleVariantSelect = (type, value, price, stock, image) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: { value, price, stock, image }
    }));
  };
  
  // If no variants, don't render anything
  if (!variants || variants.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 3 }}>
      {Object.entries(variantGroups).map(([type, values]) => (
        <Box key={type} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, textTransform: 'capitalize' }}>
            {t(type.toLowerCase()) || type}
          </Typography>
          
          <Grid container spacing={1}>
            {values.map((variant, index) => {
              const isSelected = selectedVariants[type]?.value === variant.value;
              const isOutOfStock = variant.stock <= 0;
              
              // For color variants, show color swatches
              if (type.toLowerCase() === 'color') {
                return (
                  <Grid item key={index}>
                    <Box
                      onClick={() => !isOutOfStock && handleVariantSelect(type, variant.value, variant.price, variant.stock, variant.image)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: variant.value.toLowerCase(),
                        border: isSelected 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : `1px solid ${theme.palette.divider}`,
                        boxShadow: isSelected ? 2 : 0,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        opacity: isOutOfStock ? 0.5 : 1,
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '&:hover': {
                          borderColor: isOutOfStock ? theme.palette.divider : theme.palette.primary.main,
                        },
                      }}
                    >
                      {isSelected && (
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: theme.palette.getContrastText(variant.value.toLowerCase()),
                          }}
                        />
                      )}
                      {isOutOfStock && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'rgba(0,0,0,0.2)',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'white', fontSize: '8px' }}>
                            {t('outOfStock')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              }
              
              // For size or other variants, show buttons/chips
              return (
                <Grid item key={index}>
                  <Button
                    variant={isSelected ? "contained" : "outlined"}
                    onClick={() => !isOutOfStock && handleVariantSelect(type, variant.value, variant.price, variant.stock, variant.image)}
                    disabled={isOutOfStock}
                    size="small"
                    sx={{
                      minWidth: type.toLowerCase() === 'size' ? 50 : 'auto',
                      border: isSelected ? 'none' : `1px solid ${theme.palette.divider}`,
                      color: isSelected ? 'white' : theme.palette.text.primary,
                      bgcolor: isSelected ? theme.palette.primary.main : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected 
                          ? theme.palette.primary.dark 
                          : alpha(theme.palette.primary.main, 0.05),
                        borderColor: isSelected ? 'none' : theme.palette.primary.main,
                      },
                      textTransform: 'none',
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                  >
                    {variant.value}
                    {variant.price > 0 && ` (+${variant.price})`}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default ProductVariantSelector;
