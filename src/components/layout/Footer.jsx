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
  const { itemCount } = useCart();
  const { t } = useLanguage();

  // Mobile bottom navigation component
  const MobileBottomNav = () => {
    const isActive = (path) => {
      if (path === '/' && location.pathname === '/') return true;
      if (path !== '/' && location.pathname.startsWith(path)) return true;
      return false;
    };

    return (
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
          ...glassmorphism(0.9, 10, isDark),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
              color: isActive('/') ? theme.palette.primary.main : theme.palette.text.secondary,
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
              color: isActive('/products') ? theme.palette.primary.main : theme.palette.text.secondary,
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
              color: isActive('/search') ? theme.palette.primary.main : theme.palette.text.secondary,
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
              color: isActive('/cart') ? theme.palette.primary.main : theme.palette.text.secondary,
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
              color: isActive('/profile') ? theme.palette.primary.main : theme.palette.text.secondary,
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
  if (isMobile) {
    return <MobileBottomNav />;
  }

  // Desktop footer
  return (
    <Box
      sx={{
        position: 'relative',
        color: 'text.primary',
        py: { xs: 4, md: 6 },
        mt: 'auto',
        ...glassmorphism(0.8, 10, isDark),
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: `linear-gradient(to top, ${alpha(theme.palette.background.default, 0)}, ${alpha(theme.palette.background.default, 0.1)})`,
          pointerEvents: 'none',
          zIndex: -1,
        }
      }}
      component="footer"
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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
              <TranslationWrapper translationKey="azone">Azone</TranslationWrapper>
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              <TranslationWrapper translationKey="description">Your one-stop shop for all your shopping needs. Quality products at affordable prices with fast delivery.</TranslationWrapper>
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              '& .MuiIconButton-root': {
                transition: 'all 0.2s ease',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  transform: 'translateY(-3px)'
                }
              }
            }}>
              <IconButton color="primary" aria-label="Facebook" size="small">
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton color="primary" aria-label="Twitter" size="small">
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton color="primary" aria-label="Instagram" size="small">
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton color="primary" aria-label="YouTube" size="small">
                <YouTubeIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              <TranslationWrapper translationKey="quickLinks">Quick Links</TranslationWrapper>
            </Typography>
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { name: 'home', path: '/' },
                { name: 'products', path: '/products' },
                { name: 'aboutUs', path: '/about' },
                { name: 'contact', path: '/contact' },
                { name: 'faqs', path: '/faqs' }
              ].map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.path}
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    mb: 1.5, 
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'translateX(5px)',
                      color: theme.palette.primary.main
                    },
                    display: 'inline-block',
                    fontSize: { xs: '0.875rem', md: 'inherit' }
                  }}
                >
                  <TranslationWrapper translationKey={link.name}>{t(link.name)}</TranslationWrapper>
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              <TranslationWrapper translationKey="customerService">Customer Service</TranslationWrapper>
            </Typography>
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { name: 'myAccount', path: '/profile' },
                { name: 'myOrders', path: '/orders' },
                { name: 'shippingPolicy', path: '/shipping' },
                { name: 'returnsRefunds', path: '/returns' },
                { name: 'privacyPolicy', path: '/privacy' }
              ].map((link) => (
                <Link
                  key={link.name}
                  component={RouterLink}
                  to={link.path}
                  color="inherit"
                  underline="hover"
                  sx={{ 
                    mb: 1.5, 
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'translateX(5px)',
                      color: theme.palette.primary.main
                    },
                    display: 'inline-block',
                    fontSize: { xs: '0.875rem', md: 'inherit' }
                  }}
                >
                  <TranslationWrapper translationKey={link.name}>{t(link.name)}</TranslationWrapper>
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              <TranslationWrapper translationKey="contactUs">Contact Us</TranslationWrapper>
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  <TranslationWrapper translationKey="address">123 Commerce St, Market City</TranslationWrapper>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  +1 (234) 567-8900
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  support@azone.com
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              <TranslationWrapper translationKey="subscribe">Subscribe to our newsletter</TranslationWrapper>
            </Typography>
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                size="small"
                placeholder="Your email"
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '0',
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  }
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  borderRadius: 0,
                  background: theme.palette.gradients.primary,
                  minWidth: 'auto'
                }}
              >
                <SendIcon fontSize="small" />
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: { xs: 3, md: 4 }, opacity: 0.1 }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: { xs: 'center', md: 'space-between' }, 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          textAlign: { xs: 'center', md: 'left' },
          opacity: 0.7 
        }}>
          <Typography variant="body2" sx={{ mb: { xs: 2, md: 0 } }}>
            {currentYear} <TranslationWrapper translationKey="azone">Azone</TranslationWrapper>. <TranslationWrapper translationKey="copyright">All rights reserved.</TranslationWrapper>
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link color="inherit" underline="hover" component={RouterLink} to="/terms">
              <TranslationWrapper translationKey="terms">Terms of Service</TranslationWrapper>
            </Link>
            <Link color="inherit" underline="hover" component={RouterLink} to="/privacy">
              <TranslationWrapper translationKey="privacy">Privacy Policy</TranslationWrapper>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
