import { Box, useTheme, useMediaQuery, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useColorMode } from '../../theme/ThemeProvider';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const theme = useTheme();
  const { mode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100vw',
        maxWidth: '100%',
        background: theme.palette.background.default,
        backgroundImage: `
          radial-gradient(at 40% 20%, rgba(${isDark ? '237, 120, 42' : '237, 120, 42'}, 0.05) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(${isDark ? '245, 155, 86' : '245, 155, 86'}, 0.05) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(${isDark ? '209, 102, 32' : '209, 102, 32'}, 0.05) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(${isDark ? '237, 120, 42' : '237, 120, 42'}, 0.05) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(${isDark ? '245, 155, 86' : '245, 155, 86'}, 0.05) 0px, transparent 50%)
        `,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        transition: 'background 0.3s ease-in-out',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <CssBaseline />
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          marginTop: { xs: '84px', sm: '96px' }, // Additional space for TopBar (navbar + topbar height)
          padding: {
            xs: '16px',
            sm: '24px',
            md: '32px',
            lg: '40px'
          },
          paddingTop: {
            xs: '80px', 
            sm: '100px',
            md: '100px'  
          },
          paddingBottom: isMobile ? '80px' : undefined, 
          position: 'relative',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, rgba(237,120,42,0.03), transparent)',
            pointerEvents: 'none',
            zIndex: -1,
          },
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
