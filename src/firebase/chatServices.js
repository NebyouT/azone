import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './config';

// Create a new chat message
export const sendChatMessage = async (userId, message, isFromUser = true) => {
  try {
    // Get user reference to ensure the user exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    // Check if a chat collection exists for this user
    const userChatsRef = collection(db, 'users', userId, 'chats');
    const userChatsQuery = query(userChatsRef, limit(1));
    const userChatsSnap = await getDocs(userChatsQuery);
    
    let chatId;
    
    // If no chat exists, create a new chat thread
    if (userChatsSnap.empty) {
      const newChatRef = await addDoc(userChatsRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        unreadCount: isFromUser ? 0 : 1, // If from support, mark as unread for user
        lastMessage: message,
        lastMessageTime: serverTimestamp()
      });
      
      chatId = newChatRef.id;
    } else {
      // Use the existing chat thread
      chatId = userChatsSnap.docs[0].id;
      
      // Update the chat thread
      const chatRef = doc(db, 'users', userId, 'chats', chatId);
      await updateDoc(chatRef, {
        updatedAt: serverTimestamp(),
        status: 'active',
        unreadCount: isFromUser ? 0 : 1, // If from support, increment unread count
        lastMessage: message,
        lastMessageTime: serverTimestamp()
      });
    }
    
    // Add the message to the messages subcollection
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      content: message,
      timestamp: serverTimestamp(),
      isFromUser,
      read: isFromUser, // Messages from user are automatically read by support
      userId
    });
    
    return chatId;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Get chat messages for a user
export const getChatMessages = (userId, callback) => {
  try {
    // Get the chat ID for this user (assuming one chat thread per user)
    const userChatsRef = collection(db, 'users', userId, 'chats');
    const userChatsQuery = query(userChatsRef, limit(1));
    
    // First get the chat document
    return onSnapshot(userChatsQuery, async (chatSnapshot) => {
      if (chatSnapshot.empty) {
        // No chat exists yet
        callback([]);
        return;
      }
      
      const chatDoc = chatSnapshot.docs[0];
      const chatId = chatDoc.id;
      
      // Then get the messages for this chat
      const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      
      // Subscribe to messages
      onSnapshot(messagesQuery, (messagesSnapshot) => {
        const messages = [];
        messagesSnapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp ? new Date(doc.data().timestamp.seconds * 1000) : new Date()
          });
        });
        
        callback(messages);
      });
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

// Mark chat messages as read
export const markChatAsRead = async (userId) => {
  try {
    // Get the chat ID for this user
    const userChatsRef = collection(db, 'users', userId, 'chats');
    const userChatsQuery = query(userChatsRef, limit(1));
    const userChatsSnap = await getDocs(userChatsQuery);
    
    if (userChatsSnap.empty) {
      // No chat exists yet
      return;
    }
    
    const chatDoc = userChatsSnap.docs[0];
    const chatId = chatDoc.id;
    
    // Update the chat thread to mark as read
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await updateDoc(chatRef, {
      unreadCount: 0
    });
    
    // Get all unread messages
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const unreadQuery = query(messagesRef, where('read', '==', false));
    const unreadSnap = await getDocs(unreadQuery);
    
    // Mark each message as read
    const batch = [];
    unreadSnap.forEach((doc) => {
      const messageRef = doc.ref;
      batch.push(updateDoc(messageRef, { read: true }));
    });
    
    // Execute all updates
    await Promise.all(batch);
    
    return true;
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw error;
  }
};

// Get unread chat count for a user
export const getUnreadChatCount = (userId, callback) => {
  try {
    const userChatsRef = collection(db, 'users', userId, 'chats');
    const userChatsQuery = query(userChatsRef, limit(1));
    
    return onSnapshot(userChatsQuery, (snapshot) => {
      if (snapshot.empty) {
        callback(0);
        return;
      }
      
      const chatDoc = snapshot.docs[0];
      const unreadCount = chatDoc.data().unreadCount || 0;
      callback(unreadCount);
    });
  } catch (error) {
    console.error('Error getting unread chat count:', error);
    callback(0);
  }
};

// Close a chat thread
export const closeChat = async (userId) => {
  try {
    // Get the chat ID for this user
    const userChatsRef = collection(db, 'users', userId, 'chats');
    const userChatsQuery = query(userChatsRef, limit(1));
    const userChatsSnap = await getDocs(userChatsQuery);
    
    if (userChatsSnap.empty) {
      // No chat exists yet
      return;
    }
    
    const chatDoc = userChatsSnap.docs[0];
    const chatId = chatDoc.id;
    
    // Update the chat thread to mark as closed
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await updateDoc(chatRef, {
      status: 'closed',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error closing chat:', error);
    throw error;
  }
};
