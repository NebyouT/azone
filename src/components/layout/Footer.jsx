import { Box, Container, Grid, Typography, Link, IconButton, useTheme, alpha, Button, Divider, TextField, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useColorMode } from '../../theme/ThemeProvider';
import { glassmorphism } from '../../theme/futuristicTheme';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'relative',
        color: 'text.primary',
        py: { xs: 4, md: 6 },
        mt: 'auto',
        ...glassmorphism(0.8, 10, isDark),
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
              Azone
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              Your one-stop shop for all your shopping needs. Quality products at affordable prices with fast delivery.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              '& .MuiIconButton-root': {
                transition: 'all 0.2s ease',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
              Quick Links
            </Typography>
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'About Us', path: '/about' },
                { name: 'Contact', path: '/contact' },
                { name: 'FAQs', path: '/faqs' }
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
                  {link.name}
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Customer Service
            </Typography>
            <Box component="nav" sx={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { name: 'My Account', path: '/profile' },
                { name: 'My Orders', path: '/orders' },
                { name: 'Shipping Policy', path: '/shipping' },
                { name: 'Returns & Refunds', path: '/returns' },
                { name: 'Privacy Policy', path: '/privacy' }
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
                  {link.name}
                </Link>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Contact Us
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  123 Commerce St, Market City
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
              Subscribe to our newsletter
            </Typography>
            <Box sx={{ display: 'flex', mt: 1 }}>
              <TextField
                size="small"
                placeholder="Your email"
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px 0 0 8px',
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  }
                }}
              />
              <Button 
                variant="contained" 
                sx={{ 
                  borderRadius: '0 8px 8px 0',
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
            {currentYear} Azone. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link color="inherit" underline="hover" component={RouterLink} to="/terms">
              Terms of Service
            </Link>
            <Link color="inherit" underline="hover" component={RouterLink} to="/privacy">
              Privacy Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
