import React, { useState } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  Button,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  ShoppingBag as OrdersIcon,
  AccountBalanceWallet as WalletIcon,
  Store as StoreIcon,
  LocalOffer as PromotionIcon,
  Announcement as AnnouncementIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

// Styled components
const NotificationMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    width: 320,
    maxHeight: 400,
    borderRadius: 4,
    boxShadow: theme.shadows[3],
    marginTop: theme.spacing(1),
  },
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NotificationItem = styled(MenuItem)(({ theme, isRead }) => ({
  padding: theme.spacing(1.5, 2),
  borderLeft: isRead ? 'none' : `4px solid ${theme.palette.primary.main}`,
  backgroundColor: isRead ? 'transparent' : theme.palette.action.hover,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const EmptyNotification = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const NotificationIcon = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
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
    
    handleClose();
  };
  
  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };

  // Get icon based on notification type
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

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size="large"
          aria-label={`show ${unreadCount} new notifications`}
          color="inherit"
          onClick={handleOpen}
          sx={{
            ml: 1,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' },
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <NotificationMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <NotificationHeader>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={handleMarkAllAsRead}
              startIcon={<CheckIcon fontSize="small" />}
            >
              Mark all as read
            </Button>
          )}
        </NotificationHeader>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <EmptyNotification>
            <NotificationsIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
            <Typography variant="body2">No notifications yet</Typography>
          </EmptyNotification>
        ) : (
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <NotificationItem 
                  onClick={() => handleNotificationClick(notification)}
                  isRead={notification.read}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" noWrap>
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
                </NotificationItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </Box>
        )}
        
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            fullWidth 
            size="small" 
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            View All
          </Button>
        </Box>
      </NotificationMenu>
    </>
  );
};

export default NotificationIcon;
