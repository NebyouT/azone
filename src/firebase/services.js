import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  EmailAuthProvider,
  reauthenticateWithCredential,
  PhoneAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp,
  addDoc,
  increment,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { app } from './config';
import { uploadImage, getPublicIdFromUrl } from '../cloudinary/services';
import { 
  processPayment, 
  TRANSACTION_TYPES, 
  TRANSACTION_STATUS,
  holdPaymentInEscrow,
  releasePaymentFromEscrow,
  addFunds,
  initializeWallet
} from './walletServices';

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google provider
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Validate Ethiopian phone number
export const validateEthiopianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Valid formats:
  // 1. 0911234567 (10 digits starting with 0)
  // 2. 911234567 (9 digits without leading 0)
  // 3. 251911234567 (12 digits with country code)
  
  return (
    (cleaned.startsWith('0') && cleaned.length === 10) ||
    (!cleaned.startsWith('0') && cleaned.length === 9) ||
    (cleaned.startsWith('251') && cleaned.length === 12)
  );
};

// Format Ethiopian phone number for international format
export const formatEthiopianPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it already has the country code
  if (cleaned.startsWith('251')) {
    return '+' + cleaned;
  }
  
  // Check if it starts with 0 (Ethiopian format)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+251' + cleaned.substring(1);
  }
  
  // If it's just 9 digits (without the leading 0)
  if (cleaned.length === 9) {
    return '+251' + cleaned;
  }
  
  // Return as is with + prefix if it doesn't match known patterns
  return '+' + cleaned;
};

// Check if email already exists in the database
export const checkEmailExists = async (email) => {
  try {
    // Query Firestore to check if a user with this email already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    // If there are any documents in the result, the email exists
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // In case of error, assume the email might exist to prevent potential duplicates
    throw error;
  }
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

// User profile services
export const updateUserProfile = async (userId, displayName, phoneNumber, role, photoURL) => {
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
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;
    
    if (Object.keys(updateData).length > 0) {
      await updateProfile(auth.currentUser, updateData);
    }
    
    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayName: displayName || '',
      phoneNumber: formattedPhoneNumber,
      role: role || 'buyer',
      photoURL: photoURL || '',
      // Set phoneVerified to true automatically without verification
      phoneVerified: phoneNumber ? true : false,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile image
export const uploadProfileImage = async (file, userId) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    if (!file) throw new Error('No file provided');
    
    // Upload the image to Cloudinary instead of Firebase Storage
    const downloadURL = await uploadImage(file, `profile_${userId}`);
    
    if (!downloadURL) {
      throw new Error('Failed to upload image to Cloudinary');
    }
    
    // Update user profile with the new image URL
    await updateUserProfile(userId, null, null, null, downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    throw error;
  }
};

// Initialize phone verification
export const initPhoneVerification = async (phoneNumber, containerId) => {
  try {
    if (!phoneNumber) throw new Error('Phone number is required');
    
    // Format the phone number for Ethiopia
    const formattedPhoneNumber = formatEthiopianPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedPhoneNumber);
    
    // Clear any existing reCAPTCHA widgets
    window.recaptchaVerifier = null;
    
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error('reCAPTCHA container not found');
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Initialize reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: (response) => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    
    // Render the reCAPTCHA
    await window.recaptchaVerifier.render();
    
    // Request OTP
    console.log('Sending OTP to:', formattedPhoneNumber);
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      formattedPhoneNumber, 
      window.recaptchaVerifier
    );
    
    console.log('OTP sent successfully');
    
    // Return the confirmation result to be used for verifying the code
    return confirmationResult;
  } catch (error) {
    console.error('Error initializing phone verification:', error);
    throw error;
  }
};

// Verify phone number with OTP
export const verifyPhoneNumber = async (confirmationResult, verificationCode) => {
  try {
    if (!confirmationResult) throw new Error('Confirmation result is required');
    if (!verificationCode) throw new Error('Verification code is required');
    
    // Verify the code
    const result = await confirmationResult.confirm(verificationCode);
    
    // Get the user
    const user = result.user;
    
    // Update the user's profile to mark phone as verified
    const userRef = doc(db, 'users', user.uid);
    
    // Check if the user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        phoneVerified: true,
        phoneNumber: user.phoneNumber,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        phoneVerified: true,
        role: 'buyer', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw error;
  }
};

// Product services
export const getProducts = async (categoryFilter = null, sortBy = 'createdAt', limitCount = 50) => {
  try {
    let productsQuery;
    
    if (categoryFilter) {
      // Use a simpler query without compound index requirement
      productsQuery = query(
        collection(db, 'products'),
        where('category', '==', categoryFilter)
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
    
    // Apply client-side sorting and limiting for category filtered queries
    if (categoryFilter) {
      // Sort products based on the sortBy field
      products.sort((a, b) => {
        // Handle timestamp objects from Firestore
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          const aTime = a[sortBy]?.seconds || 0;
          const bTime = b[sortBy]?.seconds || 0;
          return bTime - aTime; // descending order
        }
        // Handle regular fields
        return b[sortBy] - a[sortBy]; // descending order
      });
      
      // Apply the limit
      return products.slice(0, limitCount);
    }
    
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
    
    // Upload main product image to Cloudinary
    let imageUrl = '';
    if (imageFile) {
      imageUrl = await uploadImage(imageFile, `products/${currentUser.uid}`);
    }
    
    // Upload additional images to Cloudinary
    let additionalImages = [];
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      // Create an array of promises for uploading all additional images
      const uploadPromises = additionalImageFiles.map(file => 
        uploadImage(file, `products/${currentUser.uid}/additional`)
      );
      
      // Wait for all uploads to complete and collect the URLs
      additionalImages = await Promise.all(uploadPromises);
    }
    
    // Validate hasVariants
    const hasVariants = productData.hasVariants === true 
      ? productData.hasVariants 
      : false;
    
    // Create product document in Firestore
    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      hasVariants, // Use the validated hasVariants value
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
      shippingAddress: orderData.shippingAddress || orderData.shippingDetails || {},
      // Add payment status
      paymentStatus: 'pending'
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
    
    // If using wallet payment, hold the payment in escrow
    if (orderData.paymentMethod === 'wallet') {
      try {
        // Hold the total amount in escrow
        const escrowResult = await holdPaymentInEscrow(userId, orderData.total, orderRef.id);
        
        // Update order payment status to 'held_in_escrow' and record the exact amount held
        await updateDoc(orderRef, {
          paymentStatus: 'held_in_escrow',
          heldAmount: orderData.total, // Store exact amount held in escrow
          escrowId: escrowResult.escrowId, // Store reference to escrow record
          updatedAt: serverTimestamp()
        });
        
        console.log(`[PAYMENT] Held ${orderData.total} ETB in escrow for order ${orderRef.id}`);
      } catch (paymentError) {
        console.error("Error holding payment in escrow:", paymentError);
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
        if (!b.createdAt) return 1;
        
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

export const updateOrderStatus = async (orderId, status, updatedBy) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Create status update history
    const statusUpdate = {
      status,
      updatedBy,
      timestamp: serverTimestamp()
    };
    
    // Update order document
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(statusUpdate)
    });
    
    // If status is changed to cancelled, handle refunds if payment was made
    if (status === 'cancelled') {
      console.log(`Order ${orderId} status changed to cancelled. Checking if refund is needed...`);
      
      // If payment was already made or held in escrow, initiate refund
      if (orderData.paymentStatus?.toLowerCase() === 'paid' || orderData.paymentStatus?.toLowerCase() === 'held_in_escrow') {
        try {
          // Use the exact amount that was originally held in escrow if available
          const totalOrderAmount = orderData.heldAmount || orderData.totalAmount || 
            orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
          
          console.log(`[REFUND] Using amount for refund: ${totalOrderAmount} ETB (Original held amount: ${orderData.heldAmount || 'Not recorded'})`);
          
          console.log(`[REFUND] Starting refund process for order ${orderId} via status update. Payment status: ${orderData.paymentStatus}, Amount: ${totalOrderAmount} ETB`);
          
          // Get buyer ID from order data
          const buyerId = orderData.userId;
          if (!buyerId) {
            throw new Error('Buyer ID not found in order data');
          }
          
          // Format order number for display
          const orderNumber = orderId.substring(0, 8).toUpperCase();
          
          console.log(`[REFUND-SELLER-CANCEL] STEP 1: Getting buyer wallet for ${buyerId}`);
          // Get buyer wallet directly
          const buyerWalletRef = doc(db, 'wallets', buyerId);
          const buyerWalletSnap = await getDoc(buyerWalletRef);
          
          // If buyer wallet doesn't exist, create it
          let buyerWallet = { balance: 0 };
          let currentBalance = 0;
          
          if (buyerWalletSnap.exists()) {
            buyerWallet = buyerWalletSnap.data();
            currentBalance = buyerWallet.balance || 0;
            console.log(`[REFUND-SELLER-CANCEL] STEP 2: Found existing wallet with balance: ${currentBalance} ETB`);
          } else {
            console.log(`[REFUND-SELLER-CANCEL] STEP 2: No wallet found for buyer. Creating new wallet.`);
          }
          
          // Calculate new balance
          const newBalance = currentBalance + totalOrderAmount;
          console.log(`[REFUND-SELLER-CANCEL] STEP 3: Calculating new balance: ${currentBalance} + ${totalOrderAmount} = ${newBalance} ETB`);
          
          // Update wallet with new balance
          console.log(`[REFUND-SELLER-CANCEL] STEP 4: Updating buyer wallet to ${newBalance} ETB`);
          if (buyerWalletSnap.exists()) {
            await updateDoc(buyerWalletRef, {
              balance: newBalance,
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(buyerWalletRef, {
              balance: totalOrderAmount,
              userId: buyerId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          
          // Create transaction record
          console.log(`[REFUND-SELLER-CANCEL] STEP 5: Creating refund transaction record`);
          const refundTransactionRef = doc(collection(db, 'transactions'));
          await setDoc(refundTransactionRef, {
            userId: buyerId,
            amount: totalOrderAmount,
            type: 'credit',
            category: 'refund',
            description: `Refund for cancelled order #${orderNumber} (seller cancelled)`,
            status: 'completed',
            orderId: orderId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          console.log(`[REFUND-SELLER-CANCEL] STEP 6: Verifying wallet update`);
          // Verify the wallet was updated
          const verifyWalletSnap = await getDoc(buyerWalletRef);
          if (verifyWalletSnap.exists()) {
            const verifyWallet = verifyWalletSnap.data();
            console.log(`[REFUND-SELLER-CANCEL] Verified wallet balance after refund: ${verifyWallet.balance} ETB`);
            if (verifyWallet.balance !== newBalance) {
              console.warn(`[REFUND-SELLER-CANCEL] WARNING: Balance verification failed. Expected ${newBalance} but got ${verifyWallet.balance}`);
            }
          }
          
          // Set refund result to true
          const refundResult = true;
          
          if (refundResult) {
            // Update order payment status to 'refunded'
            await updateDoc(orderRef, {
              paymentStatus: 'refunded',
              refundedAmount: totalOrderAmount,
              refundedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            // Create a notification for the buyer about the refund
            await addDoc(collection(db, 'users', buyerId, 'notifications'), {
              type: 'refund',
              orderId: orderId,
              message: `Your payment of ${totalOrderAmount} ETB for order #${orderId.substring(0, 8)} has been refunded to your wallet.`,
              amount: totalOrderAmount,
              read: false,
              createdAt: serverTimestamp()
            });
            
            console.log(`Refund of ${totalOrderAmount} processed successfully via status update for order ${orderId} to buyer ${buyerId}`);
          }
        } catch (refundError) {
          console.error(`Error processing refund for order ${orderId} during status update:`, refundError);
          throw new Error(`Failed to process refund during status update: ${refundError.message}`);
        }
      } else {
        console.log(`No refund needed for order ${orderId}. Current payment status: ${orderData.paymentStatus}`);
      }
    }
    
    // If order is delivered by seller, update product sold counts
    if (status === 'delivered' && updatedBy === orderData.sellerId) {
      await updateProductSoldCounts(orderId);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const confirmOrderDelivery = async (orderId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to confirm order delivery');
    
    // Validate orderId
    if (!orderId) throw new Error('Order ID is required');
    
    // Get the order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    // Get order data and ensure the ID is explicitly set
    const orderData = {
      ...orderSnap.data(),
      id: orderId  // Explicitly set the ID to ensure it's available
    };
    
    if (orderData.status !== 'delivered') {
      throw new Error('Only delivered orders can be confirmed as received');
    }
    
    // Create a batch for transaction
    const batch = writeBatch(db);
    
    // Update order status to completed
    const statusUpdate = {
      status: 'completed',
      updatedBy: currentUser.uid,
      timestamp: new Date().toISOString() // Use ISO string instead of serverTimestamp()
    };
    
    batch.update(orderRef, {
      status: 'completed',
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(statusUpdate),
      deliveryConfirmedAt: serverTimestamp(),
      completedBy: 'buyer',
      buyerConfirmed: true,
      canReview: true // Enable reviews for this order
    });
    
    // Update all related seller orders to completed status
    // First, find all seller orders related to this main order
    const sellerOrdersQuery = query(
      collection(db, 'sellerOrders'),
      where('mainOrderId', '==', orderId)
    );
    
    const sellerOrdersSnap = await getDocs(sellerOrdersQuery);
    
    // Update each seller order to completed status
    sellerOrdersSnap.forEach((doc) => {
      const sellerOrderRef = doc.ref;
      const sellerOrderData = doc.data();
      
      // Create a notification for the seller
      const notification = {
        message: `Order #${orderId.substring(0, 8)} has been confirmed as delivered by the buyer and marked as completed.`,
        timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
        status: 'completed',
        buyerId: currentUser.uid,
        buyerName: currentUser.displayName || 'Buyer'
      };
      
      const notifications = sellerOrderData.notifications || [];
      notifications.push(notification);
      
      batch.update(sellerOrderRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
        deliveryConfirmedAt: serverTimestamp(),
        buyerConfirmed: true,
        notifications
      });
    });
    
    try {
      // Release payment to seller - pass the order data with explicit ID
      await releasePaymentToSeller(orderData, batch);
    } catch (paymentError) {
      console.error('Error releasing payment:', paymentError);
      // Don't throw the error here, continue with order status update
      // but add a note about payment failure
      batch.update(orderRef, {
        paymentStatus: 'failed',
        paymentError: paymentError.message,
        paymentErrorAt: serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    // Update user statistics
    await updateUserCompletionStats(currentUser.uid, 'buyer');
    
    // Update product sold counts
    await updateProductSoldCounts(orderId);
    
    return true;
  } catch (error) {
    console.error('Error confirming order delivery:', error);
    throw error;
  }
};

export const releasePaymentToSeller = async (orderData, batch) => {
  try {
    if (!orderData) {
      throw new Error('Order data is required to release payment');
    }
    
    // Check if this is a multi-seller order or single seller order
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order has no items');
    }
    
    // Group items by seller to handle multi-seller orders
    const itemsBySeller = {};
    
    // Calculate total product amount and delivery cost for each seller
    orderData.items.forEach(item => {
      const sellerId = item.sellerId;
      if (!sellerId) return;
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = {
          items: [],
          productAmount: 0,
          deliveryAmount: 0
        };
      }
      
      itemsBySeller[sellerId].items.push(item);
      itemsBySeller[sellerId].productAmount += (item.price * item.quantity);
      
      // Add delivery cost if it exists and belongs to this seller
      if (item.deliveryCost && typeof item.deliveryCost === 'number') {
        itemsBySeller[sellerId].deliveryAmount += item.deliveryCost;
      }
    });
    
    // If there's a single delivery cost for the whole order, distribute it proportionally
    if (orderData.deliveryCost && typeof orderData.deliveryCost === 'number') {
      const totalItems = orderData.items.length;
      const costPerItem = orderData.deliveryCost / totalItems;
      
      Object.keys(itemsBySeller).forEach(sellerId => {
        const sellerItemCount = itemsBySeller[sellerId].items.length;
        itemsBySeller[sellerId].deliveryAmount += (costPerItem * sellerItemCount);
      });
    }
    
    const buyerId = orderData.userId;
    if (!buyerId) {
      throw new Error('Buyer ID is required to release payment');
    }
    
    const orderId = orderData.id;
    if (!orderId || orderId === 'unknown') {
      throw new Error('Valid order ID is required to release payment');
    }
    
    // Process payment for each seller
    const paymentPromises = Object.keys(itemsBySeller).map(async (sellerId) => {
      const sellerData = itemsBySeller[sellerId];
      const productAmount = sellerData.productAmount;
      const deliveryAmount = sellerData.deliveryAmount;
      const totalSellerAmount = productAmount + deliveryAmount;
      
      console.log(`Releasing payment of ${totalSellerAmount} ETB (${productAmount} product + ${deliveryAmount} delivery) to seller ${sellerId} for order ${orderId}`);
      
      try {
        // Use the new releasePaymentFromEscrow function to handle the transfer
        // This ensures only product price and delivery cost are transferred (no tax)
        const paymentResult = await releasePaymentFromEscrow(sellerId, orderId, productAmount, deliveryAmount);
        
        // Add seller notification about payment
        const sellerNotificationRef = collection(db, 'users', sellerId, 'notifications');
        batch.set(doc(sellerNotificationRef), {
          type: 'payment_received',
          orderId: orderId,
          amount: totalSellerAmount,
          message: `Payment of ${totalSellerAmount} ETB has been released to your wallet for order #${orderId.substring(0, 8)} (${productAmount} ETB product + ${deliveryAmount} ETB delivery)`,
          read: false,
          createdAt: serverTimestamp()
        });
        
        return paymentResult;
      } catch (paymentError) {
        console.error(`Error releasing payment to seller ${sellerId}:`, paymentError);
        throw paymentError;
      }
    });
    
    // Wait for all payments to be processed
    await Promise.all(paymentPromises);
    
    // Update order payment status only if we have a valid order ID
    const orderRef = doc(db, 'orders', orderId);
    batch.update(orderRef, {
      paymentStatus: 'completed',
      paymentReleasedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error releasing payment to seller:', error);
    throw error;
  }
};

// Get seller orders for a seller
export const getSellerOrders = async (sellerId) => {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }
    
    try {
      // First attempt with ordering (requires composite index)
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
export const updateSellerOrderStatus = async (orderDocId, status, cancellationReason = '') => {
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
    
    // Check if the order is already completed or delivered - can't update in these cases
    if (orderData.status === 'completed') {
      throw new Error('This order is already completed and cannot be updated');
    }
    
    // If the order is delivered, only the buyer can confirm completion
    if (orderData.status === 'delivered') {
      throw new Error('This order is marked as delivered. Waiting for buyer confirmation.');
    }
    
    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled']
    };
    
    if (validTransitions[orderData.status] && !validTransitions[orderData.status].includes(status)) {
      throw new Error(`Cannot change order status from '${orderData.status}' to '${status}'. Valid next statuses are: ${validTransitions[orderData.status].join(', ')}`);
    }
    
    // If trying to mark as completed, only allow changing to 'shipped' status
    // The buyer will need to confirm delivery to complete the order
    if (status === 'completed') {
      throw new Error('Cannot directly mark an order as completed. The buyer must confirm delivery first.');
    }
    
    // If cancelling, require a reason
    if (status === 'cancelled' && !cancellationReason.trim()) {
      throw new Error('A reason for cancellation is required');
    }
    
    // Create a notification for the customer
    const notificationMessage = status === 'cancelled'
      ? `Order cancelled by seller. Reason: ${cancellationReason}`
      : getStatusNotificationMessage(status, currentUser.displayName || 'Seller');
    
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
    const sellerOrderUpdate = {
      status,
      notifications,
      updatedAt: serverTimestamp(), // serverTimestamp is fine for direct field updates
      ...(status === 'shipped' ? { sellerMarkedShipped: true } : {}),
      ...(status === 'delivered' ? { sellerMarkedDelivered: true } : {}),
      ...(status === 'cancelled' ? { cancellationReason } : {})
    };
    
    await updateDoc(orderRef, sellerOrderUpdate);
    
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
              return { 
                ...item, 
                status,
                ...(status === 'cancelled' ? { cancellationReason } : {})
              };
            }
            return item;
          });
          
          // Create status update history for the main order
          const statusUpdate = {
            status,
            updatedBy: currentUser.uid,
            updaterRole: 'seller',
            timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
            ...(status === 'cancelled' ? { cancellationReason } : {})
          };
          
          // Update main order document
          const mainOrderUpdate = {
            items: updatedItems,
            updatedAt: serverTimestamp(),
            statusHistory: arrayUnion(statusUpdate),
            status // Update the main order status for all status changes
          };
          
          // If the status is 'delivered', send notification to buyer that they need to confirm delivery
          if (status === 'delivered') {
            try {
              // Add notification to user's notifications collection
              if (mainOrderData.userId) {
                const userNotificationRef = collection(db, 'users', mainOrderData.userId, 'notifications');
                await addDoc(userNotificationRef, {
                  type: 'delivery_confirmation',
                  orderId: orderData.mainOrderId,
                  message: 'Your order has been marked as delivered. Please confirm receipt to complete the transaction.',
                  read: false,
                  createdAt: serverTimestamp()
                });
              }
            } catch (notificationError) {
              console.warn('Failed to create delivery confirmation notification:', notificationError);
            }
          }
          
          await updateDoc(mainOrderRef, mainOrderUpdate);
        }
      } catch (mainOrderError) {
        console.error('Error updating main order:', mainOrderError);
        // Don't throw here as we still want to update the seller order
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating seller order status:', error);
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
      
      // Add seller notification about cancellation
      const sellerOrderData = doc.data();
      if (sellerOrderData.sellerId) {
        const notification = {
          type: 'order_update',
          orderId: doc.id,
          mainOrderId: orderId,
          message: `Order #${orderId.substring(0, 8)} has been cancelled by the buyer.`,
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
    
    // If payment was already made or held in escrow, initiate refund
    if (orderData.paymentStatus?.toLowerCase() === 'paid' || 
        orderData.paymentStatus?.toLowerCase() === 'held_in_escrow') {
      try {
        // Use the exact amount that was originally held in escrow if available
        const totalOrderAmount = orderData.heldAmount || orderData.totalAmount || 
          orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        console.log(`[REFUND] Using amount for refund: ${totalOrderAmount} ETB (Original held amount: ${orderData.heldAmount || 'Not recorded'})`);
        
        console.log(`[REFUND] Starting refund process for order ${orderId}. Payment status: ${orderData.paymentStatus}, Amount: ${totalOrderAmount} ETB`);
        
        // Direct refund to buyer's wallet - this ensures funds return to the buyer regardless of seller status
        const refundResult = await directRefundToBuyer(currentUser.uid, totalOrderAmount, orderId);
        
        if (refundResult) {
          // Update order payment status to 'refunded'
          await updateDoc(orderRef, {
            paymentStatus: 'refunded',
            refundedAmount: totalOrderAmount,
            refundedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Create a notification for the buyer about the refund
          await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
            type: 'refund',
            orderId: orderId,
            message: `Your payment of ${totalOrderAmount} ETB for order #${orderId.substring(0, 8)} has been refunded to your wallet.`,
            amount: totalOrderAmount,
            read: false,
            createdAt: serverTimestamp()
          });
          
          console.log(`Refund of ${totalOrderAmount} processed successfully for order ${orderId} to buyer ${currentUser.uid}`);
        } else {
          throw new Error('Refund operation did not complete successfully');
        }
      } catch (refundError) {
        console.error(`Error processing refund for order ${orderId}:`, refundError);
        throw new Error(`Failed to process refund: ${refundError.message}`);
      }
    } else {
      console.log(`No refund needed for order ${orderId}. Current payment status: ${orderData.paymentStatus}`);
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

// Update product sold count when an order is completed
export const updateProductSoldCounts = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Only update sold counts for delivered orders
    if (orderData.status !== 'delivered') {
      return;
    }
    
    // Get batch for transaction
    const batch = writeBatch(db);
    
    // Update each product's sold count
    for (const item of orderData.items) {
      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentSoldCount = productData.soldCount || 0;
        
        // Update sold count
        batch.update(productRef, {
          soldCount: currentSoldCount + item.quantity
        });
      }
    }
    
    // Commit the batch
    await batch.commit();
    
  } catch (error) {
    console.error('Error updating product sold counts:', error);
    throw error;
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
          timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
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

// Get buyer information for an order
export const getBuyerInfoForOrder = async (orderId) => {
  try {
    // First try to get the order from sellerOrders collection
    const sellerOrderRef = doc(db, 'sellerOrders', orderId);
    const sellerOrderSnap = await getDoc(sellerOrderRef);
    
    if (sellerOrderSnap.exists()) {
      const sellerOrderData = sellerOrderSnap.data();
      const userId = sellerOrderData.buyerId;
      
      if (!userId) {
        throw new Error('Buyer information not available');
      }
      
      // Get user profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('Buyer profile not found');
      }
      
      const userData = userSnap.data();
      
      // Return only necessary buyer information
      return {
        id: userId,
        name: userData.displayName || 'Anonymous',
        email: userData.email || 'Not provided',
        phone: userData.phoneNumber || 'Not provided',
        shippingAddress: sellerOrderData.shippingAddress || 'Not provided'
      };
    }
    
    // If not found in sellerOrders, try the main orders collection
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    const userId = orderData.userId;
    
    if (!userId) {
      throw new Error('Buyer information not available');
    }
    
    // Get user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('Buyer profile not found');
    }
    
    const userData = userSnap.data();
    
    // Return only necessary buyer information
    return {
      id: userId,
      name: userData.displayName || 'Anonymous',
      email: userData.email || 'Not provided',
      phone: userData.phoneNumber || 'Not provided',
      shippingAddress: orderData.shippingAddress || 'Not provided'
    };
  } catch (error) {
    console.error('Error getting buyer info:', error);
    throw error;
  }
};

// Update order status by seller
export const updateOrderStatusBySeller = async (orderId, status, sellerId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to update an order');
    
    if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
      throw new Error('Invalid status. Must be one of: confirmed, shipped, delivered');
    }
    
    // Get the order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Verify this seller is associated with this order
    if (orderData.sellerId !== sellerId) {
      throw new Error('You do not have permission to update this order');
    }
    
    // Create status update history
    const statusUpdate = {
      status,
      updatedBy: sellerId,
      timestamp: new Date().toISOString() // Use ISO string instead of serverTimestamp
    };
    
    // Update order document
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(statusUpdate)
    });
    
    // If order is delivered, update product sold counts
    if (status === 'delivered') {
      await updateProductSoldCounts(orderId);
      
      // Send notification to buyer that they need to confirm delivery
      try {
        // Add notification to user's notifications collection
        if (orderData.userId) {
          const userNotificationRef = collection(db, 'users', orderData.userId, 'notifications');
          await addDoc(userNotificationRef, {
            type: 'delivery_confirmation',
            orderId,
            message: 'Your order has been marked as delivered. Please confirm receipt to complete the transaction.',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } catch (notificationError) {
        console.warn('Failed to create delivery confirmation notification:', notificationError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status by seller:', error);
    throw error;
  }
};

/**
 * Generate notification message based on order status
 * @param {string} status - Order status
 * @param {string} sellerName - Name of the seller
 * @returns {string} - Notification message
 */
const getStatusNotificationMessage = (status, sellerName) => {
  switch (status) {
    case 'confirmed':
      return `Your order has been confirmed by ${sellerName} and is being processed.`;
    case 'shipped':
      return `Your order has been shipped by ${sellerName}.`;
    case 'delivered':
      return `Your order has been marked as delivered by ${sellerName}. Please confirm receipt to complete the transaction.`;
    case 'completed':
      return `Your order has been completed. Thank you for shopping with ${sellerName}.`;
    case 'cancelled':
      return `Your order has been cancelled by ${sellerName}.`;
    default:
      return `Your order status has been updated to ${status} by ${sellerName}.`;
  }
};

/**
 * Get statistics for a seller
 * @param {string} sellerId - The ID of the seller
 * @param {string} period - The time period for statistics (day, week, month, year)
 * @returns {Promise<object>} - Seller statistics
 */
export const getSellerStatistics = async (sellerId, period = 'month') => {
  try {
    if (!sellerId) throw new Error('Seller ID is required');
    
    // Get current date and calculate start date based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }
    
    // Convert to Firestore timestamp
    const startTimestamp = Timestamp.fromDate(startDate);
    
    // Get seller orders for the period
    const ordersQuery = query(
      collection(db, 'sellerOrders'),
      where('sellerId', '==', sellerId),
      where('createdAt', '>=', startTimestamp),
      orderBy('createdAt', 'desc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get seller products
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', sellerId)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    const products = [];
    
    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.active !== false).length;
    const outOfStockProducts = products.filter(p => p.quantity === 0).length;
    
    // Group orders by date for timeline data
    const salesByDate = {};
    const revenueByDate = {};
    
    orders.forEach(order => {
      const date = order.createdAt ? new Date(order.createdAt.seconds * 1000) : new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      salesByDate[dateStr] = (salesByDate[dateStr] || 0) + 1;
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (order.totalAmount || 0);
    });
    
    // Convert to arrays for charts
    const timelineLabels = Object.keys(salesByDate).sort();
    const salesData = timelineLabels.map(date => salesByDate[date]);
    const revenueData = timelineLabels.map(date => revenueByDate[date]);
    
    // Get top selling products
    const productSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + (item.quantity || 1);
      });
    });
    
    // Sort products by sales
    const topProducts = Object.entries(productSales)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId) || { name: 'Unknown Product' };
        return {
          productId,
          name: product.name,
          quantity
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    return {
      period,
      totalOrders,
      totalRevenue,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      completedOrders,
      cancelledOrders,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      salesTimeline: {
        labels: timelineLabels,
        data: salesData
      },
      revenueTimeline: {
        labels: timelineLabels,
        data: revenueData
      },
      topProducts
    };
  } catch (error) {
    console.error('Error getting seller statistics:', error);
    throw error;
  }
};

/**
 * Process a direct refund to the buyer's wallet, regardless of the current location of the funds
 * This ensures cancelled orders always return money to the buyer
 * @param {string} buyerId - ID of the buyer receiving the refund
 * @param {number} amount - Amount to refund
 * @param {string} orderId - ID of the order being refunded
 * @returns {Promise<boolean>} True if refund was successful
 */
const directRefundToBuyer = async (buyerId, amount, orderId) => {
  try {
    // Validate input parameters
    if (!buyerId) {
      console.error('[REFUND-BUYER-CANCEL] Missing buyer ID for refund');
      throw new Error('Missing buyer ID for refund');
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error(`[REFUND-BUYER-CANCEL] Invalid refund amount: ${amount}`);
      throw new Error(`Invalid refund amount: ${amount}. Must be a positive number.`);
    }
    
    if (!orderId) {
      console.error('[REFUND-BUYER-CANCEL] Missing order ID for refund');
      throw new Error('Missing order ID for refund');
    }
    
    console.log(`[REFUND-BUYER-CANCEL] Processing refund of ${amount} ETB to buyer ${buyerId} for order ${orderId}`);
    
    // Format order number for display
    const orderNumber = orderId.substring(0, 8).toUpperCase();
    
    console.log(`[REFUND-BUYER-CANCEL] STEP 1: Getting buyer wallet for ${buyerId}`);
    // Get buyer wallet directly
    const buyerWalletRef = doc(db, 'wallets', buyerId);
    const buyerWalletSnap = await getDoc(buyerWalletRef);
    
    // If buyer wallet doesn't exist, create it
    let buyerWallet = { balance: 0 };
    let currentBalance = 0;
    
    if (buyerWalletSnap.exists()) {
      buyerWallet = buyerWalletSnap.data();
      currentBalance = buyerWallet.balance || 0;
      console.log(`[REFUND-BUYER-CANCEL] STEP 2: Found existing wallet with balance: ${currentBalance} ETB`);
    } else {
      console.log(`[REFUND-BUYER-CANCEL] STEP 2: No wallet found for buyer. Creating new wallet.`);
    }
    
    // Calculate new balance
    const newBalance = currentBalance + amount;
    console.log(`[REFUND-BUYER-CANCEL] STEP 3: Calculating new balance: ${currentBalance} + ${amount} = ${newBalance} ETB`);
    
    // Update wallet with new balance
    console.log(`[REFUND-BUYER-CANCEL] STEP 4: Updating buyer wallet to ${newBalance} ETB`);
    if (buyerWalletSnap.exists()) {
      await updateDoc(buyerWalletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(buyerWalletRef, {
        balance: amount,
        userId: buyerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Create transaction record
    console.log(`[REFUND-BUYER-CANCEL] STEP 5: Creating refund transaction record`);
    const refundTransactionRef = doc(collection(db, 'transactions'));
    await setDoc(refundTransactionRef, {
      userId: buyerId,
      amount: amount,
      type: 'credit',
      category: 'refund',
      description: `Refund for cancelled order #${orderNumber} (buyer cancelled)`,
      status: 'completed',
      orderId: orderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`[REFUND-BUYER-CANCEL] STEP 6: Verifying wallet update`);
    // Verify the wallet was updated
    const verifyWalletSnap = await getDoc(buyerWalletRef);
    if (verifyWalletSnap.exists()) {
      const verifyWallet = verifyWalletSnap.data();
      console.log(`[REFUND-BUYER-CANCEL] Verified wallet balance after refund: ${verifyWallet.balance} ETB`);
      if (verifyWallet.balance !== newBalance) {
        console.warn(`[REFUND-BUYER-CANCEL] WARNING: Balance verification failed. Expected ${newBalance} but got ${verifyWallet.balance}`);
      }
    }
    
    console.log(`[REFUND-BUYER-CANCEL] Direct refund processed successfully: ${amount} ETB to buyer ${buyerId} for order ${orderId}`);
    
    return true;
  } catch (error) {
    console.error(`[REFUND-BUYER-CANCEL] Error processing direct refund for order ${orderId}:`, error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Process a refund from seller to buyer
 * @param {string} sellerId - ID of the seller
 * @param {string} buyerId - ID of the buyer
 * @param {number} amount - Amount to refund
 * @param {string} orderId - ID of the order being refunded
 * @returns {Promise<void>}
 */
const processRefund = async (sellerId, buyerId, amount, orderId) => {
  try {
    if (!sellerId || !buyerId || !amount || amount <= 0 || !orderId) {
      throw new Error('Invalid refund parameters');
    }

    const batch = writeBatch(db);
    
    // Get seller wallet
    const sellerWalletRef = doc(db, 'wallets', sellerId);
    const sellerWalletSnap = await getDoc(sellerWalletRef);
    
    if (!sellerWalletSnap.exists()) {
      throw new Error('Seller wallet not found');
    }
    
    const sellerWallet = sellerWalletSnap.data();
    
    // Get buyer wallet
    const buyerWalletRef = doc(db, 'wallets', buyerId);
    const buyerWalletSnap = await getDoc(buyerWalletRef);
    
    if (!buyerWalletSnap.exists()) {
      throw new Error('Buyer wallet not found');
    }
    
    const buyerWallet = buyerWalletSnap.data();
    
    // Check if seller has enough balance
    if ((sellerWallet.balance || 0) < amount) {
      // If seller doesn't have enough balance, still process the refund
      // This could happen if the seller hasn't received the payment yet
      console.warn(`Seller ${sellerId} doesn't have enough balance for refund. Creating system-covered refund.`);
    }
    
    // Create transaction records
    const refundTransactionId = doc(collection(db, 'transactions')).id;
    
    // Buyer transaction (credit)
    const buyerTransactionRef = doc(db, 'transactions', refundTransactionId);
    batch.set(buyerTransactionRef, {
      userId: buyerId,
      amount: amount,
      type: 'credit',
      description: `Refund for order #${orderId.substring(0, 8)}`,
      status: 'completed',
      orderId: orderId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update buyer wallet
    batch.update(buyerWalletRef, {
      balance: (buyerWallet.balance || 0) + amount,
      updatedAt: serverTimestamp()
    });
    
    // If seller has received payment, deduct from their wallet
    if ((sellerWallet.balance || 0) >= amount) {
      // Seller transaction (debit)
      const sellerTransactionRef = doc(db, 'transactions', doc(collection(db, 'transactions')).id);
      batch.set(sellerTransactionRef, {
        userId: sellerId,
        amount: amount,
        type: 'debit',
        description: `Refund issued for order #${orderId.substring(0, 8)}`,
        status: 'completed',
        orderId: orderId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update seller wallet
      batch.update(sellerWalletRef, {
        balance: (sellerWallet.balance || 0) - amount,
        updatedAt: serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Refund processed successfully: ${amount} from seller ${sellerId} to buyer ${buyerId} for order ${orderId}`);
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

// Allow buyer to deny that an order has been delivered
export const denyOrderDelivery = async (orderId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to report non-delivery');
    
    // Get the order data
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    
    // Check if this user owns this order
    if (orderData.userId !== currentUser.uid) {
      throw new Error('You do not have permission to report on this order');
    }
    
    // Check if order is in a status that can be denied
    if (orderData.status !== 'delivered') {
      throw new Error('Only delivered orders can be reported as not received');
    }
    
    // Create a batch for transaction
    const batch = writeBatch(db);
    
    // Update order status back to shipped
    const statusUpdate = {
      status: 'shipped',
      updatedBy: currentUser.uid,
      timestamp: new Date().toISOString() // Use ISO string instead of serverTimestamp()
    };
    
    batch.update(orderRef, {
      status: 'shipped',
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion(statusUpdate),
      deliveryDisputed: true,
      buyerConfirmed: false
    });
    
    // Also update any seller orders related to this order
    try {
      // Find seller orders related to this main order
      const sellerOrdersQuery = query(
        collection(db, 'sellerOrders'),
        where('mainOrderId', '==', orderId)
      );
      
      const sellerOrdersSnap = await getDocs(sellerOrdersQuery);
      
      sellerOrdersSnap.forEach(doc => {
        const sellerOrderRef = doc.ref;
        batch.update(sellerOrderRef, {
          status: 'shipped',
          updatedAt: serverTimestamp(),
          deliveryDisputed: true,
          notifications: arrayUnion({
            message: `Buyer has reported that they have not received this order. Please contact the buyer or support for resolution.`,
            timestamp: new Date().toISOString(),
            status: 'shipped',
            buyerId: currentUser.uid,
            buyerName: currentUser.displayName || 'Buyer'
          })
        });
      });
    } catch (sellerOrderError) {
      console.error('Error updating seller orders:', sellerOrderError);
      // Continue with the main order update even if seller order update fails
    }
    
    // Commit the batch
    await batch.commit();
    
    // Notify seller and admin about the dispute
    try {
      // Add notification to seller's notifications collection
      if (orderData.sellerId) {
        const sellerNotificationRef = collection(db, 'users', orderData.sellerId, 'notifications');
        await addDoc(sellerNotificationRef, {
          type: 'delivery_dispute',
          orderId,
          message: 'A buyer has reported that they have not received their order. Please check the order details and contact the buyer.',
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      // Create a dispute record in the disputes collection
      const disputesRef = collection(db, 'disputes');
      await addDoc(disputesRef, {
        orderId,
        buyerId: currentUser.uid,
        sellerId: orderData.sellerId,
        type: 'delivery_dispute',
        status: 'open',
        description: 'Buyer reported order not delivered',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (notificationError) {
      console.warn('Failed to create delivery dispute notification:', notificationError);
    }
    
    return true;
  } catch (error) {
    console.error('Error denying order delivery:', error);
    throw error;
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

// Shop Settings Management
export const updateShopSettings = async (shopSettings, sellerId) => {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }
    
    // Reference to the shop settings document
    const shopSettingsRef = doc(db, 'shopSettings', sellerId);
    
    // Check if shop settings document exists
    const shopSettingsSnap = await getDoc(shopSettingsRef);
    
    const updatedSettings = {
      ...shopSettings,
      updatedAt: serverTimestamp()
    };
    
    if (!shopSettingsSnap.exists()) {
      // Create new shop settings document
      await setDoc(shopSettingsRef, {
        ...updatedSettings,
        sellerId,
        createdAt: serverTimestamp()
      });
    } else {
      // Update existing shop settings document
      await updateDoc(shopSettingsRef, updatedSettings);
    }
    
    // Update seller profile with shop name and URL
    const userRef = doc(db, 'users', sellerId);
    await updateDoc(userRef, {
      shopName: shopSettings.name,
      shopUrl: shopSettings.url,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating shop settings:', error);
    throw error;
  }
};

// Get shop settings for a seller
export const getShopSettings = async (sellerId) => {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }
    
    const shopSettingsRef = doc(db, 'shopSettings', sellerId);
    const shopSettingsSnap = await getDoc(shopSettingsRef);
    
    if (!shopSettingsSnap.exists()) {
      // Return default empty settings
      return {
        name: '',
        url: '',
        description: '',
        email: '',
        phone: '',
        paymentMethod: '',
        accountName: '',
        bankName: '',
        accountNumber: '',
        mobileNumber: '',
        paypalEmail: '',
        returnPolicy: '',
        shippingPolicy: ''
      };
    }
    
    return shopSettingsSnap.data();
  } catch (error) {
    console.error('Error getting shop settings:', error);
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
