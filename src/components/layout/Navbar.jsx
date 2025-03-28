import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { logoutUser } from '../../firebase/services';

const Navbar = () => {
  const { currentUser, userDetails, isSeller, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>
        Profile
      </MenuItem>
      <MenuItem component={RouterLink} to="/orders" onClick={handleMenuClose}>
        My Orders
      </MenuItem>
      {isSeller && (
        <MenuItem component={RouterLink} to="/seller/dashboard" onClick={handleMenuClose}>
          Seller Dashboard
        </MenuItem>
      )}
      {isAdmin && (
        <MenuItem component={RouterLink} to="/admin" onClick={handleMenuClose}>
          Admin Dashboard
        </MenuItem>
      )}
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        AZONE
      </Typography>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/" sx={{ textAlign: 'center' }}>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/products" sx={{ textAlign: 'center' }}>
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/cart" sx={{ textAlign: 'center' }}>
            <ListItemText primary="Cart" />
          </ListItemButton>
        </ListItem>
        {!currentUser ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/login" sx={{ textAlign: 'center' }}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/register" sx={{ textAlign: 'center' }}>
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/profile" sx={{ textAlign: 'center' }}>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/orders" sx={{ textAlign: 'center' }}>
                <ListItemText primary="My Orders" />
              </ListItemButton>
            </ListItem>
            {isSeller && (
              <ListItem disablePadding>
                <ListItemButton component={RouterLink} to="/seller/dashboard" sx={{ textAlign: 'center' }}>
                  <ListItemText primary="Seller Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton component={RouterLink} to="/admin" sx={{ textAlign: 'center' }}>
                  <ListItemText primary="Admin Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ textAlign: 'center' }}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', sm: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              AZONE
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
              <Button
                component={RouterLink}
                to="/products"
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Products
              </Button>
              
              {isSeller && (
                <Button
                  component={RouterLink}
                  to="/seller/dashboard"
                  sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
                >
                  <StoreIcon sx={{ mr: 0.5 }} />
                  Seller Dashboard
                </Button>
              )}
            </Box>

            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ display: 'flex' }}>
              <IconButton 
                size="large" 
                color="inherit"
                component={RouterLink}
                to="/search"
              >
                <SearchIcon />
              </IconButton>
              
              <IconButton 
                size="large" 
                color="inherit"
                component={RouterLink}
                to="/wishlist"
              >
                <FavoriteIcon />
              </IconButton>
              
              <IconButton
                size="large"
                color="inherit"
                component={RouterLink}
                to="/cart"
              >
                <Badge badgeContent={itemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              
              {currentUser ? (
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  {currentUser.photoURL ? (
                    <Avatar 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <PersonIcon />
                  )}
                </IconButton>
              ) : (
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/login"
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
      
      {renderMenu}
    </>
  );
};

export default Navbar;
