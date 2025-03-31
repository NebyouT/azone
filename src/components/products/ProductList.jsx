import { useState, useEffect } from 'react';
import { 
  Grid, 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import ProductCard from './ProductCard';
import { getProducts } from '../../firebase/services';

const ProductList = ({ category = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts(category, sortBy);
        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, sortBy]);

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container sx={{ pb: { xs: 8, sm: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {category ? `${category} Products` : 'All Products'}
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            label="Search Products"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortBy}
              label="Sort By"
              onChange={handleSortChange}
            >
              <MenuItem value="createdAt">Newest</MenuItem>
              <MenuItem value="price">Price: Low to High</MenuItem>
              <MenuItem value="price:desc">Price: High to Low</MenuItem>
              <MenuItem value="name">Name: A-Z</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {filteredProducts.length === 0 ? (
          <Typography sx={{ textAlign: 'center', my: 4 }}>
            No products found. Try a different search term.
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              {displayedProducts.map((product) => (
                <Grid 
                  item 
                  key={product.id} 
                  xs={6} 
                  sm={6} 
                  md={4} 
                  lg={3}
                  sx={{ display: 'flex' }}
                >
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: { xs: 10, sm: 4 } }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handleChangePage} 
                  color="primary" 
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default ProductList;
