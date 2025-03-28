import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './components/home/HomePage';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import Cart from './components/cart/Cart';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Checkout from './components/checkout/Checkout';
import Profile from './components/profile/Profile';
import Orders from './components/orders/Orders';

// Seller Components
import SellerDashboard from './components/seller/SellerDashboard';
import ProductForm from './components/seller/ProductForm';
import WalletPage from './components/wallet/WalletPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Poppins',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userDetails, loading } = useAuth();
  
  if (loading) {
    return null; // Or a loading spinner
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && userDetails?.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route 
                  path="checkout" 
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="orders" 
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Seller Routes */}
                <Route 
                  path="seller/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="seller/products/add" 
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <ProductForm />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="seller/products/:productId/edit" 
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <ProductForm />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Wallet Route */}
                <Route 
                  path="wallet" 
                  element={
                    <ProtectedRoute>
                      <WalletPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Add more routes as needed */}
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
