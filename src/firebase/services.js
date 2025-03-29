import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { app } from './config';
import { uploadImage, getPublicIdFromUrl } from '../cloudinary/services';
import { initializeWallet, processPayment, transferFundsToSellerForCompletedOrder } from './walletServices';

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

facebookProvider.setCustomParameters({
  'display': 'popup'
});

appleProvider.addScope('email');
appleProvider.addScope('name');

// Validate Ethiopian phone number
export const validateEthiopianPhoneNumber = (phoneNumber) => {
  // Ethiopian phone numbers can be in formats:
  // +251 9XXXXXXXX
  // 251 9XXXXXXXX
  // 09XXXXXXXX
  // 9XXXXXXXX
  const ethiopianPhoneRegex = /^(\+251|251)?9\d{8}$/;
  
  // Remove any spaces, dashes or parentheses
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If the number starts with 0, remove it and add the country code
  if (cleanNumber.startsWith('0')) {
    return ethiopianPhoneRegex.test('251' + cleanNumber.substring(1));
  }
  
  // If it's just 9 digits starting with 9, add the country code
  if (cleanNumber.length === 9 && cleanNumber.startsWith('9')) {
    return ethiopianPhoneRegex.test('251' + cleanNumber);
  }
  
  // Otherwise test as is
  return ethiopianPhoneRegex.test(cleanNumber);
};

// Format Ethiopian phone number to standard format
export const formatEthiopianPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, remove it
  if (cleanNumber.startsWith('0')) {
    return '+251' + cleanNumber.substring(1);
  }
  
  // If it's just 9 digits starting with 9
  if (cleanNumber.length === 9 && cleanNumber.startsWith('9')) {
    return '+251' + cleanNumber;
  }
  
  // If it already has the country code without +
  if (cleanNumber.startsWith('251') && cleanNumber.length === 12) {
    return '+' + cleanNumber;
  }
  
  // If it already has the full format with +
  if (cleanNumber.startsWith('251') && cleanNumber.length === 12) {
    return '+' + cleanNumber;
  }
  
  return phoneNumber; // Return as is if it doesn't match expected formats
};

// User Registration
export const registerUser = async (email, password, displayName, phoneNumber, role = 'buyer') => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Format phone number if provided
    let formattedPhoneNumber = '';
    if (phoneNumber) {
      formattedPhoneNumber = formatEthiopianPhoneNumber(phoneNumber);
    }
    
    // Create user document in Firestore
    const userData = {
      uid: user.uid,
      displayName,
      email,
      phoneNumber: formattedPhoneNumber,
      role,
      emailVerified: false,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    // Initialize wallet for the new user
    await initializeWallet(user.uid, role);
    
    // Send email verification
    try {
      await sendEmailVerification(user, {
        url: window.location.origin + '/login?verified=true',
        handleCodeInApp: false
      });
      console.log('Verification email sent to', email);
    } catch (verificationError) {
      console.error('Error sending verification email:', verificationError);
      // Don't throw here, as the user is still created
    }
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Check if user's email is verified
export const isEmailVerified = (user) => {
  if (!user) return false;
  
  // Reload the user to get the most current data
  return user.emailVerified;
};

// Reload user to get fresh data (including emailVerified status)
export const reloadUser = async (user) => {
  if (!user) throw new Error('User is required');
  
  try {
    await user.reload();
    return user;
  } catch (error) {
    console.error('Error reloading user:', error);
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (user) => {
  if (!user) throw new Error('User is required');
  
  try {
    await sendEmailVerification(user, {
      url: window.location.origin + '/login?verified=true',
      handleCodeInApp: false
    });
    return true;
  } catch (error) {
    console.error('Error resending verification email:', error);
    throw error;
  }
};

// Update user's email verification status in Firestore
export const updateEmailVerificationStatus = async (userId, isVerified) => {
  if (!userId) throw new Error('User ID is required');
  
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      emailVerified: isVerified,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating email verification status:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update the verification status in Firestore if it's changed
    const user = userCredential.user;
    if (user.emailVerified) {
      try {
        await updateEmailVerificationStatus(user.uid, true);
      } catch (updateError) {
        console.error('Error updating verification status:', updateError);
        // Don't throw here as login was successful
      }
    }
    
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    });
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Confirm password reset with code and new password
export const confirmPasswordResetWithCode = async (code, newPassword) => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return true;
  } catch (error) {
    console.error("Password reset confirmation error:", error);
    throw error;
  }
};

// Verify password reset code
export const verifyPasswordResetWithCode = async (code) => {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return email;
  } catch (error) {
    console.error("Password reset code verification error:", error);
    throw error;
  }
};

// Apply action code (for email verification, password reset, etc.)
export const applyActionCodeHandler = async (code) => {
  try {
    await applyActionCode(auth, code);
    return true;
  } catch (error) {
    console.error("Apply action code error:", error);
    throw error;
  }
};

// Reauthenticate user (required for sensitive operations)
export const reauthenticateUser = async (user, password) => {
  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return true;
  } catch (error) {
    console.error("Reauthentication error:", error);
    throw error;
  }
};

// Authentication services
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// Social Authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const userData = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        role: 'buyer', // Default role for social sign-ins
        createdAt: serverTimestamp(),
        provider: 'google'
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Initialize wallet for the new user
      await initializeWallet(user.uid, 'buyer');
    }
    
    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const userData = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        role: 'buyer', // Default role for social sign-ins
        createdAt: serverTimestamp(),
        provider: 'facebook'
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Initialize wallet for the new user
      await initializeWallet(user.uid, 'buyer');
    }
    
    return user;
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    throw error;
  }
};

export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const userData = {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        photoURL: user.photoURL || '',
        role: 'buyer', // Default role for social sign-ins
        createdAt: serverTimestamp(),
        provider: 'apple'
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Initialize wallet for the new user
      await initializeWallet(user.uid, 'buyer');
    }
    
    return user;
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw error;
  }
};

// User profile services
export const updateUserProfile = async (userId, displayName, phoneNumber, role) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    // Format phone number if provided
    let formattedPhoneNumber = '';
    if (phoneNumber) {
      formattedPhoneNumber = formatEthiopianPhoneNumber(phoneNumber);
    }
    
    // Update auth profile
    if (displayName) {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
    }
    
    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayName: displayName || '',
      phoneNumber: formattedPhoneNumber,
      role: role || 'buyer',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Helper function to get user document
updateUserProfile.getUserDocument = async (userId) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    throw error;
  }
};

// Product services
export const getProducts = async (categoryFilter = null, sortBy = 'createdAt', limitCount = 50) => {
  try {
    let productsQuery;
    
    if (categoryFilter) {
      productsQuery = query(
        collection(db, 'products'),
        where('category', '==', categoryFilter),
        orderBy(sortBy, 'desc'),
        limit(limitCount)
      );
    } else {
      productsQuery = query(
        collection(db, 'products'),
        orderBy(sortBy, 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(productsQuery);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data()
      };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
};

export const addProduct = async (productData, imageFile, additionalImageFiles = []) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to add a product');
    
    // Upload product image to Cloudinary if provided
    let imageUrl = null;
    if (imageFile) {
      // Upload to Cloudinary with seller ID as part of the folder path
      imageUrl = await uploadImage(imageFile, `products/${currentUser.uid}`);
    }
    
    // Upload additional images if provided
    let additionalImages = [];
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      // Process each additional image
      const uploadPromises = additionalImageFiles.map(file => 
        uploadImage(file, `products/${currentUser.uid}/additional`)
      );
      
      // Wait for all uploads to complete
      additionalImages = await Promise.all(uploadPromises);
    } else if (productData.additionalImages && productData.additionalImages.length > 0) {
      // Use existing additional images from form data if available (e.g., from data URLs)
      additionalImages = productData.additionalImages;
    }
    
    // Create product document in Firestore
    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      imageUrl,
      additionalImages,
      sellerId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return productRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (productId, productData, newImageFile, additionalImageFiles = []) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to update a product');
    
    // Get the product document
    const productDoc = await getDoc(doc(db, 'products', productId));
    
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }
    
    const productData_old = productDoc.data();
    
    // Check if the product belongs to this seller
    if (productData_old.sellerId !== currentUser.uid) {
      throw new Error("You don't have permission to update this product");
    }
    
    // Upload new main image if provided
    let imageUrl = productData.imageUrl;
    if (newImageFile) {
      imageUrl = await uploadImage(newImageFile, `products/${currentUser.uid}`);
    }
    
    // Process additional images
    let additionalImages = productData.additionalImages || [];
    
    // If new additional image files are provided, upload them
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      const uploadPromises = additionalImageFiles.map(file => 
        uploadImage(file, `products/${currentUser.uid}/additional`)
      );
      
      // Get new image URLs and append to existing ones
      const newAdditionalImages = await Promise.all(uploadPromises);
      
      // Filter out data URLs from existing additionalImages (they're newly added in the form but not yet uploaded)
      const existingCloudinaryImages = additionalImages.filter(url => 
        url.startsWith('http') && !url.startsWith('data:')
      );
      
      additionalImages = [...existingCloudinaryImages, ...newAdditionalImages];
    }
    
    // Update product in Firestore
    await updateDoc(doc(db, 'products', productId), {
      ...productData,
      imageUrl,
      additionalImages,
      updatedAt: serverTimestamp()
    });
    
    return productId;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to delete a product');
    
    // Get the current product data
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    
    const productDetails = productSnap.data();
    
    // Verify that the current user is the seller of this product
    if (productDetails.sellerId !== currentUser.uid) {
      throw new Error('You do not have permission to delete this product');
    }
    
    // We don't need to delete the image from Cloudinary as it will be handled by Cloudinary's auto cleanup
    // Just log the public ID for reference
    if (productDetails.imageUrl) {
      const publicId = getPublicIdFromUrl(productDetails.imageUrl);
      console.log(`Image with public ID ${publicId} will be automatically cleaned up by Cloudinary`);
    }
    
    // Delete product document from Firestore
    await deleteDoc(productRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// Cart services
export const getCart = async (userId) => {
  try {
    const cartRef = doc(db, 'carts', userId);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      return cartSnap.data();
    } else {
      // Initialize empty cart if it doesn't exist
      const emptyCart = { items: [], total: 0 };
      await setDoc(cartRef, emptyCart);
      return emptyCart;
    }
  } catch (error) {
    console.error("Error getting cart:", error);
    throw error;
  }
};

export const updateCart = async (userId, cartItems) => {
  try {
    // Calculate total
    let total = 0;
    cartItems.forEach(item => {
      total += item.price * item.quantity;
    });
    
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, { items: cartItems, total });
    
    return { items: cartItems, total };
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
};

// Order services
export const createOrder = async (userId, orderData) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    // Ensure orderData is an object
    if (!orderData || typeof orderData !== 'object') {
      throw new Error('Invalid order data');
    }
    
    // Add userId and timestamps to order data
    const completeOrderData = {
      ...orderData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || 'pending',
      // Ensure shippingAddress is properly set
      shippingAddress: orderData.shippingAddress || orderData.shippingDetails || {}
    };
    
    // Create order document
    const ordersRef = collection(db, 'orders');
    const orderRef = await addDoc(ordersRef, completeOrderData);
    
    // Add the order ID to the data before creating seller orders
    const orderWithId = {
      ...completeOrderData,
      id: orderRef.id
    };
    
    // Create separate seller orders
    await createSellerOrders(orderWithId);
    
    // If using wallet payment, process the payment AFTER order creation
    // This is done outside the transaction to avoid the "reads before writes" error
    if (orderData.paymentMethod === 'wallet') {
      try {
        // Get seller ID from first item (assuming all items are from same seller for now)
        const sellerId = orderData.items?.[0]?.sellerId;
        
        if (sellerId) {
          await processPayment(userId, sellerId, orderData.total, orderRef.id);
          
          // Update order payment status to 'paid'
          await updateDoc(orderRef, {
            paymentStatus: 'paid',
            updatedAt: serverTimestamp()
          });
        }
      } catch (paymentError) {
        console.error("Error processing payment:", paymentError);
        // Don't fail the order creation if payment fails
        // We'll have a background job to retry failed payments
      }
    }
    
    return {
      id: orderRef.id,
      ...completeOrderData
    };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getUserOrders = async (userId, includeHidden = false) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const ordersRef = collection(db, 'orders');
    
    // First try: Simple query without compound conditions to avoid index errors
    try {
      // Use a simple query that doesn't require a composite index
      const simpleQuery = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const allOrders = [];
      
      querySnapshot.forEach((doc) => {
        allOrders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Filter in memory based on the includeHidden parameter
      return includeHidden 
        ? allOrders 
        : allOrders.filter(order => order.isHidden !== true);
    } 
    catch (error) {
      // If even the simple query fails, try an even more basic approach
      console.warn('Error with simple query, using most basic approach:', error.message);
      
      // Get all orders for the user without any ordering
      const basicQuery = query(
        ordersRef,
        where('userId', '==', userId)
      );
      
      const basicSnapshot = await getDocs(basicQuery);
      const basicOrders = [];
      
      basicSnapshot.forEach((doc) => {
        basicOrders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory
      basicOrders.sort((a, b) => {
        // Handle cases where createdAt might be missing
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        
        // Convert to timestamps if they are Firestore timestamps
        const timeA = a.createdAt.toDate ? a.createdAt.toDate().getTime() : a.createdAt;
        const timeB = b.createdAt.toDate ? b.createdAt.toDate().getTime() : b.createdAt;
        
        return timeB - timeA; // descending order
      });
      
      // Filter in memory based on the includeHidden parameter
      return includeHidden 
        ? basicOrders 
        : basicOrders.filter(order => order.isHidden !== true);
    }
  } catch (err) {
    console.error('Failed to fetch user orders:', err);
    
    // Provide helpful information about creating the required index
    if (err.message && err.message.includes('index')) {
      const indexUrl = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
      if (indexUrl) {
        console.info('Please create the required Firestore index using this link:', indexUrl);
      }
    }
    
    throw err;
  }
};

export const getOrderById = async (orderId) => {
  try {
    if (!orderId) throw new Error('Order ID is required');
    
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists()) {
      return {
        id: orderDoc.id,
        ...orderDoc.data()
      };
    }
    
    throw new Error('Order not found');
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { 
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// Seller Product Management
export const getSellerProducts = async (sellerId) => {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    try {
      // First attempt with ordering (requires composite index)
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(productsQuery);
      const products = [];
      
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return products;
    } catch (indexError) {
      // If the index error occurs, use a fallback approach
      console.warn('Index error occurred, using fallback method:', indexError.message);
      
      // Fallback: Get all orders for the user without sorting
      const productsRef = collection(db, 'products');
      const fallbackQuery = query(
        productsRef,
        where('sellerId', '==', sellerId)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      let fallbackProducts = [];
      
      fallbackSnapshot.forEach((doc) => {
        fallbackProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort the results in memory instead
      fallbackProducts.sort((a, b) => {
        // Handle missing createdAt fields
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        
        return dateB - dateA; // descending order
      });
      
      return fallbackProducts;
    }
  } catch (error) {
    console.error("Error getting seller products:", error);
    throw error;
  }
};

// Order Management
export const getSellerOrders = async (sellerId) => {
  try {
    try {
      // Try the query with index first
      const ordersQuery = query(
        collection(db, 'orders'),
        where('items', 'array-contains', { sellerId }),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        // Filter items to only include this seller's items
        const orderData = doc.data();
        const sellerItems = orderData.items.filter(item => item.sellerId === sellerId);
        
        // Calculate total for this seller's items
        const sellerTotal = sellerItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        orders.push({
          id: doc.id,
          ...orderData,
          sellerItems,
          sellerTotal
        });
      });
      
      return orders;
    } catch (indexError) {
      // If the index error occurs, use a fallback approach
      console.warn('Index error occurred, using fallback method for seller orders:', indexError.message);
      
      // Fallback: Get all orders and filter in memory
      // This query doesn't require a composite index
      const ordersRef = collection(db, 'orders');
      const fallbackSnapshot = await getDocs(ordersRef);
      const orders = [];
      
      fallbackSnapshot.forEach((doc) => {
        const orderData = doc.data();
        
        // Check if this order contains items from this seller
        if (orderData.items && Array.isArray(orderData.items)) {
          const sellerItems = orderData.items.filter(item => item.sellerId === sellerId);
          
          // Only include orders that have items from this seller
          if (sellerItems.length > 0) {
            // Calculate total for this seller's items
            const sellerTotal = sellerItems.reduce((total, item) => {
              return total + (item.price * item.quantity);
            }, 0);
            
            orders.push({
              id: doc.id,
              ...orderData,
              sellerItems,
              sellerTotal
            });
          }
        }
      });
      
      // Sort the results in memory (not as efficient, but works without index)
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // descending order
      });
      
      // Display a message to create the index
      console.info(
        'Please create the required Firestore index using this link:',
        indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0] || 
        'https://console.firebase.google.com/project/_/firestore/indexes'
      );
      
      return orders;
    }
  } catch (error) {
    console.error("Error getting seller orders:", error);
    throw error;
  }
};

export const updateOrderStatusForSeller = async (orderId, status, sellerId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to update an order');
    
    // Get the current order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Check if this seller has items in this order
    const hasSellerItems = orderData.items.some(item => item.sellerId === sellerId);
    
    if (!hasSellerItems) {
      throw new Error('You do not have permission to update this order');
    }
    
    // Update the status for this seller's items
    const updatedItems = orderData.items.map(item => {
      if (item.sellerId === sellerId) {
        return { ...item, status };
      }
      return item;
    });
    
    // Create a notification for the customer
    const notificationMessage = getStatusNotificationMessage(status, orderData.sellerName || 'Seller');
    
    // Add notification to the order
    const notification = {
      message: notificationMessage,
      timestamp: serverTimestamp(),
      status,
      sellerId,
      sellerName: currentUser.displayName || 'Seller'
    };
    
    const notifications = orderData.notifications || [];
    notifications.push(notification);
    
    // Update order document
    await updateDoc(orderRef, {
      items: updatedItems,
      notifications,
      updatedAt: serverTimestamp()
    });
    
    // Add a notification to the user's notifications collection if it exists
    try {
      if (orderData.userId) {
        const userNotificationRef = collection(db, 'users', orderData.userId, 'notifications');
        await addDoc(userNotificationRef, {
          type: 'order_update',
          orderId,
          message: notificationMessage,
          status,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification creation fails
      console.warn('Failed to create user notification:', notificationError);
    }
    
    // Update order history
    const historyRef = collection(db, 'orders', orderId, 'history');
    await addDoc(historyRef, {
      status,
      sellerId,
      sellerName: currentUser.displayName || 'Seller',
      timestamp: serverTimestamp(),
      note: `Order status updated to ${status} by seller`
    });
    
    return true;
  } catch (error) {
    console.error("Error updating order status for seller:", error);
    throw error;
  }
};

// Helper function to generate notification messages based on status
const getStatusNotificationMessage = (status, sellerName) => {
  switch (status) {
    case 'processing':
      return `Your order has been accepted by ${sellerName} and is being processed.`;
    case 'shipped':
      return `Your order has been shipped by ${sellerName}.`;
    case 'completed':
      return `Your order has been marked as delivered by ${sellerName}.`;
    case 'cancelled':
      return `Your order has been cancelled by ${sellerName}.`;
    default:
      return `Your order status has been updated to ${status} by ${sellerName}.`;
  }
};

// Create a separate seller order when a buyer places an order
export const createSellerOrders = async (orderData) => {
  try {
    // Ensure we have a valid order ID and items
    if (!orderData?.id) {
      console.error("Cannot create seller orders: Missing order ID");
      return false;
    }
    
    if (!orderData?.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error("Cannot create seller orders: No items in the order");
      return false;
    }
    
    // Group items by seller
    const itemsBySeller = {};
    
    orderData.items.forEach(item => {
      // Skip items without a sellerId
      if (!item?.sellerId) {
        console.warn("Skipping item without sellerId:", item);
        return;
      }
      
      if (!itemsBySeller[item.sellerId]) {
        itemsBySeller[item.sellerId] = [];
      }
      itemsBySeller[item.sellerId].push(item);
    });
    
    // If no valid items with sellerIds, return
    if (Object.keys(itemsBySeller).length === 0) {
      console.error("No valid items with sellerIds found in the order");
      return false;
    }
    
    // Create a seller order for each seller
    const sellerOrderPromises = Object.keys(itemsBySeller).map(async (sellerId) => {
      const sellerItems = itemsBySeller[sellerId];
      
      // Calculate total for this seller's items
      const sellerTotal = sellerItems.reduce((total, item) => {
        return total + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      
      // Prepare seller order data with null checks for all fields
      const sellerOrderData = {
        mainOrderId: orderData.id,
        sellerId,
        buyerId: orderData.userId || '',
        items: sellerItems,
        total: sellerTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Add notifications array with initial status
        notifications: [{
          message: `Order received and pending processing.`,
          timestamp: new Date().toISOString(), // Use ISO string for array items
          status: 'pending',
          sellerId: sellerId,
          sellerName: 'Seller' // Default name if not available
        }]
      };
      
      // Only add shippingAddress if it exists
      if (orderData.shippingAddress) {
        sellerOrderData.shippingAddress = orderData.shippingAddress;
      } else if (orderData.shippingDetails) {
        sellerOrderData.shippingAddress = orderData.shippingDetails;
      }
      
      // Create a new seller order
      const sellerOrderRef = collection(db, 'sellerOrders');
      await addDoc(sellerOrderRef, sellerOrderData);
    });
    
    await Promise.all(sellerOrderPromises);
    return true;
  } catch (error) {
    console.error("Error creating seller orders:", error);
    // Don't throw the error, just return false to prevent the main order creation from failing
    return false;
  }
};

// Get all orders for a specific seller
export const getSellerOrdersFromCollection = async (sellerId) => {
  try {
    try {
      // Try the query with index first
      const sellerOrdersRef = collection(db, 'sellerOrders');
      const q = query(
        sellerOrdersRef,
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sellerOrders = [];
      
      querySnapshot.forEach((doc) => {
        sellerOrders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return sellerOrders;
    } catch (indexError) {
      // Check if this is an index error
      if (indexError.message && indexError.message.includes('index')) {
        console.warn('Index error occurred, using fallback method for seller orders:', indexError.message);
        
        // Extract the index creation URL from the error message
        const indexUrl = indexError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
        if (indexUrl) {
          console.info('Create the required index here:', indexUrl);
        }
        
        // Fallback: Get all orders and filter in memory
        // This query doesn't require a composite index
        const sellerOrdersRef = collection(db, 'sellerOrders');
        const fallbackQuery = query(
          sellerOrdersRef,
          where('sellerId', '==', sellerId)
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        const sellerOrders = [];
        
        querySnapshot.forEach((doc) => {
          sellerOrders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort manually
        sellerOrders.sort((a, b) => {
          // Handle different timestamp formats
          const getTimestamp = (timestamp) => {
            if (!timestamp) return 0;
            if (timestamp.toDate) return timestamp.toDate().getTime();
            if (timestamp.seconds) return timestamp.seconds * 1000;
            return 0;
          };
          
          const timeA = getTimestamp(a.createdAt);
          const timeB = getTimestamp(b.createdAt);
          return timeB - timeA; // descending order
        });
        
        return sellerOrders;
      } else {
        // If it's not an index error, rethrow
        throw indexError;
      }
    }
  } catch (error) {
    console.error("Error getting seller orders:", error);
    throw error;
  }
};

// Get a specific seller order by ID
export const getSellerOrderById = async (orderDocId) => {
  try {
    const orderRef = doc(db, 'sellerOrders', orderDocId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Seller order not found');
    }
    
    return {
      id: orderSnap.id,
      ...orderSnap.data()
    };
  } catch (error) {
    console.error("Error getting seller order by ID:", error);
    throw error;
  }
};

// Update the status of a seller order
export const updateSellerOrderStatus = async (orderDocId, status) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to update an order');
    
    // Get the current order data
    const orderRef = doc(db, 'sellerOrders', orderDocId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Check if this seller owns this order
    if (orderData.sellerId !== currentUser.uid) {
      throw new Error('You do not have permission to update this order');
    }
    
    // If trying to mark as completed, only allow changing to 'shipped' status
    // The buyer will need to confirm delivery to complete the order
    if (status === 'completed') {
      status = 'shipped';
    }
    
    // Create a notification for the customer
    const notificationMessage = getStatusNotificationMessage(status, currentUser.displayName || 'Seller');
    
    // Add notification to the order - use a regular Date object instead of serverTimestamp for array items
    const notification = {
      message: notificationMessage,
      timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
      status,
      sellerId: currentUser.uid,
      sellerName: currentUser.displayName || 'Seller'
    };
    
    const notifications = orderData.notifications || [];
    notifications.push(notification);
    
    // Update seller order document
    await updateDoc(orderRef, {
      status,
      notifications,
      updatedAt: serverTimestamp(), // serverTimestamp is fine for direct field updates
      sellerMarkedShipped: status === 'shipped' ? true : orderData.sellerMarkedShipped
    });
    
    // If there's a main order, update the status of the seller's items in it
    if (orderData.mainOrderId) {
      try {
        const mainOrderRef = doc(db, 'orders', orderData.mainOrderId);
        const mainOrderSnap = await getDoc(mainOrderRef);
        
        if (mainOrderSnap.exists()) {
          const mainOrderData = mainOrderSnap.data();
          
          // Update the status for this seller's items in the main order
          const updatedItems = mainOrderData.items.map(item => {
            if (item.sellerId === currentUser.uid) {
              return { ...item, status };
            }
            return item;
          });
          
          // Update main order document
          await updateDoc(mainOrderRef, {
            items: updatedItems,
            updatedAt: serverTimestamp()
          });
        }
      } catch (mainOrderError) {
        console.warn("Error updating main order:", mainOrderError);
        // Continue even if main order update fails
      }
    }
    
    // Funds are only transferred when the buyer confirms delivery, not when seller marks as completed
    
    // Add a notification to the user's notifications collection if it exists
    try {
      if (orderData.buyerId) {
        const userNotificationRef = collection(db, 'users', orderData.buyerId, 'notifications');
        await addDoc(userNotificationRef, {
          type: 'order_update',
          orderId: doc.id,
          mainOrderId: orderData.mainOrderId,
          message: notificationMessage,
          status,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (notificationError) {
      // Don't fail the whole operation if notification creation fails
      console.warn('Failed to create user notification:', notificationError);
    }
    
    // Update order history
    const historyRef = collection(db, 'sellerOrders', orderDocId, 'history');
    await addDoc(historyRef, {
      status,
      timestamp: serverTimestamp(), // This is fine as it's not in an array
      note: `Order status updated to ${status} by seller`
    });
    
    return true;
  } catch (error) {
    console.error("Error updating seller order status:", error);
    throw error;
  }
};

// Buyer confirms order delivery
export const confirmOrderDelivery = async (orderId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to confirm order delivery');
    
    // Get the order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Check if this user owns this order
    if (orderData.userId !== currentUser.uid) {
      throw new Error('You do not have permission to confirm this order');
    }
    
    // Check if order is in a status that can be confirmed
    if (orderData.status !== 'shipped') {
      throw new Error('Only shipped orders can be confirmed as delivered');
    }
    
    // Update order status to completed
    await updateDoc(orderRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: 'buyer',
      buyerConfirmed: true,
      updatedAt: serverTimestamp()
    });
    
    // Update user statistics
    await updateUserCompletionStats(currentUser.uid, 'buyer');
    
    // Update all associated seller orders and transfer funds
    const sellerOrdersRef = collection(db, 'sellerOrders');
    const q = query(sellerOrdersRef, where('mainOrderId', '==', orderId));
    const sellerOrdersSnap = await getDocs(q);
    
    const confirmSellerOrderPromises = [];
    sellerOrdersSnap.forEach((doc) => {
      const sellerOrderData = doc.data();
      
      // Only update seller orders that are in shipped status
      if (sellerOrderData.status === 'shipped') {
        confirmSellerOrderPromises.push(
          updateDoc(doc.ref, {
            status: 'completed',
            completedAt: serverTimestamp(),
            completedBy: 'buyer',
            buyerConfirmed: true,
            updatedAt: serverTimestamp()
          })
        );
        
        // Add notification for seller
        if (sellerOrderData.sellerId) {
          const notification = {
            type: 'order_update',
            orderId: doc.id,
            mainOrderId: orderId,
            message: `Order #${orderId.slice(0, 8)} has been confirmed as delivered by the buyer.`,
            status: 'completed',
            read: false,
            createdAt: serverTimestamp()
          };
          
          confirmSellerOrderPromises.push(
            addDoc(collection(db, 'users', sellerOrderData.sellerId, 'notifications'), notification)
          );
          
          // Update seller statistics
          confirmSellerOrderPromises.push(
            updateUserCompletionStats(sellerOrderData.sellerId, 'seller')
          );
          
          // Transfer funds to seller
          confirmSellerOrderPromises.push(
            transferFundsToSellerForCompletedOrder(orderId, sellerOrderData.sellerId)
          );
        }
      }
    });
    
    await Promise.all(confirmSellerOrderPromises);
    
    return true;
  } catch (error) {
    console.error("Error confirming order delivery:", error);
    throw error;
  }
};

// Update user completion statistics
const updateUserCompletionStats = async (userId, role) => {
  try {
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsSnap = await getDoc(userStatsRef);
    
    if (userStatsSnap.exists()) {
      // Update existing stats
      const statsData = userStatsSnap.data();
      const completions = statsData.completions || 0;
      const totalOrders = statsData.totalOrders || 0;
      
      await updateDoc(userStatsRef, {
        completions: completions + 1,
        completionRate: (completions + 1) / (totalOrders || 1),
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new stats document
      await setDoc(userStatsRef, {
        userId,
        role,
        cancellations: 0,
        completions: 1,
        totalOrders: 1,
        cancellationRate: 0,
        completionRate: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating user completion stats:", error);
    // Don't throw error to prevent the main operation from failing
  }
};

// Cancel an order (can only be done if order is in pending status)
export const cancelOrder = async (orderId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to cancel an order');
    
    // Get the order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Check if this user owns this order
    if (orderData.userId !== currentUser.uid) {
      throw new Error('You do not have permission to cancel this order');
    }
    
    // Check if order is in a status that can be cancelled
    if (orderData.status !== 'pending') {
      throw new Error('Only pending orders can be cancelled');
    }
    
    // Update order status to cancelled
    await updateDoc(orderRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'buyer',
      updatedAt: serverTimestamp()
    });
    
    // Update user statistics
    await updateUserCancellationStats(currentUser.uid, 'buyer');
    
    // Cancel all associated seller orders
    const sellerOrdersRef = collection(db, 'sellerOrders');
    const q = query(sellerOrdersRef, where('mainOrderId', '==', orderId));
    const sellerOrdersSnap = await getDocs(q);
    
    const cancelSellerOrderPromises = [];
    sellerOrdersSnap.forEach((doc) => {
      cancelSellerOrderPromises.push(
        updateDoc(doc.ref, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
          cancelledBy: 'buyer',
          updatedAt: serverTimestamp()
        })
      );
      
      // Add notification for seller
      const sellerOrderData = doc.data();
      if (sellerOrderData.sellerId) {
        const notification = {
          type: 'order_update',
          orderId: doc.id,
          mainOrderId: orderId,
          message: `Order #${orderId.slice(0, 8)} has been cancelled by the buyer.`,
          status: 'cancelled',
          read: false,
          createdAt: serverTimestamp()
        };
        
        cancelSellerOrderPromises.push(
          addDoc(collection(db, 'users', sellerOrderData.sellerId, 'notifications'), notification)
        );
      }
    });
    
    await Promise.all(cancelSellerOrderPromises);
    
    // If payment was already made, initiate refund
    if (orderData.paymentStatus === 'paid' && orderData.paymentMethod === 'wallet') {
      // Get all seller IDs from the order
      const sellerIds = [...new Set(orderData.items.map(item => item.sellerId))];
      
      // Process refund for each seller
      for (const sellerId of sellerIds) {
        if (!sellerId) continue;
        
        // Calculate total amount for this seller
        const sellerItems = orderData.items.filter(item => item.sellerId === sellerId);
        const sellerTotal = sellerItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        try {
          // Process refund from seller to buyer
          await processRefund(sellerId, currentUser.uid, sellerTotal, orderId);
          
          // Update order payment status to 'refunded'
          await updateDoc(orderRef, {
            paymentStatus: 'refunded',
            updatedAt: serverTimestamp()
          });
        } catch (refundError) {
          console.error(`Error processing refund for order ${orderId} from seller ${sellerId}:`, refundError);
          // Continue with other refunds even if one fails
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};

// Update user cancellation statistics
const updateUserCancellationStats = async (userId, role) => {
  try {
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsSnap = await getDoc(userStatsRef);
    
    if (userStatsSnap.exists()) {
      // Update existing stats
      const statsData = userStatsSnap.data();
      const cancellations = statsData.cancellations || 0;
      const totalOrders = statsData.totalOrders || 0;
      
      await updateDoc(userStatsRef, {
        cancellations: cancellations + 1,
        cancellationRate: (cancellations + 1) / (totalOrders || 1),
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new stats document
      await setDoc(userStatsRef, {
        userId,
        role,
        cancellations: 1,
        completions: 0,
        totalOrders: 1,
        cancellationRate: 1,
        completionRate: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating user cancellation stats:", error);
    // Don't throw error to prevent the main operation from failing
  }
};

// Get user statistics related to order completion and cancellation
export const getUserStatistics = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get all orders for this user
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    
    if (ordersSnapshot.empty) {
      return {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        completionRate: 0,
        cancellationRate: 0
      };
    }
    
    // Count orders by status
    let totalOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      totalOrders++;
      
      if (orderData.status === 'completed') {
        completedOrders++;
      } else if (orderData.status === 'cancelled') {
        cancelledOrders++;
      }
    });
    
    // Calculate rates (avoid division by zero)
    const completionRate = totalOrders > 0 
      ? Math.round((completedOrders / totalOrders) * 100) 
      : 0;
      
    const cancellationRate = totalOrders > 0 
      ? Math.round((cancelledOrders / totalOrders) * 100) 
      : 0;
    
    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      completionRate,
      cancellationRate
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

// Hide an order from the user's view without deleting it from the database
export const hideOrderFromView = async (orderId, userId) => {
  try {
    if (!orderId || !userId) {
      throw new Error('Order ID and User ID are required');
    }

    // Get the order to verify it belongs to the user
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data();
    
    // Verify the order belongs to the user
    if (orderData.userId !== userId) {
      throw new Error('You do not have permission to hide this order');
    }

    // Update the order to mark it as hidden
    await updateDoc(orderRef, {
      isHidden: true,
      hiddenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Also add this order to the user's hiddenOrders collection for easy retrieval
    const hiddenOrderRef = doc(db, 'users', userId, 'hiddenOrders', orderId);
    await setDoc(hiddenOrderRef, {
      orderId,
      originalStatus: orderData.status,
      hiddenAt: serverTimestamp(),
      orderTotal: orderData.total || 0,
      orderItems: orderData.items?.length || 0
    });

    return true;
  } catch (error) {
    console.error('Error hiding order:', error);
    throw error;
  }
};

// Restore a hidden order to the user's view
export const restoreHiddenOrder = async (orderId, userId) => {
  try {
    if (!orderId || !userId) {
      throw new Error('Order ID and User ID are required');
    }

    // Get the order to verify it exists
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data();
    
    // Verify the order belongs to the user
    if (orderData.userId !== userId) {
      throw new Error('You do not have permission to restore this order');
    }

    // Update the order to mark it as visible
    await updateDoc(orderRef, {
      isHidden: false,
      updatedAt: serverTimestamp()
    });

    // Remove the order from the user's hiddenOrders collection
    const hiddenOrderRef = doc(db, 'users', userId, 'hiddenOrders', orderId);
    await deleteDoc(hiddenOrderRef);

    return true;
  } catch (error) {
    console.error('Error restoring hidden order:', error);
    throw error;
  }
};

// Get all hidden orders for a user
export const getHiddenOrders = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get references to hidden orders from the user's hiddenOrders collection
    const hiddenOrdersRef = collection(db, 'users', userId, 'hiddenOrders');
    const hiddenOrdersSnap = await getDocs(hiddenOrdersRef);

    if (hiddenOrdersSnap.empty) {
      return [];
    }

    // Get the full order details for each hidden order
    const hiddenOrderIds = hiddenOrdersSnap.docs.map(doc => doc.id);
    
    const hiddenOrders = [];
    
    // Fetch each order individually to handle potential missing orders
    for (const orderId of hiddenOrderIds) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          hiddenOrders.push({
            id: orderSnap.id,
            ...orderSnap.data()
          });
        } else {
          // If the order doesn't exist anymore, remove it from hiddenOrders
          const hiddenOrderRef = doc(db, 'users', userId, 'hiddenOrders', orderId);
          await deleteDoc(hiddenOrderRef);
        }
      } catch (err) {
        console.error(`Error fetching hidden order ${orderId}:`, err);
      }
    }

    return hiddenOrders;
  } catch (error) {
    console.error('Error getting hidden orders:', error);
    throw error;
  }
};

// Get related products based on category and excluding current product
export const getRelatedProducts = async (categoryId, currentProductId, limitCount = 4) => {
  try {
    if (!categoryId || !currentProductId) {
      return [];
    }
    
    // Use a simpler query that doesn't require a composite index
    const productsRef = collection(db, 'products');
    
    // First, get products with the same category
    const categoryQuery = query(
      productsRef,
      where('category', '==', categoryId),
      limit(limitCount + 1) // Get one extra to account for possible current product
    );
    
    const querySnapshot = await getDocs(categoryQuery);
    
    // Filter out the current product in JavaScript instead of in the query
    let relatedProducts = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(product => product.id !== currentProductId)
      .slice(0, limitCount);
    
    // If we don't have enough products, get random products as fallback
    if (relatedProducts.length < limitCount) {
      // Get random products
      const fallbackQuery = query(
        productsRef,
        limit(limitCount + 10) // Get extra to ensure we have enough after filtering
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackProducts = fallbackSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(product => product.id !== currentProductId && 
                          !relatedProducts.some(p => p.id === product.id));
      
      // Add fallback products to fill up to the limit
      relatedProducts = [
        ...relatedProducts,
        ...fallbackProducts.slice(0, limitCount - relatedProducts.length)
      ];
    }
    
    return relatedProducts;
  } catch (error) {
    console.error('Error fetching related products:', error);
    // Return empty array to prevent UI errors
    return [];
  }
};
