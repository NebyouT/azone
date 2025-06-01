import { Box, Container, Grid, Typography, Link, IconButton, useTheme, alpha, Button, Divider, TextField, useMediaQuery, Paper } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useColorMode } from '../../theme/ThemeProvider';
import { glassmorphism } from '../../theme/futuristicTheme';
import { useCart } from '../../contexts/CartContext';
import TranslationWrapper from '../common/TranslationWrapper';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { cart } = useCart();
  const itemCount = cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0;
  const { t } = useLanguage();
  
  // Define consistent colors
  const orangeColor = '#ED782A';
  const darkOrangeColor = '#D16620';

  // Mobile bottom navigation component
  const MobileBottomNav = () => {
    const isActive = (path) => {
      if (path === '/' && location.pathname === '/') return true;
      if (path !== '/' && location.pathname.startsWith(path)) return true;
      return false;
    };

    return (
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
          backgroundColor: isDark ? '#D16620' : '#ED782A',
          borderTop: `1px solid ${alpha('#FFFFFF', 0.1)}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            py: 1,
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive('/') ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              width: '20%',
            }}
          >
            <HomeIcon sx={{ mb: 0.5 }} />
            <Typography variant="caption">
              <TranslationWrapper translationKey="home">Home</TranslationWrapper>
            </Typography>
          </Box>
          
          <Box
            component={RouterLink}
            to="/products"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive('/products') ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              width: '20%',
            }}
          >
            <CategoryIcon sx={{ mb: 0.5 }} />
            <Typography variant="caption">
              <TranslationWrapper translationKey="products">Products</TranslationWrapper>
            </Typography>
          </Box>
          
          <Box
            component={RouterLink}
            to="/search"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive('/search') ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              width: '20%',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: theme.palette.gradients.primary,
                position: 'absolute',
                top: -28,
                boxShadow: theme.shadows[4],
              }}
            >
              <SearchIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption">
                <TranslationWrapper translationKey="search">Search</TranslationWrapper>
              </Typography>
            </Box>
          </Box>
          
          <Box
            component={RouterLink}
            to="/cart"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive('/cart') ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              width: '20%',
              position: 'relative',
            }}
          >
            <Box sx={{ position: 'relative', mb: 0.5 }}>
              <CartIcon />
              {itemCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: theme.palette.error.main,
                    color: 'white',
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                  }}
                >
                  {itemCount}
                </Box>
              )}
            </Box>
            <Typography variant="caption">
              <TranslationWrapper translationKey="cart">Cart</TranslationWrapper>
            </Typography>
          </Box>
          
          <Box
            component={RouterLink}
            to="/profile"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: isActive('/profile') ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: '0.7rem',
              width: '20%',
            }}
          >
            <PersonIcon sx={{ mb: 0.5 }} />
            <Typography variant="caption">
              <TranslationWrapper translationKey="profile">Profile</TranslationWrapper>
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  // If on mobile, render the mobile bottom navigation
  return isMobile ? (
    <>
      <MobileBottomNav />
      <Box sx={{ height: 70 }} /> {/* Spacer for mobile bottom nav */}
    </>
  ) : (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#FFFFFF',
        color: theme.palette.mode === 'dark' ? '#333333' : '#555555',
        pt: 6,
        pb: 4,
        boxShadow: '0px -2px 10px rgba(0,0,0,0.05)',
        borderTop: `1px solid ${alpha('#000000', 0.05)}`
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item grid={{ xs: 12, sm: 6, md: 3 }}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: theme.palette.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              <TranslationWrapper translationKey="diremart">Diremart</TranslationWrapper>
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              <TranslationWrapper translationKey="description">Your one-stop shop for all your shopping needs. Quality products at affordable prices with fast delivery.</TranslationWrapper>
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1
            }}>
              <IconButton
                size="small"
                sx={{ 
                  color: '#FFFFFF',
                  backgroundColor: '#ED782A',
                  '&:hover': { backgroundColor: '#D16620' } 
                }}
                aria-label="Facebook"
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ 
                  color: '#FFFFFF',
                  backgroundColor: '#ED782A',
                  '&:hover': { backgroundColor: '#D16620' } 
                }}
                aria-label="Instagram"
              >
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ 
                  color: '#FFFFFF',
                  backgroundColor: '#ED782A',
                  '&:hover': { backgroundColor: '#D16620' } 
                }}
                aria-label="Twitter"
              >
                <TwitterIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, letterSpacing: '0.5px', mb: 3 }}>
              <TranslationWrapper translationKey="quickLinks">Quick Links</TranslationWrapper>
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'Become a Seller', path: '/profile' },
                { name: 'My Orders', path: '/orders' },
                { name: 'My Account', path: '/profile' },
              ].map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    color: 'inherit',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: orangeColor,
                      transform: 'translateX(5px)'
                    },
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} sm={6} md={5}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, letterSpacing: '0.5px', mb: 3 }}>
              <TranslationWrapper translationKey="contactUs">Contact Us</TranslationWrapper>
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationIcon sx={{ mt: 0.3, color: orangeColor }} />
                <Typography variant="body2">
                  Dire Dawa, Ethiopia<br />
                  Near Kezira, Main Street
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ color: orangeColor }} />
                <Typography variant="body2">
                  +251 912 946 688
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ color: orangeColor }} />
                <Typography variant="body2">
                  info@diremart.et
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                <TranslationWrapper translationKey="subscribe">Subscribe to our newsletter</TranslationWrapper>
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <TextField
                  size="small"
                  placeholder="Your email"
                  variant="outlined"
                  fullWidth
                  sx={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      color: isDark ? '#FFFFFF' : '#FFFFFF',
                      '& fieldset': {
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
                      opacity: 1,
                    },
                  }}
                />
                <Button 
                  variant="contained" 
                  sx={{ 
                    borderRadius: 0,
                    backgroundColor: orangeColor,
                    color: '#FFFFFF',
                    minWidth: 'auto',
                    border: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: darkOrangeColor,
                      boxShadow: 'none',
                    }
                  }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.1)' }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'center', md: 'space-between' }, 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          pt: 1
        }}>
          <Typography variant="body2" sx={{ color: '#555555', mb: { xs: 2, md: 0 } }}>
            {currentYear} DIREMART. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 } }}>
            <Link underline="hover" component={RouterLink} to="/terms" sx={{ color: '#555555', '&:hover': { color: orangeColor } }}>
              Terms
            </Link>
            <Link underline="hover" component={RouterLink} to="/privacy" sx={{ color: '#555555', '&:hover': { color: orangeColor } }}>
              Privacy
            </Link>
            <Link underline="hover" component={RouterLink} to="/faq" sx={{ color: '#555555', '&:hover': { color: orangeColor } }}>
              FAQ
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
