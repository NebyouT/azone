import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { getProducts } from '../../firebase/services';
import ProductCard from '../products/ProductCard';
import { useLanguage } from '../../contexts/LanguageContext';

const SearchPage = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Get search query from URL
  const searchParams = new URLSearchParams(location.search);
  const queryParam = searchParams.get('q') || '';
  
  // State
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const allProducts = await getProducts(null, 'createdAt', 100);
        setProducts(allProducts);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(allProducts.map(product => product.category))];
        setCategories(uniqueCategories);
        
        // Find min and max price
        if (allProducts.length > 0) {
          const prices = allProducts.map(product => product.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange([minPrice, maxPrice]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter and sort products when search query or filters change
  useEffect(() => {
    if (products.length === 0) return;
    
    // Filter by search query
    let results = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = products.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0) {
      results = results.filter(product => selectedCategories.includes(product.category));
    }
    
    // Filter by price range
    results = results.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Sort results
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      // For relevance, we keep the order as is (already sorted by search match)
      default:
        break;
    }
    
    setFilteredProducts(results);
  }, [searchQuery, products, selectedCategories, priceRange, sortBy]);
  
  // Update URL when search query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    navigate({
      pathname: '/search',
      search: params.toString()
    }, { replace: true });
  }, [searchQuery, navigate]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The search is already handled by the useEffect that updates filteredProducts
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };
  
  // Handle price range change
  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };
  
  // Handle category selection
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([Math.min(...products.map(p => p.price)), Math.max(...products.map(p => p.price))]);
    setSortBy('relevance');
  };
  
  // Format price for display
  const formatPrice = (value) => {
    return `${value} ETB`;
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 0,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('searchProducts')}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
        </form>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2">
            {filteredProducts.length} {t('resultsFound')}
          </Typography>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label">{t('sortBy')}</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              onChange={handleSortChange}
              label={t('sortBy')}
            >
              <MenuItem value="relevance">{t('relevance')}</MenuItem>
              <MenuItem value="price-low">{t('priceLowToHigh')}</MenuItem>
              <MenuItem value="price-high">{t('priceHighToLow')}</MenuItem>
              <MenuItem value="newest">{t('newest')}</MenuItem>
              <MenuItem value="rating">{t('topRated')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 0,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon sx={{ mr: 1 }} />
                {t('filters')}
              </Typography>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={handleClearFilters}
              >
                {t('clearAll')}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              {t('categories')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryToggle(category)}
                  color={selectedCategories.includes(category) ? "primary" : "default"}
                  variant={selectedCategories.includes(category) ? "filled" : "outlined"}
                  sx={{ borderRadius: 0 }}
                />
              ))}
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              {t('priceRange')}
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPrice}
                min={Math.min(...products.map(p => p.price) || [0])}
                max={Math.max(...products.map(p => p.price) || [10000])}
                sx={{ 
                  '& .MuiSlider-valueLabel': {
                    bgcolor: theme.palette.primary.main,
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">{formatPrice(priceRange[0])}</Typography>
                <Typography variant="body2">{formatPrice(priceRange[1])}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Product Grid */}
        <Grid item xs={12} md={9}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : filteredProducts.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="h6" gutterBottom>
                {t('noProductsFound')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('tryDifferentSearch')}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.map(product => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default SearchPage;
