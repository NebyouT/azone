import { Box, useTheme, useMediaQuery, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useColorMode } from '../../theme/ThemeProvider';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const theme = useTheme();
  const { mode } = useColorMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
          radial-gradient(at 40% 20%, rgba(${isDark ? '0, 188, 212' : '0, 188, 212'}, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(${isDark ? '255, 152, 0' : '255, 152, 0'}, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(${isDark ? '33, 150, 243' : '33, 150, 243'}, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(${isDark ? '0, 188, 212' : '0, 188, 212'}, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(${isDark ? '255, 87, 34' : '255, 87, 34'}, 0.1) 0px, transparent 50%)
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
          padding: {
            xs: '16px',
            sm: '24px',
            md: '32px',
            lg: '40px'
          },
          position: 'relative',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
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
