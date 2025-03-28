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
  IconButton
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  CreditCard as CreditCardIcon,
  Support as SupportIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import ProductCard from '../products/ProductCard';
import { getProducts } from '../../firebase/services';

// Simple Carousel Component
const SimpleCarousel = ({ items, autoPlay = true, interval = 6000 }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
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
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
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
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.5)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' },
          zIndex: 1
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>
      
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(255, 255, 255, 0.5)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.8)' },
          zIndex: 1
        }}
      >
        <ArrowForwardIosIcon />
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
              width: 12,
              height: 12,
              borderRadius: '50%',
              mx: 0.5,
              bgcolor: index === activeIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer'
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
  
  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category}`);
  };
  
  const handleViewAllProducts = () => {
    navigate('/products');
  };
  
  const bannerItems = banners.map((banner) => (
    <Box
      key={banner.id}
      sx={{
        position: 'relative',
        height: { xs: '50vh', md: '70vh' },
        overflow: 'hidden'
      }}
    >
      <Box
        component="img"
        src={banner.image}
        alt={banner.title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container>
          <Box sx={{ maxWidth: { md: '50%' }, color: 'white' }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                fontSize: { xs: '2rem', md: '3.5rem' }
              }}
            >
              {banner.title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ mb: 4, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
            >
              {banner.description}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(banner.link)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {banner.buttonText}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  ));
  
  return (
    <Box>
      {/* Hero Banner Carousel */}
      <SimpleCarousel items={bannerItems} />

      {/* Features */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3 }}>
        <Container>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <LocalShippingIcon sx={{ fontSize: 40, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>Free Shipping</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <SecurityIcon sx={{ fontSize: 40, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>Secure Payment</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <CreditCardIcon sx={{ fontSize: 40, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>Money-Back Guarantee</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, textAlign: { xs: 'center', sm: 'left' } }}>
                <SupportIcon sx={{ fontSize: 40, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>24/7 Support</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: 6 }}>
        {/* Categories */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Shop by Category
          </Typography>
          <Divider sx={{ mb: 4 }} />
          
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item key={category.id} xs={6} md={3}>
                <Card 
                  sx={{ 
                    height: 200, 
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    '&:hover img': {
                      transform: 'scale(1.1)'
                    }
                  }}
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <CardMedia
                    component="img"
                    image={category.image}
                    alt={category.name}
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.3s ease-in-out'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      p: 2
                    }}
                  >
                    <Typography variant="h6" component="div">
                      {category.name}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Featured Products */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2">
              Featured Products
            </Typography>
            <Button 
              endIcon={<ArrowForwardIcon />}
              onClick={handleViewAllProducts}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {featuredProducts.map((product) => (
                <Grid item key={product.id} xs={12} sm={6} md={3}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Promotional Banner */}
        <Paper
          sx={{
            p: 0,
            mb: 6,
            overflow: 'hidden',
            position: 'relative',
            height: { xs: 300, md: 400 }
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            alt="Special Offer"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: { xs: '100%', md: '50%' },
              height: '100%',
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 4
            }}
          >
            <Chip label="Limited Time Offer" color="error" sx={{ alignSelf: 'flex-start', mb: 2 }} />
            <Typography
              variant="h3"
              component="div"
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              20% OFF
            </Typography>
            <Typography
              variant="h5"
              sx={{ mb: 3 }}
            >
              On your first purchase
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 3 }}
            >
              Use code: WELCOME20
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleViewAllProducts}
              sx={{ alignSelf: 'flex-start' }}
            >
              Shop Now
            </Button>
          </Box>
        </Paper>

        {/* New Arrivals */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2">
              New Arrivals
            </Typography>
            <Button 
              endIcon={<ArrowForwardIcon />}
              onClick={handleViewAllProducts}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 4 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {newArrivals.map((product) => (
                <Grid item key={product.id} xs={12} sm={6} md={3}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
