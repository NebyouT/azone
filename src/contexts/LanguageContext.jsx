import React, { createContext, useContext, useState, useEffect } from 'react';

// English translations
const enTranslations = {
  // Navbar
  home: 'Home',
  products: 'Products',
  categories: 'Categories',
  cart: 'Cart',
  profile: 'Profile',
  orders: 'Orders',
  wallet: 'Wallet',
  login: 'Login',
  register: 'Register',
  logout: 'Logout',
  search: 'Search',
  sellerDashboard: 'Seller Dashboard',
  language: 'Language',
  
  // Homepage
  featuredProducts: 'Featured Products',
  newArrivals: 'New Arrivals',
  viewAll: 'View All',
  shopNow: 'Shop Now',
  discover: 'Discover',
  explore: 'Explore',
  freeShipping: 'Free Shipping',
  onOrdersOver: 'On orders over ETB 50',
  securePayments: 'Secure Payments',
  secureCheckout: '100% secure checkout',
  easyReturns: 'Easy Returns',
  returnPolicy: '30 days return policy',
  support: '24/7 Support',
  dedicatedSupport: 'Dedicated support team',
  
  // Product
  addToCart: 'Add to Cart',
  buyNow: 'Buy Now',
  outOfStock: 'Out of Stock',
  price: 'Price',
  rating: 'Rating',
  reviews: 'Reviews',
  description: 'Description',
  specifications: 'Specifications',
  
  // Cart
  yourCart: 'Your Cart',
  emptyCart: 'Your cart is empty',
  continueShopping: 'Continue Shopping',
  proceedToCheckout: 'Proceed to Checkout',
  total: 'Total',
  remove: 'Remove',
  
  // Auth
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  forgotPassword: 'Forgot Password?',
  dontHaveAccount: 'Don\'t have an account?',
  alreadyHaveAccount: 'Already have an account?',
  signUp: 'Sign Up',
  signIn: 'Sign In',
  
  // Profile
  editProfile: 'Edit Profile',
  save: 'Save',
  cancel: 'Cancel',
  phoneNumber: 'Phone Number',
  accountType: 'Account Type',
  buyer: 'Buyer',
  seller: 'Seller',
  
  // Orders
  myOrders: 'My Orders',
  orderDetails: 'Order Details',
  orderStatus: 'Order Status',
  orderDate: 'Order Date',
  orderTotal: 'Order Total',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  
  // Wallet
  walletBalance: 'Wallet Balance',
  addFunds: 'Add Funds',
  withdraw: 'Withdraw',
  transactions: 'Transactions',
  manageYourFunds: 'Manage your funds and track your transactions',
  recentTransactions: 'Recent Transactions',
  transactionHistory: 'Transaction History',
  noTransactions: 'No transactions yet',
  depositedFunds: 'Deposited Funds',
  withdrewFunds: 'Withdrew Funds',
  viewAllTransactions: 'View All Transactions',
  enterAmountToAdd: 'Enter the amount you want to add to your wallet',
  enterAmountToWithdraw: 'Enter the amount you want to withdraw from your wallet',
  amount: 'Amount',
  availableBalance: 'Available Balance',
  
  // Footer
  aboutUs: 'About Us',
  contactUs: 'Contact Us',
  termsConditions: 'Terms & Conditions',
  privacyPolicy: 'Privacy Policy',
  faq: 'FAQ',
  helpCenter: 'Help Center',
  copyright: ' 2025 DireMart. All rights reserved.',
};

// Amharic translations
const amTranslations = {
  // Navbar
  home: 'መነሻ',
  products: 'ምርቶች',
  categories: 'ምድቦች',
  cart: 'ጋሪ',
  profile: 'መገለጫ',
  orders: 'ትዕዛዞች',
  wallet: 'ዋሌት',
  login: 'ግባ',
  register: 'ተመዝገብ',
  logout: 'ውጣ',
  search: 'ፈልግ',
  sellerDashboard: 'የሻጭ ዳሽቦርድ',
  language: 'ቋንቋ',
  
  // Homepage
  featuredProducts: 'ተለይተው የቀረቡ ምርቶች',
  newArrivals: 'አዲስ የደረሱ',
  viewAll: 'ሁሉንም ይመልከቱ',
  shopNow: 'አሁን ይግዙ',
  discover: 'ያግኙ',
  explore: 'ያስሱ',
  freeShipping: 'ነፃ ማድረስ',
  onOrdersOver: 'ከETB 50 በላይ በሆኑ ትዕዛዞች ላይ',
  securePayments: 'ደህንነቱ የተጠበቀ ክፍያዎች',
  secureCheckout: '100% ደህንነቱ የተጠበቀ ክፍያ',
  easyReturns: 'ቀላል መመለሻ',
  returnPolicy: 'የ30 ቀናት መመለሻ ፖሊሲ',
  support: '24/7 ድጋፍ',
  dedicatedSupport: 'የተወሰነ የድጋፍ ቡድን',
  
  // Product
  addToCart: 'ወደ ጋሪ ጨምር',
  buyNow: 'አሁን ይግዙ',
  outOfStock: 'አክሟል',
  price: 'ዋጋ',
  rating: 'ደረጃ',
  reviews: 'ግምገማዎች',
  description: 'መግለጫ',
  specifications: 'ዝርዝሮች',
  
  // Cart
  yourCart: 'የእርስዎ ጋሪ',
  emptyCart: 'ጋሪዎ ባዶ ነው',
  continueShopping: 'መግዛት ይቀጥሉ',
  proceedToCheckout: 'ወደ ክፍያ ይቀጥሉ',
  total: 'ጠቅላላ',
  remove: 'አስወግድ',
  
  // Auth
  email: 'ኢሜይል',
  password: 'የይለፍ ቃል',
  confirmPassword: 'የይለፍ ቃል ያረጋግጡ',
  forgotPassword: 'የይለፍ ቃል ረሱ?',
  dontHaveAccount: 'መለያ የለዎትም?',
  alreadyHaveAccount: 'አስቀድሞ መለያ አለዎት?',
  signUp: 'ይመዝገቡ',
  signIn: 'ይግቡ',
  
  // Profile
  editProfile: 'መገለጫ ያስተካክሉ',
  save: 'አስቀምጥ',
  cancel: 'ሰርዝ',
  phoneNumber: 'ስልክ ቁጥር',
  accountType: 'የመለያ አይነት',
  buyer: 'ገዢ',
  seller: 'ሻጭ',
  
  // Orders
  myOrders: 'የእኔ ትዕዛዞች',
  orderDetails: 'የትዕዛዝ ዝርዝሮች',
  orderStatus: 'የትዕዛዝ ሁኔታ',
  orderDate: 'የትዕዛዝ ቀን',
  orderTotal: 'የትዕዛዝ ጠቅላላ',
  pending: 'በመጠበቅ ላይ',
  processing: 'በሂደት ላይ',
  shipped: 'ተልኳል',
  delivered: 'ደርሷል',
  cancelled: 'ተሰርዟል',
  
  // Wallet
  walletBalance: 'የዋሌት ቀሪ',
  addFunds: 'ገንዘብ ጨምር',
  withdraw: 'አውጣ',
  transactions: 'ግብይቶች',
  manageYourFunds: 'ገንዘብዎን ያስተዳድሩ እና ግብይቶችዎን ይከታተሉ',
  recentTransactions: 'የቅርብ ጊዜ ግብይቶች',
  transactionHistory: 'የግብይት ታሪክ',
  noTransactions: 'እስካሁን ምንም ግብይቶች የሉም',
  depositedFunds: 'የተቀመጠ ገንዘብ',
  withdrewFunds: 'የወጣ ገንዘብ',
  viewAllTransactions: 'ሁሉንም ግብይቶች ይመልከቱ',
  enterAmountToAdd: 'ወደ ዋሌትዎ ለመጨመር የሚፈልጉትን መጠን ያስገቡ',
  enterAmountToWithdraw: 'ከዋሌትዎ ለማውጣት የሚፈልጉትን መጠን ያስገቡ',
  amount: 'መጠን',
  availableBalance: 'ያለው ቀሪ',
  
  // Footer
  aboutUs: 'ስለ እኛ',
  contactUs: 'ያግኙን',
  termsConditions: 'ውሎች እና ሁኔታዎች',
  privacyPolicy: 'የግላዊነት ፖሊሲ',
  faq: 'ተደጋግመው የሚጠየቁ ጥያቄዎች',
  helpCenter: 'የእርዳታ ማዕከል',
  copyright: ' 2025 DireMart. ሁሉም መብቶች የተጠበቁ ናቸው።',
};

// Create language context
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Get saved language preference from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Get translations based on current language
  const translations = language === 'am' ? amTranslations : enTranslations;

  // Function to translate a key
  const t = (key) => {
    return translations[key] || key;
  };

  // Function to get text that should not be translated (for product content)
  const getOriginalText = (text) => {
    return text;
  };

  // Function to conditionally translate text based on content type
  const translateText = (text, isProductContent = false) => {
    // If it's product content, don't translate
    if (isProductContent) {
      return text;
    }
    
    // Try to find a translation key that matches the text
    const translationKey = Object.keys(translations).find(key => 
      enTranslations[key] === text || amTranslations[key] === text
    );
    
    // If a key was found, translate it; otherwise return the original text
    return translationKey ? t(translationKey) : text;
  };

  // Function to change language
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      t,
      getOriginalText,
      translateText,
      isAmharic: language === 'am'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
