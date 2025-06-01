import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCart, updateCart } from '../firebase/services';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  // Load cart from Firebase when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const userCart = await getCart(currentUser.uid);
          setCart(userCart);
        } catch (error) {
          console.error("Error loading cart:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // If user is logged out, load cart from localStorage
        const savedCart = localStorage.getItem('DireMart-cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        } else {
          setCart({ items: [], total: 0 });
        }
        setLoading(false);
      }
    };

    loadCart();
  }, [currentUser]);

  // Save cart to localStorage when it changes (for non-logged in users)
  useEffect(() => {
    if (!loading && !currentUser) {
      localStorage.setItem('DireMart-cart', JSON.stringify(cart));
    }
  }, [cart, loading, currentUser]);

  const addToCart = async (product, quantity = 1) => {
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
    let newItems = [...cart.items];
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already in cart
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Add new item to cart
      newItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        sellerId: product.sellerId,
        quantity
      });
    }

    // Calculate new total
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newCart = { items: newItems, total: newTotal };
    
    // Update state
    setCart(newCart);
    
    // Update in Firebase if user is logged in
    if (currentUser) {
      try {
        await updateCart(currentUser.uid, newItems);
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    
    const existingItemIndex = cart.items.findIndex(item => item.id === productId);
    if (existingItemIndex >= 0) {
      let newItems = [...cart.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity
      };
      
      // Calculate new total
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newCart = { items: newItems, total: newTotal };
      
      // Update state
      setCart(newCart);
      
      // Update in Firebase if user is logged in
      if (currentUser) {
        try {
          await updateCart(currentUser.uid, newItems);
        } catch (error) {
          console.error("Error updating cart:", error);
        }
      }
    }
  };

  const removeFromCart = async (productId) => {
    const newItems = cart.items.filter(item => item.id !== productId);
    
    // Calculate new total
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newCart = { items: newItems, total: newTotal };
    
    // Update state
    setCart(newCart);
    
    // Update in Firebase if user is logged in
    if (currentUser) {
      try {
        await updateCart(currentUser.uid, newItems);
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    }
  };

  const clearCart = async () => {
    const emptyCart = { items: [], total: 0 };
    
    // Update state
    setCart(emptyCart);
    
    // Update in Firebase if user is logged in
    if (currentUser) {
      try {
        await updateCart(currentUser.uid, []);
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount: cart.items.reduce((count, item) => count + item.quantity, 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
