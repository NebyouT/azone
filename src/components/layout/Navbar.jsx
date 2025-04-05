import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Badge,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  alpha,
  Paper,
  InputBase,
  styled,
  FormControl,
  Select,
  Switch,
  Popover,
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
  Close as CloseIcon,
  Language as LanguageIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Category as CategoryIcon,
  Home as HomeIcon,
  Translate as TranslateIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { logoutUser } from '../../firebase/services';
import { useColorMode } from '../../theme/ThemeProvider';
import { glassmorphism } from '../../theme/futuristicTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationIcon from '../notifications/NotificationIcon';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: '100%',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.text.primary, 0.6),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
}));

// Top Bar styled component
const TopBar = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#000', 0.6) : alpha('#f5f5f5', 0.8),
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(0.5, 0),
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
}));

// Category Menu styled component
const CategoryMenu = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 1000,
  width: 220,
  maxHeight: 400,
  overflow: 'auto',
  marginTop: theme.spacing(1),
  boxShadow: theme.shadows[5],
  borderRadius: 0,
  ...glassmorphism(0.95, 5, theme.palette.mode === 'dark'),
}));

// Material UI Switch for dark/light mode
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
    borderRadius: 0,
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller, isAdmin } = useAuth();
  const cart = useCart();
  const itemCount = cart?.itemCount || 0;
  const { mode, toggleColorMode } = useColorMode();
  const { language, changeLanguage, t } = useLanguage();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [languageMenuAnchorEl, setLanguageMenuAnchorEl] = useState(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSubmit(event);
    }
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

  const handleCategoryMenuToggle = () => {
    setCategoryMenuOpen(!categoryMenuOpen);
  };

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenuAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    handleLanguageMenuClose();
    setMobileOpen(false); // Close mobile menu when language is changed
  };

  const isMenuOpen = Boolean(anchorEl);
  const isLanguageMenuOpen = Boolean(languageMenuAnchorEl);

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
          mt: 1.5,
          overflow: 'visible',
          borderRadius: 0,
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => handleNavigate('/profile')}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        {t('profile')}
      </MenuItem>
      <MenuItem onClick={() => handleNavigate('/orders')}>
        <ListItemIcon>
          <OrdersIcon fontSize="small" />
        </ListItemIcon>
        {t('orders')}
      </MenuItem>
      <MenuItem onClick={() => handleNavigate('/wallet')}>
        <ListItemIcon>
          <WalletIcon fontSize="small" />
        </ListItemIcon>
        {t('wallet')}
      </MenuItem>
      {isSeller && (
        <MenuItem onClick={() => handleNavigate('/seller/dashboard')}>
          <ListItemIcon>
            <StoreIcon fontSize="small" />
          </ListItemIcon>
          {t('sellerDashboard')}
        </MenuItem>
      )}
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        {t('logout')}
      </MenuItem>
    </Menu>
  );

  const languageMenu = (
    <Menu
      anchorEl={languageMenuAnchorEl}
      id="language-menu"
      keepMounted
      open={isLanguageMenuOpen}
      onClose={handleLanguageMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          mt: 1.5,
          overflow: 'visible',
          borderRadius: 0,
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => handleLanguageChange('en')} selected={language === 'en'}>
        <ListItemIcon>
          <CheckCircleIcon fontSize="small" sx={{ visibility: language === 'en' ? 'visible' : 'hidden' }} />
        </ListItemIcon>
        English
      </MenuItem>
      <MenuItem onClick={() => handleLanguageChange('am')} selected={language === 'am'}>
        <ListItemIcon>
          <CheckCircleIcon fontSize="small" sx={{ visibility: language === 'am' ? 'visible' : 'hidden' }} />
        </ListItemIcon>
        አማርኛ
      </MenuItem>
    </Menu>
  );

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
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
        >
          Azone
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 1 }}>
        <Search sx={{ backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.15) : 'white', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.25) : 'white' } }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder={t('search')}
            inputProps={{ 'aria-label': 'search' }}
            fullWidth
          />
        </Search>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/"
            sx={{
              textAlign: 'center',
              borderRadius: 0,
              my: 0.5,
              mx: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary={t('home')} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/products"
            sx={{
              textAlign: 'center',
              borderRadius: 0,
              my: 0.5,
              mx: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ListItemIcon>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary={t('products')} />
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
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={t('login')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/register"
                sx={{
                  textAlign: 'center',
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={t('register')} />
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
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={t('profile')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/orders"
                sx={{
                  textAlign: 'center',
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemIcon>
                  <OrdersIcon />
                </ListItemIcon>
                <ListItemText primary={t('orders')} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/wallet"
                sx={{
                  textAlign: 'center',
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ListItemIcon>
                  <WalletIcon />
                </ListItemIcon>
                <ListItemText primary={t('wallet')} />
              </ListItemButton>
            </ListItem>
            {isSeller && (
              <ListItem disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to="/seller/dashboard"
                  sx={{
                    textAlign: 'center',
                    borderRadius: 0,
                    my: 0.5,
                    mx: 1,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListItemIcon>
                    <StoreIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('sellerDashboard')} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  textAlign: 'center',
                  borderRadius: 0,
                  my: 0.5,
                  mx: 1,
                }}
              >
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('logout')} />
              </ListItemButton>
            </ListItem>
          </>
        )}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLanguageMenuOpen}
            sx={{
              textAlign: 'center',
              borderRadius: 0,
              my: 0.5,
              mx: 1,
            }}
          >
            <ListItemIcon>
              <TranslateIcon />
            </ListItemIcon>
            <ListItemText primary={t('language')} />
          </ListItemButton>
        </ListItem>
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
      {/* Top Bar - Similar to AliExpress */}
      <TopBar>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 1, sm: 2 } }}>
            {/* Left side links */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              {isSeller ? (
                <Button
                  component={RouterLink}
                  to="/seller/dashboard"
                  size="small"
                  color="inherit"
                  sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                  startIcon={<StoreIcon fontSize="small" />}
                >
                  {t('sellerDashboard')}
                </Button>
              ) : (
                <Button
                  component={RouterLink}
                  to="/profile"
                  size="small"
                  color="inherit"
                  sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                >
                  {t('becomeSeller')}
                </Button>
              )}
            </Box>

            {/* Right side links */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              {!currentUser ? (
                <>
                  <Button
                    component={RouterLink}
                    to="/login"
                    size="small"
                    color="inherit"
                    sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                  >
                    {t('login')}
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/register"
                    size="small"
                    color="inherit"
                    sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                  >
                    {t('register')}
                  </Button>
                </>
              ) : (
                <Button
                  component={RouterLink}
                  to="/orders"
                  size="small"
                  color="inherit"
                  sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                  startIcon={<OrdersIcon fontSize="small" />}
                >
                  {t('orders')}
                </Button>
              )}

              <Button
                size="small"
                color="inherit"
                sx={{ fontSize: '0.75rem', borderRadius: 0 }}
                startIcon={<TranslateIcon fontSize="small" />}
                onClick={handleLanguageMenuOpen}
                endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              >
                {language === 'en' ? 'English' : 'አማርኛ'}
              </Button>
            </Box>
          </Box>
        </Container>
      </TopBar>

      {/* Main Navbar */}
      <AppBar
        position="sticky"
        sx={{
          ...glassmorphism(0.7, 10, mode === 'dark'),
          borderRadius: 0,
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#FF4747', // AliExpress red color
          position: { xs: 'fixed', md: 'sticky' }, // Fixed position for mobile, sticky for desktop
          top: 0,
          zIndex: 1100,
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
                color: 'white',
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
                color: 'white',
                textDecoration: 'none',
              }}
            >
              Azone
            </Typography>

            {/* Categories Button (Desktop) */}
            <Box
              sx={{
                position: 'relative',
                display: { xs: 'none', md: 'block' },
                mr: 2,
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                startIcon={<CategoryIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleCategoryMenuToggle}
                sx={{
                  borderRadius: 0,
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.2) : alpha('#fff', 0.2),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.3) : alpha('#fff', 0.3),
                  },
                }}
              >
                {t('categories')}
              </Button>

              {categoryMenuOpen && (
                <CategoryMenu
                  elevation={3}
                  sx={{
                    borderRadius: 0,
                  }}
                >
                  <List>
                    <ListItem button>
                      <ListItemText primary="Electronics" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Clothing" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Home & Kitchen" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Beauty" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Sports" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Toys" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Books" />
                    </ListItem>
                    <ListItem button>
                      <ListItemText primary="Automotive" />
                    </ListItem>
                  </List>
                </CategoryMenu>
              )}
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Button
                component={RouterLink}
                to="/"
                sx={{
                  my: 2,
                  color: 'white',
                  display: 'block',
                  mx: 1,
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.1),
                  },
                  borderRadius: 0,
                }}
              >
                {t('home')}
              </Button>

              <Button
                component={RouterLink}
                to="/products"
                sx={{
                  my: 2,
                  color: 'white',
                  display: 'block',
                  mx: 1,
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.1),
                  },
                  borderRadius: 0,
                }}
              >
                {t('products')}
              </Button>
            </Box>

            {/* Desktop Search */}
            {!isMobile && (
              <Box 
                component="form" 
                onSubmit={handleSearchSubmit}
                sx={{ 
                  flexGrow: { sm: 1, md: 0 },
                  mx: { sm: 2 }
                }}
              >
                <Search sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.15) : 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.25) : 'white',
                  },
                  borderRadius: 0,
                }}>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder={t('search')}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                  />
                </Search>
              </Box>
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

            {/* Mobile Search Bar */}
            {isMobile && searchOpen && (
              <Box 
                component="form" 
                onSubmit={handleSearchSubmit}
                sx={{ 
                  display: 'flex', 
                  flexGrow: 1,
                  alignItems: 'center',
                  ml: 'auto'
                }}
              >
                <Search sx={{
                  flexGrow: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.15) : 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.25) : 'white',
                  },
                  borderRadius: 0,
                }}>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder={t('search')}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    autoFocus
                  />
                </Search>
                <IconButton 
                  color="inherit" 
                  onClick={toggleSearch}
                  edge="end"
                  sx={{ borderRadius: 0 }}
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
                {/* Notification Icon */}
                {currentUser && (
                  <NotificationIcon />
                )}
                
                {/* Wallet Icon */}
                {currentUser && (
                  <IconButton
                    component={RouterLink}
                    to="/wallet"
                    size="large"
                    aria-label="show wallet"
                    color="inherit"
                    sx={{
                      ml: 1,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.1)' },
                    }}
                  >
                    <WalletIcon />
                  </IconButton>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        container={window.document.body}
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
            width: 280,
            borderRadius: 0, // No border radius as requested
            background: mode === 'dark' ? 'rgba(33, 33, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: mode === 'dark' ? '#fff' : '#333',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          },
        }}
      >
        {drawer}
      </Drawer>

      {renderMenu}
      {languageMenu}
    </>
  );
};

export default Navbar;
