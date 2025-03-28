import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup
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
import { initializeWallet, processPayment } from './walletServices';

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

// Authentication services
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
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    
    // Initialize wallet for the new user
    await initializeWallet(user.uid, role);
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

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

export const addProduct = async (productData, imageFile) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to add a product');
    
    // Upload product image to Cloudinary if provided
    let imageUrl = null;
    if (imageFile) {
      // Upload to Cloudinary with seller ID as part of the folder path
      imageUrl = await uploadImage(imageFile, `products/${currentUser.uid}`);
    }
    
    // Create product document in Firestore
    const productRef = await addDoc(collection(db, 'products'), {
      ...productData,
      imageUrl,
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

export const updateProduct = async (productId, productData, newImageFile) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('You must be logged in to update a product');
    
    // Get the current product data
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    
    const productDetails = productSnap.data();
    
    // Verify that the current user is the seller of this product
    if (productDetails.sellerId !== currentUser.uid) {
      throw new Error('You do not have permission to update this product');
    }
    
    // Upload new image to Cloudinary if provided
    let imageUrl = productData.imageUrl;
    if (newImageFile) {
      // We don't need to delete the old image from Cloudinary as it will be handled by Cloudinary's auto cleanup
      // Just upload the new image
      imageUrl = await uploadImage(newImageFile, `products/${currentUser.uid}`);
    }
    
    // Update product document in Firestore
    await updateDoc(productRef, {
      ...productData,
      imageUrl,
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
    
    // Add userId and timestamps to order data
    const completeOrderData = {
      ...orderData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: orderData.status || 'pending'
    };
    
    // Create order document
    const ordersRef = collection(db, 'orders');
    const orderRef = await addDoc(ordersRef, completeOrderData);
    
    // If using wallet payment, process the payment
    if (orderData.paymentMethod === 'wallet') {
      // Get seller ID from first item (assuming all items are from same seller for now)
      const sellerId = orderData.items[0]?.sellerId;
      
      if (sellerId) {
        await processPayment(userId, sellerId, orderData.total, orderRef.id);
      }
    }
    
    return {
      id: orderRef.id,
      ...completeOrderData
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get user's orders
export const getUserOrders = async (userId) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('User not authenticated');
      userId = currentUser.uid;
    }
    
    // Query orders collection for user's orders
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get order details
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
      // If index error occurs, fall back to simpler query without ordering
      if (indexError.message && indexError.message.includes('index')) {
        console.warn('Falling back to unordered query. For better performance, create the suggested index.');
        
        // Fallback query without ordering (doesn't require composite index)
        const fallbackQuery = query(
          collection(db, 'products'),
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
      } else {
        // If it's not an index error, rethrow
        throw indexError;
      }
    }
  } catch (error) {
    console.error("Error getting seller products:", error);
    throw error;
  }
};

// Order Management
export const getSellerOrders = async (sellerId) => {
  try {
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
    
    // Update order document
    await updateDoc(orderRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating order status for seller:", error);
    throw error;
  }
};
