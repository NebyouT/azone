import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  ShoppingBag as OrdersIcon,
  AccountBalanceWallet as WalletIcon,
  Store as StoreIcon,
  LocalOffer as PromotionIcon,
  Announcement as AnnouncementIcon,
  Email as EmailIcon,
  NotificationsActive as PushNotificationIcon,
  LocalShipping as DeliveryIcon
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationSettings = ({ onBack }) => {
  const theme = useTheme();
  const { notificationSettings, updateSettings } = useNotification();
  const [settings, setSettings] = useState(notificationSettings);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSave = async () => {
    const success = await updateSettings(settings);
    setSnackbar({
      open: true,
      message: success ? 'Notification settings updated successfully' : 'Failed to update settings',
      severity: success ? 'success' : 'error'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Notification categories with icons and descriptions
  const notificationCategories = [
    {
      id: 'orderStatusUpdates',
      name: 'Order Status Updates',
      description: 'Get notified when your order status changes (confirmed, shipped, delivered, etc.)',
      icon: <OrdersIcon fontSize="large" color="primary" />
    },
    {
      id: 'deliveryUpdates',
      name: 'Delivery Updates',
      description: 'Receive notifications about delivery confirmations and delivery status changes',
      icon: <DeliveryIcon fontSize="large" color="info" />
    },
    {
      id: 'walletTransactions',
      name: 'Wallet Transactions',
      description: 'Get notified about deposits, withdrawals, payments, and refunds',
      icon: <WalletIcon fontSize="large" color="success" />
    },
    {
      id: 'newProductsFromFollowedSellers',
      name: 'New Products',
      description: 'Receive notifications when sellers you follow add new products',
      icon: <StoreIcon fontSize="large" color="secondary" />
    },
    {
      id: 'promotionsAndDiscounts',
      name: 'Promotions & Discounts',
      description: 'Stay updated on special offers, discounts, and promotions',
      icon: <PromotionIcon fontSize="large" color="error" />
    },
    {
      id: 'systemAnnouncements',
      name: 'System Announcements',
      description: 'Important announcements and updates about the Azone platform',
      icon: <AnnouncementIcon fontSize="large" color="warning" />
    }
  ];

  // Notification channels
  const notificationChannels = [
    {
      id: 'emailNotifications',
      name: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: <EmailIcon fontSize="large" color="primary" />
    },
    {
      id: 'pushNotifications',
      name: 'Push Notifications',
      description: 'Receive push notifications in your browser (coming soon)',
      icon: <PushNotificationIcon fontSize="large" color="secondary" />
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Notification Settings
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography variant="h6" gutterBottom>
          Notification Categories
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose which types of notifications you want to receive
        </Typography>
        
        <Grid container spacing={3}>
          {notificationCategories.map((category) => (
            <Grid item xs={12} sm={6} key={category.id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: settings[category.id] 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : theme.palette.background.paper
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ mr: 2 }}>
                      {category.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings[category.id]}
                            onChange={handleChange}
                            name={category.id}
                            color="primary"
                          />
                        }
                        label={settings[category.id] ? "Enabled" : "Disabled"}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Notification Channels
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Choose how you want to receive your notifications
        </Typography>

        <Grid container spacing={3}>
          {notificationChannels.map((channel) => (
            <Grid item xs={12} sm={6} key={channel.id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: settings[channel.id] 
                    ? alpha(theme.palette.primary.main, 0.05)
                    : theme.palette.background.paper
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ mr: 2 }}>
                      {channel.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {channel.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {channel.description}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings[channel.id]}
                            onChange={handleChange}
                            name={channel.id}
                            color="primary"
                            disabled={channel.id === 'pushNotifications'} // Disable push notifications for now
                          />
                        }
                        label={settings[channel.id] ? "Enabled" : "Disabled"}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationSettings;
