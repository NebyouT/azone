import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  Tab,
  Tabs,
  styled,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  CreditCard as CreditCardIcon,
  Support as SupportIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  People as PeopleIcon,
  ShoppingBag as ShoppingBagIcon,
  Storefront as StorefrontIcon,
  Star as StarIcon,
  Store as StoreIcon,
  FlashOn as FlashOnIcon,
  Phone as PhoneIcon,
  Tv as TvIcon,
  Laptop as LaptopIcon,
  Kitchen as KitchenIcon,
  Checkroom as FashionIcon,
  Chair as FurnitureIcon,
  SportsEsports as ToysIcon,
  LocalOffer as OffersIcon,
  Timer as TimerIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { getProducts } from '../../firebase/services';
import { useColorMode } from '../../theme/ThemeProvider';
import { useLanguage } from '../../contexts/LanguageContext';
import TranslationWrapper from '../common/TranslationWrapper';
import { glassmorphism, cardHoverEffect } from '../../theme/futuristicTheme';

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
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden', 
      borderRadius: 0,
      width: '100%',
    }}>
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
          left: { xs: 0, md: 0 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
          zIndex: 1,
          width: { xs: 40, md: 60 },
          height: { xs: 60, md: 100 },
          borderRadius: 0,
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '4px',
        }}
      >
        <ArrowBackIosIcon fontSize={isMobile ? 'small' : 'medium'} />
      </IconButton>
      
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: { xs: 0, md: 0 },
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
          zIndex: 1,
          width: { xs: 40, md: 60 },
          height: { xs: 60, md: 100 },
          borderRadius: 0,
          borderTopLeftRadius: '4px',
          borderBottomLeftRadius: '4px',
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
              width: { xs: 24, md: 32 },
              height: { xs: 4, md: 5 },
              borderRadius: 0,
              mx: 0.5,
              bgcolor: index === activeIndex ? 'primary.main' : alpha(theme.palette.background.paper, 0.7),
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scaleY(1.5)',
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// Flipkart style components
const CategoryIconButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 8px',
  minWidth: 'auto',
  width: '100%',
  backgroundColor: 'transparent',
  borderRadius: 0,
  textTransform: 'none',
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '22px',
  fontWeight: 500,
  padding: '15px 20px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ViewAllButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#2874f0' : '#2874f0',
  color: 'white',
  textTransform: 'none',
  boxShadow: 'none',
  padding: '5px 20px',
  borderRadius: 2,
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#1a5cbf',
    boxShadow: 'none',
  },
}));

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [electronicsProducts, setElectronicsProducts] = useState([]);
  const [fashionProducts, setFashionProducts] = useState([]);
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
        // Get featured/top-rated products
        const featured = await getProducts(null, 'rating', 8);
        setFeaturedProducts(featured);
        
        // Get new arrivals (sorted by creation date)
        const arrivals = await getProducts(null, 'createdAt', 8);
        setNewArrivals(arrivals);
        
        // Get electronics products
        const electronics = await getProducts('electronics', 'createdAt', 6);
        setElectronicsProducts(electronics);
        
        // Get fashion products
        const fashion = await getProducts('clothing', 'createdAt', 6);
        setFashionProducts(fashion);
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
        height: { xs: 'auto', sm: '380px', md: '400px' },
        width: '100%',
        overflow: 'hidden',
        borderRadius: 0,
        bgcolor: '#f5f5f5',
      }}
    >
      {/* AliExpress-style banner with red/orange color scheme */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #ff4747 0%, #ff6a00 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left content side */}
        <Box
          sx={{
            width: { xs: '100%', md: '55%' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: { xs: 3, sm: 4, md: 5 },
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Discount badge */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, md: 20 },
              left: { xs: 10, md: 20 },
              backgroundColor: '#ffeb3b',
              color: '#d32f2f',
              padding: '4px 12px',
              borderRadius: '0',
              transform: 'rotate(-5deg)',
              fontWeight: 'bold',
              border: '1px dashed #d32f2f',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
              fontSize: { xs: '1rem', md: '1.4rem' },
              zIndex: 3,
            }}
          >
            UP TO {banner.title === 'Summer Sale' ? '50% OFF' : '40% OFF'}
          </Box>

          <Box
            sx={{
              mb: { xs: 2, md: 3 },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              color="#fff"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                lineHeight: 1.1,
                textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
              }}
            >
              {banner.title.toUpperCase()}
            </Typography>
            
            <Typography
              variant="h6"
              color="#fff"
              sx={{
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                fontWeight: 400,
                textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
              }}
            >
              {banner.description}
            </Typography>

            {/* Timer component - common on AliExpress */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 3,
                mt: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ENDS IN:
              </Typography>
              {['12', '45', '22'].map((num, i) => (
                <Box
                  key={i}
                  sx={{
                    bgcolor: '#fff',
                    color: '#ff4747',
                    px: 1,
                    py: 0.5,
                    fontWeight: 'bold',
                    border: '1px solid rgba(0,0,0,0.1)',
                    minWidth: '28px',
                    textAlign: 'center',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.05)',
                  }}
                >
                  {num}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Multiple CTA buttons - AliExpress style */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate(banner.link)}
              sx={{
                bgcolor: '#fff',
                color: '#e62e04',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                borderRadius: 0,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.1)',
                },
              }}
            >
              {banner.buttonText}
            </Button>
            
            <Button
              variant="outlined"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                borderColor: '#fff',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 0,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderColor: '#fff',
                },
              }}
            >
              View Deals
            </Button>
          </Box>

          {/* Promo badges - common on AliExpress */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 3,
              flexWrap: 'wrap',
            }}
          >
            {['Free Shipping', 'Money Back', 'New Arrivals'].map((badge) => (
              <Chip
                key={badge}
                label={badge}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.85)',
                  color: '#d32f2f',
                  fontWeight: 500,
                  borderRadius: 0,
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Right image side */}
        <Box
          sx={{
            width: { xs: '100%', md: '45%' },
            height: { xs: '220px', md: '100%' },
            position: 'relative',
            overflow: 'hidden',
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
              objectPosition: 'center',
              transition: 'transform 0.5s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
          
          {/* Floating product thumbnails - common on AliExpress */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 10, md: 20 },
              right: { xs: 10, md: 20 },
              display: 'flex',
              gap: 1,
            }}
          >
            {[1, 2, 3].map((num) => (
              <Box
                key={num}
                sx={{
                  width: { xs: 40, md: 50 },
                  height: { xs: 40, md: 50 },
                  bgcolor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: '1px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s ease',
                }}
              >
                <Box
                  component="img"
                  src={`https://source.unsplash.com/random/50x50?product=${num}`}
                  alt="Product thumbnail"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Decorative elements - common on AliExpress */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 1,
            display: { xs: 'none', md: 'block' },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 1,
            display: { xs: 'none', md: 'block' },
          }}
        />
      </Box>
    </Box>
  ));
  
  return (
    <TranslationWrapper>
      <Box sx={{ 
        width: '100%', 
        overflowX: 'hidden',
        ...(isMobile && {
          paddingTop: 0,
          marginTop: 0,
          paddingBottom: '70px' // Add padding to bottom for mobile to account for the bottom navbar
        })
      }}>
        {/* Hero Banner Carousel */}
        <Box 
          className="hero-container"
          sx={{ 
            mb: { xs: 3, md: 6 }, 
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            marginTop: 0, // Remove negative margin which was causing issues
            paddingTop: 0,
            overflow: 'hidden', // Prevent any content from spilling out
            '&::before': {
              content: '""',
              display: 'none', // Disable the spacer completely
              height: 0,
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10
            }
          }}>
          <SimpleCarousel items={bannerItems} />
        </Box>
        
        {/* Features Section */}
        <Box 
          sx={{ 
            mb: { xs: 5, md: 8 },
            px: { xs: 2, md: 3 },
            width: '100%',
            overflowX: 'hidden'
          }}
        >
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: { xs: 1.5, md: 3 },
              mt: { xs: 2, md: 0 } // Add top margin on mobile to create better spacing after hero
            }}
          >
            {features.map(feature => (
              <Box 
                key={feature.id}
                sx={{
                  flex: 1,
                  minWidth: 0, // Important for flex items to shrink below their content size
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    ...glassmorphism(0.7, 5, isDark),
                    p: { xs: 0.5, sm: 1, md: 3 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderRadius: { xs: 1, md: 4 },
                    ...cardHoverEffect,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 24, sm: 30, md: 60 },
                      height: { xs: 24, sm: 30, md: 60 },
                      borderRadius: '50%',
                      mb: { xs: 0.5, md: 2 },
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
                      color: 'white',
                    }}
                  >
                    {React.cloneElement(feature.icon, { 
                      fontSize: isMobile ? 'small' : 'large',
                      style: { fontSize: isMobile ? '14px' : '24px' }
                    })}
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    noWrap
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', sm: '0.75rem', md: '1.25rem' },
                      mb: { xs: 0, md: 1 },
                      width: '100%',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  {!isMobile && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.875rem' },
                      }}
                    >
                      {feature.description}
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>
        
        {/* Categories Section - Hidden on Mobile */}
        {!isMobile && (
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
        )}
        
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
          ) : isMobile ? (
            // Mobile-specific grid with forced 2 columns - matching product page
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
              width: '100%',
              px: 1
            }}>
              {featuredProducts.map((product) => (
                <Box 
                  key={product.id}
                  sx={{
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          ) : (
            // Desktop grid using MUI Grid
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
          ) : isMobile ? (
            // Mobile-specific grid with forced 2 columns - matching product page
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
              width: '100%',
              px: 1
            }}>
              {newArrivals.slice(0, 4).map((product) => (
                <Box 
                  key={product.id}
                  sx={{
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          ) : (
            // Desktop grid using MUI Grid
            <Grid container spacing={3}>
              {newArrivals.slice(0, 8).map(product => (
                <Grid item xs={6} sm={6} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
        
        {/* Call to Action - Seller Recruitment */}
        <Box 
          sx={{ 
            position: 'relative',
            py: { xs: 6, md: 6 },
            mb: { xs: 4, md: 8 },
            backgroundColor: isDark ? '#1E293B' : '#F8F9FA',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' }, order: { xs: 2, md: 1 } }}>
                <Typography 
                  variant="h4" 
                  component="h2" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1.5rem', md: '2.125rem' },
                    color: isDark ? '#FFFFFF' : '#333333',
                    position: 'relative',
                    display: 'inline-block',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      width: '60%',
                      height: '4px',
                      bottom: '-8px',
                      left: 0,
                      backgroundColor: '#ED782A',
                      display: { xs: 'none', md: 'block' }
                    }
                  }}
                >
                  Diremart: Dire Dawa's Local Marketplace
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mb: 3, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: 500 }}>
                  Your premier local shopping destination in Dire Dawa
                </Typography>
                
                <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: { xs: 3, md: 2 }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  {[
                    { text: '2K+ Monthly Customers', icon: 'People' },
                    { text: '250+ Orders Completed', icon: 'ShoppingBag' },
                    { text: '500+ Active Sellers', icon: 'Store' },
                    { text: '100% Secure Payments', icon: 'Security' }
                  ].map((stat, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      p: { xs: 2, md: 3 },
                      width: { xs: 'calc(50% - 20px)', md: 'auto', lg: 'calc(25% - 16px)' },
                      minWidth: { xs: '130px', sm: '160px' },
                      position: 'relative',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.95)',
                      boxShadow: isDark 
                        ? '0 4px 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1)' 
                        : '0 10px 25px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        height: '4px',
                        width: '100%',
                        background: 'linear-gradient(90deg, #ED782A, #ff9d57)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0) 60%, rgba(237,120,42,0.07) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: isDark 
                          ? '0 12px 28px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.15)' 
                          : '0 20px 40px rgba(237,120,42,0.15), 0 2px 10px rgba(0,0,0,0.05)',
                        '&::after': {
                          opacity: 1,
                        },
                        '& .stat-icon': {
                          transform: 'scale(1.15) rotate(5deg)',
                          boxShadow: '0 8px 20px rgba(237,120,42,0.3)',
                        },
                        '& .stat-text': {
                          transform: 'translateY(4px)',
                          color: isDark ? '#fff' : '#333',
                        }
                      }
                    }}>
                      <Box 
                        className="stat-icon"
                        sx={{ 
                          width: { xs: 56, md: 64 }, 
                          height: { xs: 56, md: 64 }, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #ED782A, #ff9d57)',
                          boxShadow: '0 4px 12px rgba(237,120,42,0.2)',
                          borderRadius: '0',
                          mb: 2,
                          transition: 'all 0.4s ease',
                        }}
                      >
                        {stat.icon === 'People' && <PeopleIcon sx={{ fontSize: 32, color: 'white' }} />}
                        {stat.icon === 'ShoppingBag' && <ShoppingBagIcon sx={{ fontSize: 32, color: 'white' }} />}
                        {stat.icon === 'Store' && <StorefrontIcon sx={{ fontSize: 32, color: 'white' }} />}
                        {stat.icon === 'Security' && <SecurityIcon sx={{ fontSize: 32, color: 'white' }} />}
                      </Box>
                      <Typography 
                        className="stat-text"
                        variant="h6" 
                        align="center"
                        sx={{ 
                          fontWeight: 700, 
                          color: isDark ? 'rgba(255,255,255,0.95)' : '#333',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            width: '40%',
                            height: '2px',
                            bottom: '-8px',
                            left: '30%',
                            background: 'linear-gradient(90deg, rgba(237,120,42,0), rgba(237,120,42,0.7), rgba(237,120,42,0))',
                            opacity: 0.7,
                          }
                        }}
                      >
                        {stat.text.split(' ')[0]}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        align="center"
                        sx={{ 
                          mt: 1,
                          fontWeight: 500, 
                          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {stat.text.split(' ').slice(1).join(' ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: { xs: 3, md: 2 }, mt: 4, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<StorefrontIcon />}
                    onClick={() => navigate('/profile')}
                    sx={{
                      backgroundColor: '#ED782A',
                      color: 'white',
                      borderRadius: 0,
                      py: 1.5,
                      px: 4,
                      fontWeight: 600,
                      border: 'none',
                      boxShadow: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: '-100%',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        transition: 'all 0.4s ease',
                      },
                      '&:hover': {
                        backgroundColor: '#D16620',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transform: 'translateY(-2px)',
                        '&::after': {
                          left: '100%'
                        }
                      }
                    }}
                  >
                    Join as Seller
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ShoppingBagIcon />}
                    onClick={() => navigate('/products')}
                    sx={{
                      borderRadius: 0,
                      py: 1.5,
                      px: 4,
                      fontWeight: 600,
                      borderColor: '#ED782A',
                      color: isDark ? 'white' : '#ED782A',
                      '&:hover': {
                        borderColor: '#D16620',
                        backgroundColor: isDark ? 'rgba(237, 120, 42, 0.08)' : 'rgba(237, 120, 42, 0.04)',
                        color: isDark ? 'white' : '#D16620',
                      }
                    }}
                  >
                    Shop Now
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6} sx={{ order: { xs: 1, md: 2 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(237,120,42,0.05)',
                    p: 4,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(237,120,42,0.2)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: isDark ? '#ED782A' : '#333333', mb: 3, fontWeight: 600, textAlign: 'center' }}>
                    Seller Success Metrics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {[
                      { icon: <ShoppingBagIcon sx={{ fontSize: 30 }} />, title: '2M+', subtitle: 'Monthly Customers' },
                      { icon: <StoreIcon sx={{ fontSize: 30 }} />, title: '10K+', subtitle: 'Active Sellers' },
                      { icon: <LocalShippingIcon sx={{ fontSize: 30 }} />, title: '15K+', subtitle: 'Daily Orders' },
                      { icon: <SecurityIcon sx={{ fontSize: 30 }} />, title: '100%', subtitle: 'Secure Payments' }
                    ].map((stat, index) => (
                      <Grid item xs={6} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                          height: '100%',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(237,120,42,0.1)',
                        }}>
                          <Box sx={{ 
                            color: '#ED782A', 
                            mb: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 50
                          }}>
                            {stat.icon}
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {stat.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
                            {stat.subtitle}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
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
