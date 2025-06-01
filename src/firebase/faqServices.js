import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from './config';

// Get all FAQs
export const getAllFAQs = async (category = null) => {
  try {
    let faqsQuery;
    
    if (category) {
      faqsQuery = query(
        collection(db, 'faqs'),
        where('category', '==', category),
        orderBy('order', 'asc')
      );
    } else {
      faqsQuery = query(
        collection(db, 'faqs'),
        orderBy('order', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(faqsQuery);
    const faqs = [];
    
    querySnapshot.forEach((doc) => {
      faqs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return faqs;
  } catch (error) {
    console.error('Error getting FAQs:', error);
    throw error;
  }
};

// Get FAQ categories
export const getFAQCategories = async () => {
  try {
    const categoriesQuery = query(
      collection(db, 'faqCategories'),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return categories;
  } catch (error) {
    console.error('Error getting FAQ categories:', error);
    throw error;
  }
};

// Add a new FAQ (admin only)
export const addFAQ = async (faqData) => {
  try {
    const faqRef = await addDoc(collection(db, 'faqs'), {
      ...faqData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return faqRef.id;
  } catch (error) {
    console.error('Error adding FAQ:', error);
    throw error;
  }
};

// Update an existing FAQ (admin only)
export const updateFAQ = async (faqId, faqData) => {
  try {
    const faqRef = doc(db, 'faqs', faqId);
    
    await updateDoc(faqRef, {
      ...faqData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }
};

// Delete an FAQ (admin only)
export const deleteFAQ = async (faqId) => {
  try {
    const faqRef = doc(db, 'faqs', faqId);
    await deleteDoc(faqRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    throw error;
  }
};

// Add a new FAQ category (admin only)
export const addFAQCategory = async (categoryData) => {
  try {
    const categoryRef = await addDoc(collection(db, 'faqCategories'), {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return categoryRef.id;
  } catch (error) {
    console.error('Error adding FAQ category:', error);
    throw error;
  }
};

// Add initial FAQs to database (for setup)
export const setupInitialFAQs = async () => {
  try {
    // Check if FAQs already exist
    const existingFAQs = await getAllFAQs();
    if (existingFAQs.length > 0) {
      console.log('FAQs already exist, skipping setup');
      return;
    }
    
    // Create FAQ categories
    const categories = [
      { name: 'Account & Profile', order: 1 },
      { name: 'Orders & Shipping', order: 2 },
      { name: 'Payments & Wallet', order: 3 },
      { name: 'Products & Shopping', order: 4 },
      { name: 'Returns & Refunds', order: 5 },
      { name: 'Seller Information', order: 6 }
    ];
    
    const categoryIds = {};
    
    for (const category of categories) {
      const categoryId = await addFAQCategory(category);
      categoryIds[category.name] = categoryId;
    }
    
    // Create initial FAQs
    const initialFAQs = [
      {
        question: 'How do I create an account?',
        answer: 'To create an account, click on the "Sign Up" button in the top right corner of the page. Fill in your details including your name, email address, and password. Once submitted, you\'ll receive a verification email. Click the link in the email to verify your account and start shopping!',
        category: categoryIds['Account & Profile'],
        order: 1
      },
      {
        question: 'How can I update my profile information?',
        answer: 'You can update your profile information by going to your profile page. Click on your profile icon in the top right corner, then select "Profile" from the dropdown menu. From there, click the "Edit Profile" button to update your information including name, phone number, and profile picture.',
        category: categoryIds['Account & Profile'],
        order: 2
      },
      {
        question: 'How do I track my order?',
        answer: 'You can track your order by going to the "Orders" section in your account. Click on the specific order you want to track, and you\'ll see the current status of your order. The status will be updated as your order progresses from processing to shipping to delivery.',
        category: categoryIds['Orders & Shipping'],
        order: 1
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept various payment methods including credit/debit cards, mobile money, and wallet balance. For credit/debit cards, we use secure payment processing through Chapa. All transactions are encrypted and secure.',
        category: categoryIds['Payments & Wallet'],
        order: 1
      },
      {
        question: 'How do I add money to my wallet?',
        answer: 'To add money to your wallet, go to the "Wallet" section in your account. Click on "Add Funds" and enter the amount you want to add. You\'ll be redirected to our secure payment gateway where you can complete the transaction. Once the payment is verified, the funds will be added to your wallet immediately.',
        category: categoryIds['Payments & Wallet'],
        order: 2
      },
      {
        question: 'How can I become a seller on DireMart?',
        answer: 'To become a seller on DireMart, go to your profile and click on "Become a Seller". You\'ll need to provide some additional information about your business. Once approved, you can start listing your products and selling on our platform.',
        category: categoryIds['Seller Information'],
        order: 1
      },
      {
        question: 'What is your return policy?',
        answer: 'Our return policy allows you to return items within 14 days of delivery if you\'re not satisfied with your purchase. The item must be in its original condition and packaging. To initiate a return, go to your order details and click on "Return Item". Once the return is approved, you\'ll receive a refund to your original payment method or wallet.',
        category: categoryIds['Returns & Refunds'],
        order: 1
      },
      {
        question: 'How long does shipping take?',
        answer: 'Shipping times vary depending on your location and the seller. Typically, orders are delivered within 3-7 business days. You can see the estimated delivery time on the product page before making a purchase. Once your order is shipped, you\'ll receive a notification with tracking information.',
        category: categoryIds['Orders & Shipping'],
        order: 2
      },
      {
        question: 'Can I cancel my order?',
        answer: 'Yes, you can cancel your order as long as it hasn\'t been shipped yet. To cancel an order, go to your order details and click on "Cancel Order". If the order has already been shipped, you\'ll need to wait for delivery and then initiate a return.',
        category: categoryIds['Orders & Shipping'],
        order: 3
      },
      {
        question: 'How do I contact customer support?',
        answer: 'You can contact our customer support team through the chat icon at the bottom of the page, or by visiting our Support page. Our team is available 24/7 to assist you with any questions or concerns you may have.',
        category: categoryIds['Account & Profile'],
        order: 3
      }
    ];
    
    for (const faq of initialFAQs) {
      await addFAQ(faq);
    }
    
    console.log('Initial FAQs setup completed');
    return true;
  } catch (error) {
    console.error('Error setting up initial FAQs:', error);
    throw error;
  }
};
