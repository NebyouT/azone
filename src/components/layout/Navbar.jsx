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
  Avatar,
  useTheme,
  alpha,
  InputBase,
  Tooltip,
  Switch,
  styled,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Store as StoreIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ShoppingBag as OrdersIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { logoutUser } from '../../firebase/services';
import { useColorMode } from '../../theme/ThemeProvider';
import { glassmorphism } from '../../theme/futuristicTheme';

// Styled search component
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: 'all 0.3s ease',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

// Material UI switch with custom styling
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

const Navbar = () => {
  const { currentUser, userDetails, isSeller, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
    setMobileOpen(false);
  };
  
  const isMenuOpen = Boolean(anchorEl);
  
  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          ...glassmorphism(0.7, 10, mode === 'dark'),
          mt: 1.5,
          borderRadius: 2,
          minWidth: 180,
          '& .MuiMenuItem-root': {
            px: 2,
            py: 1.5,
            my: 0.5,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {userDetails?.displayName || currentUser?.email}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userDetails?.role || 'User'}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <MenuItem onClick={() => handleNavigate('/profile')}>
        <PersonIcon sx={{ mr: 2 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={() => handleNavigate('/orders')}>
        <OrdersIcon sx={{ mr: 2 }} />
        My Orders
      </MenuItem>
      <MenuItem onClick={() => handleNavigate('/wallet')}>
        <WalletIcon sx={{ mr: 2 }} />
        Wallet
      </MenuItem>
      {isSeller && (
        <MenuItem onClick={() => handleNavigate('/seller/dashboard')}>
          <StoreIcon sx={{ mr: 2 }} />
          Seller Dashboard
        </MenuItem>
      )}
      <Divider sx={{ my: 1 }} />
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 2 }} />
        Logout
      </MenuItem>
    </Menu>
  );
  
  const drawer = (
    <Box 
      onClick={handleDrawerToggle} 
      sx={{ 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            fontWeight: 700,
            background: theme.palette.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Azone
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={handleDrawerToggle}
          aria-label="close drawer"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      <Box sx={{ p: 2, width: '100%' }}>
        <Search sx={{ mb: 2, width: '100%' }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            fullWidth
          />
        </Search>
      </Box>
      
      <List sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
        <ListItem disablePadding>
          <ListItemButton 
            component={RouterLink} 
            to="/products"
            sx={{ 
              textAlign: 'center',
              borderRadius: 1,
              my: 0.5,
              mx: 1
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>
        {!currentUser ? (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/login"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/register"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/profile"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/orders"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Orders" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/wallet"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Wallet" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component={RouterLink} 
                to="/cart"
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemText primary="Cart" />
              </ListItemButton>
            </ListItem>
            {isSeller && (
              <ListItem disablePadding>
                <ListItemButton 
                  component={RouterLink} 
                  to="/seller/dashboard"
                  sx={{ 
                    textAlign: 'center',
                    borderRadius: 1,
                    my: 0.5,
                    mx: 1
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListItemText primary="Seller Dashboard" />
                </ListItemButton>
              </ListItem>
            )}
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                sx={{ 
                  textAlign: 'center',
                  borderRadius: 1,
                  my: 0.5,
                  mx: 1
                }}
              >
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialUISwitch 
          checked={mode === 'dark'} 
          onChange={(e) => {
            e.stopPropagation();
            toggleColorMode();
          }} 
        />
      </Box>
    </Box>
  );
  
  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          ...glassmorphism(0.7, 10, mode === 'dark'),
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="xl" disableGutters={isSmall}>
          <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
            {/* Mobile menu icon */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: { xs: 1, sm: 2 }, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                background: theme.palette.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              Azone
            </Typography>
            
            {/* Mobile Logo */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: { xs: 1, sm: 0 },
                display: { xs: 'flex', md: 'none' },
                fontWeight: 700,
                background: theme.palette.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              Azone
            </Typography>
            
            {/* Desktop Navigation Links */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Button
                component={RouterLink}
                to="/products"
                sx={{ 
                  my: 2, 
                  color: 'text.primary', 
                  display: 'block',
                  mx: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                Products
              </Button>
            </Box>
            
            {/* Desktop Search */}
            {!isMobile && (
              <Search sx={{ flexGrow: { sm: 1, md: 0 }, mx: { sm: 2 } }}>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search…"
                  inputProps={{ 'aria-label': 'search' }}
                />
              </Search>
            )}
            
            {/* Mobile Search Icon */}
            {isMobile && !searchOpen && (
              <IconButton 
                color="inherit" 
                onClick={toggleSearch}
                sx={{ ml: 'auto', mr: 1 }}
              >
                <SearchIcon />
              </IconButton>
            )}
            
            {/* Mobile Search Bar (Expanded) */}
            {isMobile && searchOpen && (
              <Box sx={{ 
                display: 'flex', 
                flexGrow: 1,
                alignItems: 'center',
                ml: 1,
                mr: 1
              }}>
                <Search sx={{ flexGrow: 1 }}>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Search…"
                    inputProps={{ 'aria-label': 'search' }}
                    autoFocus
                  />
                </Search>
                <IconButton 
                  color="inherit" 
                  onClick={toggleSearch}
                  edge="end"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
            
            {/* Theme toggle */}
            {!isSmall && !searchOpen && (
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton onClick={toggleColorMode} color="inherit">
                  {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            {/* Action Icons */}
            {!searchOpen && (
              <Box sx={{ display: 'flex' }}>
                {/* Cart Icon */}
                <IconButton
                  component={RouterLink}
                  to="/cart"
                  size="large"
                  aria-label="show cart items"
                  color="inherit"
                  sx={{ 
                    ml: 1,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                >
                  <Badge badgeContent={itemCount} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
                
                {/* Profile Icon or Login Button */}
                {currentUser ? (
                  <Tooltip title="Account settings">
                    <IconButton
                      size="large"
                      edge="end"
                      aria-label="account of current user"
                      aria-controls={menuId}
                      aria-haspopup="true"
                      onClick={handleProfileMenuOpen}
                      color="inherit"
                      sx={{ 
                        ml: 1,
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.1)' }
                      }}
                    >
                      {userDetails?.photoURL ? (
                        <Avatar 
                          src={userDetails.photoURL} 
                          alt={userDetails.displayName}
                          sx={{ 
                            width: 32, 
                            height: 32,
                            border: `2px solid ${theme.palette.primary.main}`
                          }}
                        />
                      ) : (
                        <PersonIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    sx={{ 
                      ml: { xs: 1, sm: 2 },
                      background: theme.palette.gradients.primary,
                      boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 0.5, sm: 0.75 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Login
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: { xs: '85%', sm: 320 },
            maxWidth: '100%',
            ...glassmorphism(0.9, 10, mode === 'dark'),
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {renderMenu}
    </>
  );
};

export default Navbar;
