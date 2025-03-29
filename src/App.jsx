import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ThemeProvider from './theme/ThemeProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { WalletProvider } from './contexts/WalletContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './components/home/HomePage';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import Cart from './components/cart/Cart';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Checkout from './components/checkout/Checkout';
import Profile from './components/profile/Profile';
import Orders from './components/orders/Orders';
import OrderDetail from './components/orders/OrderDetail';
import Wallet from './components/wallet/Wallet';

// Seller Components
import SellerDashboard from './components/seller/SellerDashboard';
import ProductForm from './components/seller/ProductForm';
import SellerOrderDetail from './components/seller/SellerOrderDetail';

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

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
            <WalletProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
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
                    <Route 
                      path="orders/:id" 
                      element={
                        <ProtectedRoute>
                          <OrderDetail />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="wallet" 
                      element={
                        <ProtectedRoute>
                          <Wallet />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="seller/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <SellerDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="seller/products/new" 
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <ProductForm />
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
                      path="seller/products/edit/:id" 
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <ProductForm />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="seller/orders/:id" 
                      element={
                        <ProtectedRoute requiredRole="seller">
                          <SellerOrderDetail />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>
                </Routes>
              </Router>
            </WalletProvider>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
