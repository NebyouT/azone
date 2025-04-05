import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingBag as OrdersIcon,
  AccountBalanceWallet as WalletIcon,
  Store as StoreIcon,
  LocalOffer as PromotionIcon,
  Announcement as AnnouncementIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from './NotificationSettings';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationsPage = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const navigate = useNavigate();

  // Update filtered notifications when tab changes or notifications update
  useEffect(() => {
    setFilteredNotifications(getFilteredNotifications());
  }, [tabValue, notifications]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'order_status':
        navigate(`/orders/${notification.orderId}`);
        break;
      case 'wallet':
        navigate('/wallet');
        break;
      case 'new_product':
        navigate(`/products/${notification.productId}`);
        break;
      case 'promotion':
        navigate('/promotions');
        break;
      default:
        // Do nothing for other types
        break;
    }
  };

  // Filter notifications based on tab
  const getFilteredNotifications = () => {
    if (tabValue === 0) return notifications;
    
    const types = {
      1: 'order_status',
      2: 'wallet',
      3: 'new_product',
      4: 'promotion',
      5: 'announcement'
    };
    
    return notifications.filter(notification => notification.type === types[tabValue]);
  };

  // Handle notification deletion
  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();
    deleteNotification(notificationId);
  };

  // Get notification type label
  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'order_status':
        return 'Order';
      case 'wallet':
        return 'Wallet';
      case 'new_product':
        return 'Product';
      case 'promotion':
        return 'Promotion';
      case 'announcement':
        return 'System';
      default:
        return 'Other';
    }
  };

  // Get notification type color
  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'order_status':
        return 'primary';
      case 'wallet':
        return 'success';
      case 'new_product':
        return 'info';
      case 'promotion':
        return 'secondary';
      case 'announcement':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_status':
        return <OrdersIcon fontSize="small" color="primary" />;
      case 'wallet':
        return <WalletIcon fontSize="small" color="success" />;
      case 'new_product':
        return <StoreIcon fontSize="small" color="info" />;
      case 'promotion':
        return <PromotionIcon fontSize="small" color="secondary" />;
      case 'announcement':
        return <AnnouncementIcon fontSize="small" color="warning" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  // Get tab count - number of notifications for each tab
  const getTabCount = (tabIndex) => {
    if (tabIndex === 0) return notifications.length;
    
    const types = {
      1: 'order_status',
      2: 'wallet',
      3: 'new_product',
      4: 'promotion',
      5: 'announcement'
    };
    
    return notifications.filter(notification => notification.type === types[tabIndex]).length;
  };

  if (showSettings) {
    return <NotificationSettings onBack={() => setShowSettings(false)} />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <Button 
              variant="outlined" 
              startIcon={<CheckIcon />}
              onClick={markAllAsRead}
              sx={{ mr: 2 }}
            >
              Mark all as read
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="notification tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Tab 
            icon={<NotificationsIcon />} 
            label={`All (${getTabCount(0)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<OrdersIcon />} 
            label={`Orders (${getTabCount(1)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<WalletIcon />} 
            label={`Wallet (${getTabCount(2)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<StoreIcon />} 
            label={`Products (${getTabCount(3)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<PromotionIcon />} 
            label={`Promotions (${getTabCount(4)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<AnnouncementIcon />} 
            label={`System (${getTabCount(5)})`}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>

        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              p: 4,
              minHeight: 200
            }}>
              <NotificationsIcon sx={{ fontSize: 60, opacity: 0.5, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No notifications</Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any {tabValue !== 0 ? 'notifications in this category' : 'notifications yet'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    button
                    alignItems="flex-start"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 2,
                      px: 3,
                      backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                      borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ mt: 1 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          <Chip 
                            label={getNotificationTypeLabel(notification.type)} 
                            color={getNotificationTypeColor(notification.type)}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography 
                            variant="body2" 
                            color="text.primary"
                            sx={{ 
                              mb: 1,
                              fontWeight: notification.read ? 'normal' : 'medium'
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.createdAt && typeof notification.createdAt.toDate === 'function' 
                              ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                              : 'Just now'}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {!notification.read && (
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          sx={{ mb: 1 }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        edge="end" 
                        aria-label="delete notification"
                        onClick={(e) => handleDeleteNotification(e, notification.id)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default NotificationsPage;
