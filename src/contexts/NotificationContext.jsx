import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  updateNotificationSettings as updateNotificationSettingsService,
  getNotificationSettings,
  deleteNotification as deleteNotificationService
} from '../firebase/notificationServices';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    orderStatusUpdates: true,
    deliveryUpdates: true,
    walletTransactions: true,
    newProductsFromFollowedSellers: true,
    promotionsAndDiscounts: true,
    systemAnnouncements: true,
    emailNotifications: true,
    pushNotifications: false
  });

  // Fetch notifications when user changes
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getNotifications(currentUser.uid, (notificationsData) => {
      // Sort notifications by creation date (newest first)
      const sortedNotifications = notificationsData.sort((a, b) => {
        // Check if timestamps exist before trying to call toDate()
        const dateA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : new Date();
        const dateB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : new Date();
        return dateB - dateA;
      });
      
      setNotifications(sortedNotifications);
      
      // Count unread notifications
      const unreadNotifications = sortedNotifications.filter(notification => !notification.read);
      setUnreadCount(unreadNotifications.length);
      
      setLoading(false);
    });

    // Fetch user notification settings
    fetchNotificationSettings();

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    if (!currentUser) return;
    
    try {
      const settings = await getNotificationSettings(currentUser.uid);
      if (settings) {
        setNotificationSettings(settings);
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser) return;
    
    try {
      await markNotificationAsRead(currentUser.uid, notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    if (!currentUser) return;
    
    try {
      await deleteNotificationService(currentUser.uid, notificationId);
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Update notification settings
  const updateSettings = async (settings) => {
    if (!currentUser) return false;
    
    try {
      await updateNotificationSettingsService(currentUser.uid, settings);
      setNotificationSettings(settings);
      return true;
    } catch (error) {
      console.error("Error updating notification settings:", error);
      return false;
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notificationSettings,
    updateSettings
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
