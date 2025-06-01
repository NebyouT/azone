/**
 * Image utility functions for the DireMart application
 */

// Fallback image URLs - use reliable CDN sources
export const PRODUCT_FALLBACK_IMAGE = 'https://via.placeholder.com/300x300/f5f5f5/999999?text=No+Image';
export const SMALL_FALLBACK_IMAGE = 'https://via.placeholder.com/100x100/f5f5f5/999999?text=No+Image';
export const CART_FALLBACK_IMAGE = 'https://via.placeholder.com/80x80/f5f5f5/999999?text=No+Image';

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
