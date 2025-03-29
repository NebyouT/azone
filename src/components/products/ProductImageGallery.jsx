import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  useTheme, 
  useMediaQuery,
  Grid,
  Skeleton,
  Typography,
  alpha
} from '@mui/material';
import { 
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ProductImageGallery = ({ images = [], name }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState([]);

  // Ensure images is an array
  const imageArray = Array.isArray(images) ? images : [images];
  
  // Use a placeholder if no images are provided
  const displayImages = imageArray.length > 0 
    ? imageArray 
    : ['/placeholder-product.jpg'];

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleZoom = (image) => {
    setZoomedImage(image);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  const handleImageLoad = (index) => {
    setLoadedImages(prev => {
      if (!prev.includes(index)) {
        const newLoaded = [...prev, index];
        if (newLoaded.length === displayImages.length) {
          setLoading(false);
        }
        return newLoaded;
      }
      return prev;
    });
  };

  return (
    <>
      <Box sx={{ position: 'relative', mb: 2 }}>
        {/* Main Image */}
        <Paper 
          elevation={0}
          sx={{ 
            position: 'relative',
            borderRadius: 1,
            overflow: 'hidden',
            aspectRatio: '1/1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'white',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {loading && (
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              animation="wave"
            />
          )}
          
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={displayImages[currentIndex]}
              alt={`${name} - Image ${currentIndex + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: loading && !loadedImages.includes(currentIndex) ? 'none' : 'block',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onLoad={() => handleImageLoad(currentIndex)}
            />
          </AnimatePresence>

          {/* Zoom button */}
          <IconButton
            onClick={() => handleZoom(displayImages[currentIndex])}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              '&:hover': {
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              },
              zIndex: 2,
            }}
          >
            <ZoomInIcon />
          </IconButton>

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                  },
                  zIndex: 2,
                }}
              >
                <ArrowBackIosIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                  },
                  zIndex: 2,
                }}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Paper>

        {/* Image counter */}
        {displayImages.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: alpha(theme.palette.background.paper, 0.7),
              px: 1.5,
              py: 0.5,
              borderRadius: 4,
              zIndex: 2,
            }}
          >
            <Typography variant="caption" fontWeight="medium">
              {currentIndex + 1} / {displayImages.length}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <Grid container spacing={1}>
          {displayImages.map((image, index) => (
            <Grid item xs={3} sm={2} key={index}>
              <Paper
                elevation={0}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 1,
                  overflow: 'hidden',
                  aspectRatio: '1/1',
                  border: index === currentIndex 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : `1px solid ${theme.palette.divider}`,
                  opacity: index === currentIndex ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              >
                <img
                  src={image}
                  alt={`${name} thumbnail ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onLoad={() => handleImageLoad(index)}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            zIndex: theme.zIndex.modal,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
          onClick={handleCloseZoom}
        >
          <IconButton
            onClick={handleCloseZoom}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={zoomedImage}
            alt={`${name} zoomed`}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
            }}
          />
        </Box>
      )}
    </>
  );
};

export default ProductImageGallery;
