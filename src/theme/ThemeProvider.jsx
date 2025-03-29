import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './futuristicTheme';

// Create context for theme mode
const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  mode: 'light'
});

// Hook to use the color mode
export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider = ({ children }) => {
  // Get the user's preferred color scheme
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Check for saved theme preference in localStorage
  const savedMode = localStorage.getItem('themeMode');
  const initialMode = savedMode || (prefersDarkMode ? 'dark' : 'light');
  
  const [mode, setMode] = useState(initialMode);

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Color mode toggle function
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode],
  );

  // Select the theme based on the mode
  const theme = useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ThemeProvider;
