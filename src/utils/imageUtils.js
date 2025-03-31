/**
 * Image utility functions for the Azone application
 */

// Fallback image URLs - use GitHub-hosted images for reliability
export const PRODUCT_FALLBACK_IMAGE = 'https://raw.githubusercontent.com/koehlersimon/fallback/master/Resources/Public/Images/placeholder.jpg';
export const SMALL_FALLBACK_IMAGE = 'https://raw.githubusercontent.com/koehlersimon/fallback/master/Resources/Public/Images/placeholder.jpg';
export const CART_FALLBACK_IMAGE = 'https://raw.githubusercontent.com/koehlersimon/fallback/master/Resources/Public/Images/placeholder.jpg';

/**
 * Get a product image URL with fallback
 * @param {Object} product - The product object
 * @returns {string} - The image URL
 */
export const getProductImageUrl = (product) => {
  if (!product) return PRODUCT_FALLBACK_IMAGE;
  
  // Try different possible image sources
  return product.imageUrl || 
         (product.images && product.images.length > 0 ? product.images[0] : null) || 
         PRODUCT_FALLBACK_IMAGE;
};

/**
 * Handle image loading errors by setting a fallback
 * @param {Event} event - The error event
 * @param {string} fallbackUrl - The fallback URL to use
 */
export const handleImageError = (event, fallbackUrl = PRODUCT_FALLBACK_IMAGE) => {
  event.target.onerror = null; // Prevent infinite loop
  event.target.src = fallbackUrl;
};
