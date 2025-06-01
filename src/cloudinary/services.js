import axios from 'axios';
import { cloudinaryConfig } from './config';

/**
 * Uploads an image file to Cloudinary
 * @param {File} imageFile - The image file to upload
 * @param {string} folder - Optional folder name to organize images in Cloudinary
 * @returns {Promise<string>} - URL of the uploaded image
 */
export const uploadImage = async (imageFile, folder = 'products') => {
  try {
    if (!imageFile || !(imageFile instanceof File || imageFile instanceof Blob)) {
      console.error('Invalid file object provided to uploadImage:', imageFile);
      throw new Error('Invalid file provided for upload');
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', cloudinaryConfig.upload_preset);
    formData.append('folder', folder);

    // Make the upload request to Cloudinary's upload API
    // Let axios handle the Content-Type header automatically for FormData
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
      formData
    );

    // Return the secure URL of the uploaded image
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    if (error.response && error.response.data) {
      console.error('Cloudinary error details:', error.response.data);
    }
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} imageUrl - The full URL of the image
 * @returns {string} - The public ID of the image
 */
export const getPublicIdFromUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  try {
    // Extract the public ID from the URL
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const urlParts = imageUrl.split('/');
    const filenameWithExtension = urlParts[urlParts.length - 1];
    
    // Get the folder path if it exists
    let folderPath = '';
    if (urlParts.length > 8) {
      // The URL has a folder structure
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length - 1) {
        // Get all parts between 'upload' and the filename
        folderPath = urlParts.slice(uploadIndex + 2, urlParts.length - 1).join('/') + '/';
      }
    }
    
    // Remove the extension from the filename
    const publicIdWithoutExtension = filenameWithExtension.substring(0, filenameWithExtension.lastIndexOf('.'));
    
    return folderPath + publicIdWithoutExtension;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return '';
  }
};

/**
 * Creates a Cloudinary URL for a transformed image
 * @param {string} imageUrl - Original Cloudinary image URL
 * @param {Object} options - Transformation options
 * @returns {string} - Transformed image URL
 */
export const transformImage = (imageUrl, options = {}) => {
  if (!imageUrl) return '';
  
  try {
    // Default transformations
    const defaultOptions = {
      width: options.width || 500,
      height: options.height || 500,
      crop: options.crop || 'fill',
      quality: options.quality || 'auto',
      format: options.format || 'auto'
    };
    
    // Extract the base URL and the path
    const baseUrl = imageUrl.substring(0, imageUrl.indexOf('/upload/') + 8);
    const imagePath = imageUrl.substring(imageUrl.indexOf('/upload/') + 8);
    
    // Build the transformation string
    const transformations = [
      `w_${defaultOptions.width}`,
      `h_${defaultOptions.height}`,
      `c_${defaultOptions.crop}`,
      `q_${defaultOptions.quality}`,
      `f_${defaultOptions.format}`
    ].join(',');
    
    // Return the transformed URL
    return `${baseUrl}${transformations}/${imagePath}`;
  } catch (error) {
    console.error('Error creating transformed image URL:', error);
    return imageUrl; // Return the original URL if there's an error
  }
};
