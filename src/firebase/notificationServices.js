import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  onSnapshot,
  writeBatch,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

// Get user's notifications with real-time updates
export const getNotifications = (userId, callback) => {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  
  // Set up real-time listener
  return onSnapshot(notificationsRef, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(notifications);
  });
};

// Create a new notification
export const createNotification = async (userId, notification) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const newNotification = {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(notificationsRef, newNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const snapshot = await getDocs(query(notificationsRef, where('read', '==', false)));
    
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async (userId) => {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'notifications');
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create default settings if they don't exist
      const defaultSettings = {
        orderStatusUpdates: true,
        deliveryUpdates: true,
        walletTransactions: true,
        newProductsFromFollowedSellers: true,
        promotionsAndDiscounts: true,
        systemAnnouncements: true,
        emailNotifications: true,
        pushNotifications: false
      };
      
      await updateNotificationSettings(userId, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (userId, settings) => {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'notifications');
    await updateDoc(settingsRef, settings).catch(async (error) => {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(settingsRef, settings);
      } else {
        throw error;
      }
    });
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// Create order status notification
export const createOrderStatusNotification = async (userId, orderId, status, sellerName) => {
  try {
    let title = 'Order Status Update';
    let message = '';
    
    switch (status) {
      case 'confirmed':
        message = `Your order #${orderId} has been confirmed by ${sellerName} and is being processed.`;
        break;
      case 'shipped':
        message = `Your order #${orderId} has been shipped by ${sellerName}.`;
        break;
      case 'delivered':
        message = `Your order #${orderId} has been marked as delivered by ${sellerName}. Please confirm receipt.`;
        break;
      case 'completed':
        message = `Your order #${orderId} has been completed. Thank you for shopping with us!`;
        break;
      case 'cancelled':
        message = `Your order #${orderId} has been cancelled.`;
        break;
      default:
        message = `Your order #${orderId} status has been updated to ${status}.`;
    }
    
    const notification = {
      title,
      message,
      type: 'order_status',
      orderId,
      status
    };
    
    return await createNotification(userId, notification);
  } catch (error) {
    console.error('Error creating order status notification:', error);
    throw error;
  }
};

// Create wallet transaction notification
export const createWalletNotification = async (userId, transactionType, amount, currency = 'USD') => {
  try {
    let title = 'Wallet Update';
    let message = '';
    
    switch (transactionType) {
      case 'deposit':
        message = `${amount} ${currency} has been added to your wallet.`;
        break;
      case 'withdrawal':
        message = `${amount} ${currency} has been withdrawn from your wallet.`;
        break;
      case 'payment':
        message = `Payment of ${amount} ${currency} has been processed from your wallet.`;
        break;
      case 'refund':
        message = `Refund of ${amount} ${currency} has been credited to your wallet.`;
        break;
      default:
        message = `A wallet transaction of ${amount} ${currency} has been processed.`;
    }
    
    const notification = {
      title,
      message,
      type: 'wallet',
      transactionType,
      amount,
      currency
    };
    
    return await createNotification(userId, notification);
  } catch (error) {
    console.error('Error creating wallet notification:', error);
    throw error;
  }
};

// Create new product notification
export const createNewProductNotification = async (userId, productId, productName, sellerName) => {
  try {
    const title = 'New Product Available';
    const message = `${sellerName} has added a new product: ${productName}`;
    
    const notification = {
      title,
      message,
      type: 'new_product',
      productId,
      sellerName
    };
    
    return await createNotification(userId, notification);
  } catch (error) {
    console.error('Error creating new product notification:', error);
    throw error;
  }
};

// Create promotion notification
export const createPromotionNotification = async (userId, promotionId, promotionTitle, discount) => {
  try {
    const title = 'New Promotion Available';
    const message = `${promotionTitle}: Get ${discount}% off on selected items!`;
    
    const notification = {
      title,
      message,
      type: 'promotion',
      promotionId
    };
    
    return await createNotification(userId, notification);
  } catch (error) {
    console.error('Error creating promotion notification:', error);
    throw error;
  }
};

// Create system announcement notification
export const createAnnouncementNotification = async (userId, title, message) => {
  try {
    const notification = {
      title,
      message,
      type: 'announcement'
    };
    
    return await createNotification(userId, notification);
  } catch (error) {
    console.error('Error creating announcement notification:', error);
    throw error;
  }
};

// Send bulk notifications for new product to all followers
export const sendNewProductNotificationToFollowers = async (followersIds, productId, productName, sellerName) => {
  try {
    const batch = writeBatch(db);
    
    for (const userId of followersIds) {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const newNotificationRef = doc(notificationsRef);
      
      batch.set(newNotificationRef, {
        title: 'New Product Available',
        message: `${sellerName} has added a new product: ${productName}`,
        type: 'new_product',
        productId,
        sellerName,
        read: false,
        createdAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error sending bulk new product notifications:', error);
    throw error;
  }
};

// Send bulk notifications for order status updates
export const sendBulkOrderStatusNotifications = async (userIds, orderId, status, sellerName) => {
  try {
    const batch = writeBatch(db);
    
    for (const userId of userIds) {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const newNotificationRef = doc(notificationsRef);
      
      let title = 'Order Status Update';
      let message = '';
      
      switch (status) {
        case 'confirmed':
          message = `Your order #${orderId} has been confirmed by ${sellerName} and is being processed.`;
          break;
        case 'shipped':
          message = `Your order #${orderId} has been shipped by ${sellerName}.`;
          break;
        case 'delivered':
          message = `Your order #${orderId} has been marked as delivered by ${sellerName}. Please confirm receipt.`;
          break;
        case 'completed':
          message = `Your order #${orderId} has been completed. Thank you for shopping with us!`;
          break;
        case 'cancelled':
          message = `Your order #${orderId} has been cancelled.`;
          break;
        default:
          message = `Your order #${orderId} status has been updated to ${status}.`;
      }
      
      batch.set(newNotificationRef, {
        title,
        message,
        type: 'order_status',
        orderId,
        status,
        read: false,
        createdAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error sending bulk order status notifications:', error);
    throw error;
  }
};

// Helper function to generate notification message based on order status
export const getStatusNotificationMessage = (status, sellerName) => {
  switch (status) {
    case 'confirmed':
      return `Your order has been confirmed by ${sellerName} and is being processed.`;
    case 'shipped':
      return `Your order has been shipped by ${sellerName}.`;
    case 'delivered':
      return `Your order has been marked as delivered by ${sellerName}. Please confirm receipt.`;
    case 'completed':
      return `Your order has been completed. Thank you for shopping with us!`;
    case 'cancelled':
      return `Your order has been cancelled.`;
    default:
      return `Your order status has been updated to ${status} by ${sellerName}.`;
  }
};
