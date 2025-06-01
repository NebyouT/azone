import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';

// Import category icons
import DevicesIcon from '@mui/icons-material/Devices';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import HomeIcon from '@mui/icons-material/Home';
import SpaIcon from '@mui/icons-material/Spa';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ToysIcon from '@mui/icons-material/Toys';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DriveEtaIcon from '@mui/icons-material/DriveEta';

// Style the menu
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 1000,
  width: 280,
  backgroundColor: theme.palette.background.paper,
  marginTop: 0,
  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 200px)',
  borderRadius: 0,
}));

const CategoryMenu = ({ onClose, ...props }) => {
  const navigate = useNavigate();

  // Define categories with their icons
  const categories = [
    { name: 'Electronics', icon: <DevicesIcon />, path: '/products?category=Electronics' },
    { name: 'Clothing', icon: <CheckroomIcon />, path: '/products?category=Clothing' },
    { name: 'Home & Kitchen', icon: <HomeIcon />, path: '/products?category=Home%20%26%20Kitchen' },
    { name: 'Beauty', icon: <SpaIcon />, path: '/products?category=Beauty' },
    { name: 'Sports', icon: <SportsSoccerIcon />, path: '/products?category=Sports' },
    { name: 'Toys', icon: <ToysIcon />, path: '/products?category=Toys' },
    { name: 'Books', icon: <MenuBookIcon />, path: '/products?category=Books' },
    { name: 'Automotive', icon: <DriveEtaIcon />, path: '/products?category=Automotive' },
  ];

  const handleCategoryClick = (path) => {
    if (onClose) onClose();
    navigate(path);
  };

  return (
    <StyledPaper {...props}>
      <List sx={{ p: 0 }}>
        {categories.map((category) => (
          <ListItem key={category.name} disablePadding>
            <ListItemButton
              onClick={() => handleCategoryClick(category.path)}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(237, 120, 42, 0.08)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#ED782A' }}>
                {category.icon}
              </ListItemIcon>
              <ListItemText primary={category.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </StyledPaper>
  );
};

export default CategoryMenu;
