import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getChatMessages, 
  sendChatMessage, 
  markChatAsRead,
  getUnreadChatCount,
  closeChat
} from '../firebase/chatServices';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Subscribe to chat messages when user is logged in and chat is open
  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      return;
    }
    
    // Subscribe to unread count
    const unsubscribeUnreadCount = getUnreadChatCount(currentUser.uid, (count) => {
      setUnreadCount(count);
    });
    
    // Only subscribe to messages if chat is open
    let unsubscribeMessages = () => {};
    if (chatOpen) {
      unsubscribeMessages = getChatMessages(currentUser.uid, (chatMessages) => {
        setMessages(chatMessages);
      });
      
      // Mark messages as read when chat is opened
      markChatAsRead(currentUser.uid).catch(err => {
        console.error('Error marking chat as read:', err);
      });
    }
    
    return () => {
      unsubscribeUnreadCount();
      unsubscribeMessages();
    };
  }, [currentUser, chatOpen]);
  
  // Send a message
  const sendMessage = async (message) => {
    if (!currentUser || !message.trim()) return;
    
    try {
      setLoading(true);
      await sendChatMessage(currentUser.uid, message, true);
      
      // Auto-reply from customer support (for demo purposes)
      // In a real application, this would be handled by a customer support agent
      setTimeout(async () => {
        const replies = [
          "Thank you for your message! Our customer support team will get back to you shortly.",
          "Hello! How can we help you today?",
          "We've received your message and will respond as soon as possible.",
          "Thanks for reaching out. A customer support agent will assist you soon."
        ];
        
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        await sendChatMessage(currentUser.uid, randomReply, false);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle chat window
  const toggleChat = () => {
    setChatOpen(prevState => !prevState);
    
    // Mark as read when opening
    if (!chatOpen && currentUser) {
      markChatAsRead(currentUser.uid).catch(err => {
        console.error('Error marking chat as read:', err);
      });
    }
  };
  
  // Close chat
  const handleCloseChat = async () => {
    if (!currentUser) return;
    
    try {
      await closeChat(currentUser.uid);
      setChatOpen(false);
    } catch (error) {
      console.error('Error closing chat:', error);
      setError('Failed to close chat. Please try again.');
    }
  };
  
  const value = {
    chatOpen,
    messages,
    unreadCount,
    loading,
    error,
    sendMessage,
    toggleChat,
    closeChat: handleCloseChat
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
