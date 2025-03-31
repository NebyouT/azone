import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './config';

/**
 * Get all saved shipping addresses for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of shipping addresses
 */
export const getSavedAddresses = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const addressesRef = collection(db, 'users', userId, 'addresses');
    // Fetch all addresses without complex ordering to avoid index requirements
    const addressesSnapshot = await getDocs(addressesRef);
    
    const addresses = [];
    addressesSnapshot.forEach((doc) => {
      addresses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort in JavaScript instead of Firestore
    // First by isDefault (true first), then by createdAt (newest first)
    return addresses.sort((a, b) => {
      // Sort by isDefault (true values first)
      if (a.isDefault === b.isDefault) {
        // If isDefault is the same, sort by createdAt (newest first)
        // Handle cases where createdAt might be a Firestore Timestamp or missing
        const aTime = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt) : 0;
        const bTime = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt) : 0;
        return bTime - aTime; // Descending order (newest first)
      }
      // True values first for isDefault
      return a.isDefault ? -1 : 1;
    });
  } catch (error) {
    console.error('Error getting saved addresses:', error);
    throw error;
  }
};

/**
 * Save a new shipping address for a user
 * @param {string} userId - The user ID
 * @param {object} addressData - The address data
 * @param {boolean} setAsDefault - Whether to set this address as default
 * @returns {Promise<object>} - The saved address
 */
export const saveAddress = async (userId, addressData, setAsDefault = false) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!addressData) throw new Error('Address data is required');
    
    // If this is set as default, update all other addresses to not be default
    if (setAsDefault) {
      await updateDefaultAddress(userId, null);
    }
    
    // Check if this is the first address (if so, make it default)
    const addresses = await getSavedAddresses(userId);
    const isFirstAddress = addresses.length === 0;
    
    const addressesRef = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesRef, {
      ...addressData,
      isDefault: setAsDefault || isFirstAddress,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...addressData,
      isDefault: setAsDefault || isFirstAddress
    };
  } catch (error) {
    console.error('Error saving address:', error);
    throw error;
  }
};

/**
 * Update an existing shipping address
 * @param {string} userId - The user ID
 * @param {string} addressId - The address ID
 * @param {object} addressData - The updated address data
 * @param {boolean} setAsDefault - Whether to set this address as default
 * @returns {Promise<object>} - The updated address
 */
export const updateAddress = async (userId, addressId, addressData, setAsDefault = false) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!addressId) throw new Error('Address ID is required');
    if (!addressData) throw new Error('Address data is required');
    
    // If this is set as default, update all other addresses to not be default
    if (setAsDefault) {
      await updateDefaultAddress(userId, addressId);
    }
    
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    await updateDoc(addressRef, {
      ...addressData,
      isDefault: setAsDefault ? true : addressData.isDefault,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: addressId,
      ...addressData,
      isDefault: setAsDefault ? true : addressData.isDefault
    };
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete a shipping address
 * @param {string} userId - The user ID
 * @param {string} addressId - The address ID
 * @returns {Promise<void>}
 */
export const deleteAddress = async (userId, addressId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!addressId) throw new Error('Address ID is required');
    
    // Check if this is the default address
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    const addressDoc = await getDoc(addressRef);
    
    if (addressDoc.exists() && addressDoc.data().isDefault) {
      // If deleting the default address, set another address as default if available
      const addresses = await getSavedAddresses(userId);
      const otherAddresses = addresses.filter(addr => addr.id !== addressId);
      
      if (otherAddresses.length > 0) {
        // Set the first other address as default
        await updateAddress(userId, otherAddresses[0].id, otherAddresses[0], true);
      }
    }
    
    // Delete the address
    await deleteDoc(addressRef);
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Update the default address
 * @param {string} userId - The user ID
 * @param {string} newDefaultAddressId - The new default address ID (null to clear all defaults)
 * @returns {Promise<void>}
 */
export const updateDefaultAddress = async (userId, newDefaultAddressId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const addresses = await getSavedAddresses(userId);
    
    // Update all addresses to not be default
    for (const address of addresses) {
      if (address.id !== newDefaultAddressId && address.isDefault) {
        const addressRef = doc(db, 'users', userId, 'addresses', address.id);
        await updateDoc(addressRef, {
          isDefault: false,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // Set the new default address
    if (newDefaultAddressId) {
      const addressRef = doc(db, 'users', userId, 'addresses', newDefaultAddressId);
      await updateDoc(addressRef, {
        isDefault: true,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating default address:', error);
    throw error;
  }
};

/**
 * Get the default shipping address for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>} - The default address or null if none exists
 */
export const getDefaultAddress = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    
    const addresses = await getSavedAddresses(userId);
    return addresses.find(address => address.isDefault) || null;
  } catch (error) {
    console.error('Error getting default address:', error);
    throw error;
  }
};
