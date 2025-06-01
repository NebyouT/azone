import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Badge,
  Avatar,
  Divider,
  CircularProgress,
  Zoom,
  Fab,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  SupportAgent as SupportAgentIcon
} from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatWidget = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const { 
    chatOpen, 
    messages, 
    unreadCount, 
    loading, 
    sendMessage, 
    toggleChat, 
    closeChat 
  } = useChat();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    sendMessage(inputMessage);
    setInputMessage('');
  };
  
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };
  
  // Only show the chat widget if user is logged in
  if (!currentUser) {
    return null;
  }
  
  return (
    <>
      {/* Floating Chat Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 20, // Position above the bottom navbar on mobile
          right: 20,
          zIndex: 1000
        }}
      >
        <Zoom in={true}>
          <Badge
            badgeContent={unreadCount}
            color="error"
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Fab
              color="primary"
              aria-label="chat"
              onClick={toggleChat}
              sx={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <ChatIcon />
            </Fab>
          </Badge>
        </Zoom>
      </Box>

      {/* Chat Window */}
      {chatOpen && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 140 : 80, // Position higher above the bottom navbar on mobile
            right: 20,
            width: isMobile ? 'calc(100% - 40px)' : 320, // Full width with padding on mobile
            height: isMobile ? 'calc(100% - 200px)' : 400, // Adjust height on mobile to avoid navbar
            maxHeight: 500,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SupportAgentIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Customer Support</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={closeChat}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider />
          
          {/* Chat Messages */}
          <Box
            sx={{
              p: 2,
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              backgroundColor: theme.palette.background.default
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                <SupportAgentIcon sx={{ fontSize: 40, mb: 2, color: 'primary.main' }} />
                <Typography variant="body1" gutterBottom>
                  Welcome to DireMart Support
                </Typography>
                <Typography variant="body2">
                  How can we help you today?
                </Typography>
              </Box>
            ) : (
              <List sx={{ width: '100%', p: 0 }}>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.isFromUser ? 'flex-end' : 'flex-start',
                      p: 0,
                      mb: 1
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: message.isFromUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 1
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: message.isFromUser ? 'primary.main' : 'secondary.main'
                        }}
                      >
                        {message.isFromUser ? currentUser.displayName?.charAt(0) || 'U' : 'S'}
                      </Avatar>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          backgroundColor: message.isFromUser
                            ? 'primary.main'
                            : theme.palette.mode === 'dark'
                            ? 'grey.800'
                            : 'grey.200',
                          color: message.isFromUser ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="body2">{message.content}</Typography>
                      </Paper>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        alignSelf: message.isFromUser ? 'flex-end' : 'flex-start',
                        mt: 0.5,
                        mx: 4
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>
            )}
          </Box>
          
          <Divider />
          
          {/* Chat Input */}
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={handleInputChange}
              disabled={loading}
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 0
                }
              }}
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={loading || !inputMessage.trim()}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatWidget;
