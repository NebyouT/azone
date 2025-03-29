import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  IconButton,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  CreditCard as CreditCardIcon,
  Support as SupportIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ShoppingBag as ShoppingBagIcon,
  Star as StarIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { getProducts } from '../../firebase/services';
import { useColorMode } from '../../theme/ThemeProvider';
import { glassmorphism, cardHoverEffect } from '../../theme/futuristicTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import TranslationWrapper from '../common/TranslationWrapper';

// Simple Carousel Component
const SimpleCarousel = ({ items, autoPlay = true, interval = 6000 }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    let timer;
    if (autoPlay) {
      timer = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
      }, interval);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [items.length, autoPlay, interval]);
  
  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };
  
  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
      {items.map((item, index) => (
        <Box
          key={item.id}
          sx={{
            display: index === activeIndex ? 'block' : 'none',
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          {item}
        </Box>
      ))}
      
      <IconButton
        onClick={handlePrev}
        sx={{
          position: 'absolute',
          left: { xs: 8, md: 16 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
          zIndex: 1,
          width: { xs: 36, md: 48 },
          height: { xs: 36, md: 48 },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <ArrowBackIosIcon fontSize={isMobile ? 'small' : 'medium'} />
      </IconButton>
      
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: { xs: 8, md: 16 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
          zIndex: 1,
          width: { xs: 36, md: 48 },
          height: { xs: 36, md: 48 },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <ArrowForwardIosIcon fontSize={isMobile ? 'small' : 'medium'} />
      </IconButton>
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          position: 'absolute',
          bottom: 16,
          width: '100%',
          zIndex: 1
        }}
      >
        {items.map((_, index) => (
          <Box
            key={index}
            onClick={() => setActiveIndex(index)}
            sx={{
              width: { xs: 8, md: 12 },
              height: { xs: 8, md: 12 },
              borderRadius: '50%',
              mx: 0.5,
              bgcolor: index === activeIndex ? 'primary.main' : alpha(theme.palette.background.paper, 0.7),
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.2)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Get featured products
        const featured = await getProducts(null, 'rating', 4);
        setFeaturedProducts(featured);
        
        // Get new arrivals
        const arrivals = await getProducts(null, 'createdAt', 8);
        setNewArrivals(arrivals);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const categories = [
    {
      id: 1,
      name: 'Electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 2,
      name: 'Clothing',
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 3,
      name: 'Home & Kitchen',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    },
    {
      id: 4,
      name: 'Beauty',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    }
  ];
  
  const banners = [
    {
      id: 1,
      title: 'Summer Sale',
      description: 'Up to 50% off on summer essentials',
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      buttonText: 'Shop Now',
      link: '/products?category=summer'
    },
    {
      id: 2,
      title: 'New Electronics',
      description: 'Check out our latest tech gadgets',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80',
      buttonText: 'Discover',
      link: '/products?category=electronics'
    },
    {
      id: 3,
      title: 'Home Essentials',
      description: 'Make your home beautiful with our collection',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80',
      buttonText: 'Explore',
      link: '/products?category=home'
    }
  ];
  
  const features = [
    {
      id: 1,
      title: 'Free Shipping',
      description: 'On orders over $50',
      icon: <LocalShippingIcon fontSize="large" />
    },
    {
      id: 2,
      title: 'Secure Payments',
      description: '100% secure checkout',
      icon: <SecurityIcon fontSize="large" />
    },
    {
      id: 3,
      title: 'Easy Returns',
      description: '30 days return policy',
      icon: <CreditCardIcon fontSize="large" />
    },
    {
      id: 4,
      title: '24/7 Support',
      description: 'Dedicated support team',
      icon: <SupportIcon fontSize="large" />
    }
  ];
  
  const bannerItems = banners.map(banner => (
    <Box
      key={banner.id}
      sx={{
        position: 'relative',
        height: { xs: '50vh', sm: '60vh', md: '70vh' },
        maxHeight: 700,
        width: '100%',
        overflow: 'hidden',
        borderRadius: 4,
      }}
    >
      <Box
        component="img"
        src={banner.image}
        alt={banner.title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.85)',
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: { xs: 3, sm: 5, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: { xs: '100%', sm: '80%', md: '50%' } }}>
          <Typography 
            variant="h2" 
            component="h1" 
            color="white" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              mb: 2
            }}
          >
            {banner.title}
          </Typography>
          
          <Typography 
            variant="h6" 
            color="white" 
            sx={{ 
              mb: 4,
              maxWidth: '80%',
              textShadow: '0 2px 5px rgba(0,0,0,0.3)',
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.25rem' },
            }}
          >
            {banner.description}
          </Typography>
          
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(banner.link)}
            sx={{
              background: theme.palette.gradients.primary,
              px: { xs: 3, md: 4 },
              py: { xs: 1, md: 1.5 },
              boxShadow: '0 4px 14px rgba(0, 188, 212, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(0, 188, 212, 0.6)',
              }
            }}
          >
            {banner.buttonText}
          </Button>
        </Box>
      </Box>
    </Box>
  ));
  
  return (
    <TranslationWrapper>
      <Box sx={{ width: '100%', overflowX: 'hidden' }}>
        {/* Hero Banner Carousel */}
        <Box sx={{ mb: { xs: 4, md: 8 } }}>
          <SimpleCarousel items={bannerItems} />
        </Box>
        
        {/* Features Section */}
        <Container maxWidth="xl" sx={{ mb: { xs: 4, md: 8 } }}>
          <Grid container spacing={3}>
            {features.map(feature => (
              <Grid item xs={6} md={3} key={feature.id}>
                <Paper
                  elevation={0}
                  sx={{
                    ...glassmorphism(0.7, 5, isDark),
                    p: { xs: 2, md: 3 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 4,
                    ...cardHoverEffect,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 50, md: 60 },
                      height: { xs: 50, md: 60 },
                      borderRadius: '50%',
                      mb: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
                      color: 'white',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', md: '0.875rem' }
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
        
        {/* Categories Section */}
        <Container maxWidth="xl" sx={{ mb: { xs: 4, md: 8 } }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                background: theme.palette.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                mb: 1
              }}
            >
              Shop by Category
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                maxWidth: 700,
                mx: 'auto',
                mb: 3,
                px: 2
              }}
            >
              Explore our wide range of products across different categories
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {categories.map(category => (
              <Grid item xs={6} md={3} key={category.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    ...cardHoverEffect,
                    position: 'relative',
                  }}
                  onClick={() => navigate(`/products?category=${category.name.toLowerCase()}`)}
                >
                  <CardMedia
                    component="img"
                    image={category.image}
                    alt={category.name}
                    sx={{ 
                      height: { xs: 140, sm: 180, md: 220 },
                      transition: 'transform 0.5s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      component="h3" 
                      color="white"
                      sx={{ 
                        fontWeight: 600,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        fontSize: { xs: '1rem', md: '1.25rem' }
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
        
        {/* Featured Products Section */}
        <Container maxWidth="xl" sx={{ mb: { xs: 4, md: 8 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  background: theme.palette.gradients.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  mb: 1
                }}
              >
                Featured Products
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Our most popular products based on sales
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/products')}
              sx={{
                mt: { xs: 2, sm: 0 },
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              View All
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {featuredProducts.map(product => (
                <Grid item xs={6} sm={6} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
        
        {/* New Arrivals Section */}
        <Container maxWidth="xl" sx={{ mb: { xs: 4, md: 8 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  background: theme.palette.gradients.secondary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  mb: 1
                }}
              >
                New Arrivals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check out our latest products
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/products?sort=newest')}
              sx={{
                mt: { xs: 2, sm: 0 },
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              View All
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {newArrivals.slice(0, isMobile ? 4 : 8).map(product => (
                <Grid item xs={6} sm={6} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
        
        {/* Call to Action */}
        <Box 
          sx={{ 
            position: 'relative',
            py: { xs: 6, md: 10 },
            mb: { xs: 4, md: 8 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.secondary.main, 0.9)})`,
              zIndex: -1,
            }}
          />
          
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={7} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography 
                  variant="h3" 
                  component="h2" 
                  color="white" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                    mb: 2,
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}
                >
                  Ready to Start Selling on Azone?
                </Typography>
                
                <Typography 
                  variant="h6" 
                  color="white" 
                  sx={{ 
                    mb: 4,
                    opacity: 0.9,
                    maxWidth: { md: '80%' },
                    fontSize: { xs: '1rem', md: '1.25rem' },
                  }}
                >
                  Join thousands of sellers and reach millions of customers worldwide. Start your seller journey today!
                </Typography>
                
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  endIcon={<StoreIcon />}
                  onClick={() => navigate('/seller/register')}
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'white',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    }
                  }}
                >
                  Become a Seller
                </Button>
              </Grid>
              
              <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box
                  sx={{
                    position: 'relative',
                    height: 400,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                      animation: 'pulse 3s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'scale(1)',
                          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        },
                        '50%': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                        },
                        '100%': {
                          transform: 'scale(1)',
                          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 100, color: 'white' }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </TranslationWrapper>
  );
};

export default HomePage;
