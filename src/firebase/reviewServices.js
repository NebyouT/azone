import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a new review for a product
 * @param {string} userId - User ID of the reviewer
 * @param {string} productId - Product ID being reviewed
 * @param {string} orderId - Order ID associated with the review
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Review text
 * @param {Array} images - Array of image files to upload
 * @returns {Promise<string>} - ID of the created review
 */
export const addReview = async (userId, productId, orderId, rating, comment, images = []) => {
  try {
    // First check if the order exists and is delivered
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    if (orderData.userId !== userId) {
      throw new Error('You can only review products from your own orders');
    }
    
    if (orderData.status !== 'delivered') {
      throw new Error('You can only review products that have been delivered');
    }
    
    // Check if user has already reviewed this product in this order
    const existingReviewQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      where('productId', '==', productId),
      where('orderId', '==', orderId)
    );
    
    const existingReviewSnap = await getDocs(existingReviewQuery);
    if (!existingReviewSnap.empty) {
      throw new Error('You have already reviewed this product from this order');
    }
    
    // Upload images if any
    const imageUrls = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const imageId = uuidv4();
        const imageRef = ref(storage, `reviews/${userId}/${productId}/${imageId}`);
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
    }
    
    // Create the review
    const reviewData = {
      userId,
      productId,
      orderId,
      rating,
      comment,
      images: imageUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      helpful: 0,
      notHelpful: 0,
      status: 'active' // For moderation purposes
    };
    
    const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
    
    // Update product's rating
    await updateProductRating(productId);
    
    return reviewRef.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

/**
 * Get reviews for a product
 * @param {string} productId - Product ID
 * @param {number} pageSize - Number of reviews to fetch
 * @param {string} sortBy - Field to sort by ('createdAt', 'rating', 'helpful')
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @param {number} ratingFilter - Filter by rating (1-5, 0 for all)
 * @returns {Promise<Array>} - Array of reviews
 */
export const getProductReviews = async (
  productId, 
  pageSize = 10, 
  sortBy = 'createdAt', 
  sortOrder = 'desc',
  ratingFilter = 0
) => {
  try {
    let reviewsQuery;
    
    if (ratingFilter > 0) {
      reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        where('status', '==', 'active'),
        where('rating', '==', ratingFilter),
        orderBy(sortBy, sortOrder),
        limit(pageSize)
      );
    } else {
      reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        where('status', '==', 'active'),
        orderBy(sortBy, sortOrder),
        limit(pageSize)
      );
    }
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = [];
    
    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data();
      
      // Get user details
      const userRef = doc(db, 'users', reviewData.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : { displayName: 'Anonymous' };
      
      reviews.push({
        id: reviewDoc.id,
        ...reviewData,
        user: {
          id: reviewData.userId,
          name: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL || null
        }
      });
    }
    
    return reviews;
  } catch (error) {
    console.error('Error getting product reviews:', error);
    throw error;
  }
};

/**
 * Get reviews by a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of reviews
 */
export const getUserReviews = async (userId) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = [];
    
    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data();
      
      // Get product details
      const productRef = doc(db, 'products', reviewData.productId);
      const productSnap = await getDoc(productRef);
      const productData = productSnap.exists() ? productSnap.data() : { name: 'Product not found' };
      
      reviews.push({
        id: reviewDoc.id,
        ...reviewData,
        product: {
          id: reviewData.productId,
          name: productData.name,
          imageUrl: productData.imageUrl || productData.images?.[0] || null
        }
      });
    }
    
    return reviews;
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
};

/**
 * Update an existing review
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID (for verification)
 * @param {Object} updateData - Data to update (rating, comment)
 * @param {Array} newImages - New images to add
 * @param {Array} imagesToDelete - Image URLs to delete
 * @returns {Promise<void>}
 */
export const updateReview = async (reviewId, userId, updateData, newImages = [], imagesToDelete = []) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }
    
    const reviewData = reviewSnap.data();
    if (reviewData.userId !== userId) {
      throw new Error('You can only update your own reviews');
    }
    
    // Handle image deletions
    const updatedImages = [...reviewData.images];
    
    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        // Extract the path from the URL
        const imagePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
        const imageRef = ref(storage, imagePath);
        
        try {
          await deleteObject(imageRef);
          // Remove from the images array
          const index = updatedImages.indexOf(imageUrl);
          if (index > -1) {
            updatedImages.splice(index, 1);
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with other deletions even if one fails
        }
      }
    }
    
    // Handle new image uploads
    if (newImages.length > 0) {
      for (const image of newImages) {
        const imageId = uuidv4();
        const imageRef = ref(storage, `reviews/${userId}/${reviewData.productId}/${imageId}`);
        await uploadBytes(imageRef, image);
        const imageUrl = await getDownloadURL(imageRef);
        updatedImages.push(imageUrl);
      }
    }
    
    // Update the review
    await updateDoc(reviewRef, {
      ...updateData,
      images: updatedImages,
      updatedAt: serverTimestamp()
    });
    
    // If rating changed, update product's rating
    if (updateData.rating && updateData.rating !== reviewData.rating) {
      await updateProductRating(reviewData.productId);
    }
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId, userId) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }
    
    const reviewData = reviewSnap.data();
    if (reviewData.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }
    
    // Delete associated images
    if (reviewData.images && reviewData.images.length > 0) {
      for (const imageUrl of reviewData.images) {
        try {
          // Extract the path from the URL
          const imagePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue with other deletions even if one fails
        }
      }
    }
    
    // Delete the review
    await deleteDoc(reviewRef);
    
    // Update product's rating
    await updateProductRating(reviewData.productId);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

/**
 * Mark a review as helpful or not helpful
 * @param {string} reviewId - Review ID
 * @param {string} userId - User ID
 * @param {boolean} isHelpful - Whether the review is helpful
 * @returns {Promise<void>}
 */
export const markReviewHelpfulness = async (reviewId, userId, isHelpful) => {
  try {
    // Check if user has already voted
    const voteQuery = query(
      collection(db, 'reviewVotes'),
      where('reviewId', '==', reviewId),
      where('userId', '==', userId)
    );
    
    const voteSnapshot = await getDocs(voteQuery);
    
    if (!voteSnapshot.empty) {
      throw new Error('You have already voted on this review');
    }
    
    // Add vote record
    await addDoc(collection(db, 'reviewVotes'), {
      reviewId,
      userId,
      isHelpful,
      createdAt: serverTimestamp()
    });
    
    // Update review helpfulness count
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }
    
    const reviewData = reviewSnap.data();
    
    await updateDoc(reviewRef, {
      helpful: isHelpful ? reviewData.helpful + 1 : reviewData.helpful,
      notHelpful: !isHelpful ? reviewData.notHelpful + 1 : reviewData.notHelpful
    });
  } catch (error) {
    console.error('Error marking review helpfulness:', error);
    throw error;
  }
};

/**
 * Get eligible orders for review (delivered orders that haven't been reviewed yet)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of eligible orders with products
 */
export const getEligibleOrdersForReview = async (userId) => {
  try {
    // Get delivered orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', '==', 'delivered')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const eligibleOrders = [];
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      const orderId = orderDoc.id;
      
      // For each product in the order
      const eligibleProducts = [];
      
      for (const item of orderData.items) {
        // Check if already reviewed
        const reviewQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', userId),
          where('productId', '==', item.id),
          where('orderId', '==', orderId)
        );
        
        const reviewSnapshot = await getDocs(reviewQuery);
        
        if (reviewSnapshot.empty) {
          // Not reviewed yet, get product details
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            const productData = productSnap.data();
            eligibleProducts.push({
              id: item.id,
              name: productData.name,
              imageUrl: productData.imageUrl || productData.images?.[0] || null,
              quantity: item.quantity
            });
          }
        }
      }
      
      if (eligibleProducts.length > 0) {
        eligibleOrders.push({
          id: orderId,
          orderNumber: orderData.orderNumber,
          date: orderData.createdAt,
          products: eligibleProducts
        });
      }
    }
    
    return eligibleOrders;
  } catch (error) {
    console.error('Error getting eligible orders for review:', error);
    throw error;
  }
};

/**
 * Update product rating based on reviews
 * @param {string} productId - Product ID
 * @returns {Promise<void>}
 */
export const updateProductRating = async (productId) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('status', '==', 'active')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    if (reviewsSnapshot.empty) {
      // No reviews, reset rating
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        rating: 0,
        reviewCount: 0
      });
      return;
    }
    
    let totalRating = 0;
    const reviewCount = reviewsSnapshot.size;
    
    reviewsSnapshot.forEach(doc => {
      const reviewData = doc.data();
      totalRating += reviewData.rating;
    });
    
    const averageRating = totalRating / reviewCount;
    
    // Update product
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      rating: averageRating,
      reviewCount
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

/**
 * Get review statistics for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} - Review statistics
 */
export const getReviewStatistics = async (productId) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('status', '==', 'active')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    if (reviewsSnapshot.empty) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        },
        withImages: 0,
        withComments: 0
      };
    }
    
    let totalRating = 0;
    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    let withImages = 0;
    let withComments = 0;
    
    reviewsSnapshot.forEach(doc => {
      const reviewData = doc.data();
      totalRating += reviewData.rating;
      ratingCounts[reviewData.rating] = (ratingCounts[reviewData.rating] || 0) + 1;
      
      if (reviewData.images && reviewData.images.length > 0) {
        withImages++;
      }
      
      if (reviewData.comment && reviewData.comment.trim() !== '') {
        withComments++;
      }
    });
    
    return {
      averageRating: totalRating / reviewsSnapshot.size,
      totalReviews: reviewsSnapshot.size,
      ratingCounts,
      withImages,
      withComments
    };
  } catch (error) {
    console.error('Error getting review statistics:', error);
    throw error;
  }
};
