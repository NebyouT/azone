import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadImage } from '../../cloudinary/services';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Autocomplete,
  Radio,
  RadioGroup,
  FormLabel,
  Checkbox,
  FormGroup,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Slider,
  Stack
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CloudUpload as CloudUploadIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentReturn as AssignmentReturnIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
  AttachMoney as AttachMoneyIcon,
  ColorLens as ColorLensIcon,
  FormatSize as FormatSizeIcon,
  Texture as TextureIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useAuth } from '../../contexts/AuthContext';
import { addProduct, getProductById, updateProduct } from '../../firebase/services';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';

const categories = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Books & Media',
  'Toys & Games',
  'Sports & Outdoors',
  'Automotive',
  'Health & Wellness',
  'Grocery & Food',
  'Jewelry & Accessories',
  'Office & Stationery',
  'Pet Supplies'
];

const subcategories = {
  'Electronics': [
    'Smartphones & Accessories',
    'Computers & Laptops',
    'Audio & Headphones',
    'Cameras & Photography',
    'TV & Home Entertainment',
    'Wearable Technology',
    'Gaming & Consoles'
  ],
  'Fashion': [
    'Men\'s Clothing',
    'Women\'s Clothing',
    'Kids\' Clothing',
    'Shoes',
    'Bags & Luggage',
    'Accessories',
    'Traditional Wear'
  ],
  'Home & Kitchen': [
    'Furniture',
    'Kitchen & Dining',
    'Bedding & Linens',
    'Home Decor',
    'Storage & Organization',
    'Appliances',
    'Lighting'
  ],
  'Beauty & Personal Care': [
    'Skincare',
    'Makeup',
    'Hair Care',
    'Fragrances',
    'Bath & Body',
    'Men\'s Grooming',
    'Tools & Accessories'
  ],
  'Books & Media': [
    'Fiction Books',
    'Non-fiction Books',
    'Children\'s Books',
    'Textbooks',
    'E-books',
    'Music & CDs',
    'Movies & TV Shows'
  ],
  'Toys & Games': [
    'Action Figures & Playsets',
    'Dolls & Accessories',
    'Educational Toys',
    'Games & Puzzles',
    'Outdoor Play',
    'Building Toys',
    'Remote Control Toys'
  ],
  'Sports & Outdoors': [
    'Exercise & Fitness',
    'Team Sports',
    'Outdoor Recreation',
    'Cycling',
    'Water Sports',
    'Camping & Hiking',
    'Sports Clothing'
  ],
  'Automotive': [
    'Car Accessories',
    'Motorcycle Accessories',
    'Car Care',
    'Tools & Equipment',
    'GPS & Navigation',
    'Replacement Parts',
    'Oils & Fluids'
  ],
  'Health & Wellness': [
    'Vitamins & Supplements',
    'Medical Supplies',
    'Personal Care',
    'Health Monitors',
    'Fitness Equipment',
    'Wellness Products',
    'First Aid'
  ],
  'Grocery & Food': [
    'Snacks & Beverages',
    'Cooking Ingredients',
    'Canned & Packaged Foods',
    'Breakfast Foods',
    'Dairy & Eggs',
    'Meat & Seafood',
    'Organic Foods'
  ],
  'Jewelry & Accessories': [
    'Necklaces & Pendants',
    'Earrings',
    'Bracelets & Bangles',
    'Rings',
    'Watches',
    'Men\'s Jewelry',
    'Fine Jewelry'
  ],
  'Office & Stationery': [
    'Writing Supplies',
    'Notebooks & Journals',
    'Office Electronics',
    'School Supplies',
    'Desk Accessories',
    'Calendars & Planners',
    'Art Supplies'
  ],
  'Pet Supplies': [
    'Dog Supplies',
    'Cat Supplies',
    'Fish Supplies',
    'Bird Supplies',
    'Small Animal Supplies',
    'Pet Food',
    'Pet Toys'
  ]
};

const sizes = [
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL',
  '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42', '44',
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12', '13'
];

const materials = [
  'Cotton', 'Linen', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim',
  'Nylon', 'Cashmere', 'Velvet', 'Satin', 'Chiffon', 'Spandex', 'Rayon',
  'Canvas', 'Fleece', 'Acrylic', 'Bamboo', 'Corduroy', 'Tweed', 'Jersey'
];

// Updated shipping regions to only include Dire Dawa and Addis Ababa
const shippingRegions = [
  'Addis Ababa',
  'Dire Dawa'
];

const returnPeriods = [
  'No Returns',
  '7 Days',
  '14 Days',
  '30 Days',
  '60 Days',
  '90 Days'
];

// Styled component for the file upload area
const UploadArea = styled('div')(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
  }
}));

const ProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userDetails, isSeller } = useAuth();
  const isEditMode = !!productId;
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  const [formData, setFormData] = useState({
    // Basic Product Information
    name: '',
    shortDescription: '',
    description: '',
    brand: '',
    category: '',
    subcategory: '',
    tags: '',
    
    // Product Images & Variants
    hasColorVariants: false,
    colorOptions: [],
    hasSizeVariants: false,
    sizeOptions: [],
    materials: '',
    
    // Pricing & Discount
    price: '',
    discount: '0',
    hasLimitedTimeOffer: false,
    discountEndDate: null,
    
    // Inventory & Stock
    inStock: true,
    quantity: '',
    lowStockAlert: false,
    lowStockThreshold: '5',
    
    // Shipping & Delivery
    shippingCostType: 'fixed', // 'fixed', 'weight-based', 'free'
    shippingCost: '0',
    shippingRegions: ['Addis Ababa'],
    estimatedDeliveryDays: '',
    
    // Return & Refund
    returnPolicy: 'No Returns',
    warranty: '',
    
    // Additional Details
    weight: '',
    dimensions: '',
    countryOfOrigin: '',
    specifications: '',
    features: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([]);
  const [variants, setVariants] = useState([{ name: '', options: '', price: '', quantity: '', imageUrl: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  useEffect(() => {
    // Redirect if not a seller
    if (currentUser && userDetails && !isSeller) {
      navigate('/');
    }
  }, [currentUser, userDetails, isSeller, navigate]);
  
  useEffect(() => {
    // If in edit mode, fetch the product data
    if (isEditMode && productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const product = await getProductById(productId);
          
          // Check if the product belongs to this seller
          if (product.sellerId !== currentUser?.uid) {
            setError("You don't have permission to edit this product");
            navigate('/seller/dashboard');
            return;
          }
          
          setFormData({
            // Basic Product Information
            name: product.name || '',
            shortDescription: product.shortDescription || '',
            description: product.description || '',
            brand: product.brand || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            tags: product.tags?.join(', ') || '',
            
            // Product Images & Variants
            hasColorVariants: product.hasColorVariants || false,
            colorOptions: product.colorOptions || [],
            hasSizeVariants: product.hasSizeVariants || false,
            sizeOptions: product.sizeOptions || [],
            materials: product.materials || '',
            
            // Pricing & Discount
            price: product.price?.toString() || '',
            discount: product.discount?.toString() || '0',
            hasLimitedTimeOffer: product.hasLimitedTimeOffer || false,
            discountEndDate: product.discountEndDate ? new Date(product.discountEndDate) : null,
            
            // Inventory & Stock
            inStock: product.inStock ?? true,
            quantity: product.quantity?.toString() || '',
            lowStockAlert: product.lowStockAlert || false,
            lowStockThreshold: product.lowStockThreshold?.toString() || '5',
            
            // Shipping & Delivery
            shippingCostType: product.shippingCostType || 'fixed',
            shippingCost: product.shippingCost?.toString() || '0',
            shippingRegions: product.shippingRegions || ['Addis Ababa'],
            estimatedDeliveryDays: product.estimatedDeliveryDays || '',
            
            // Return & Refund
            returnPolicy: product.returnPolicy || 'No Returns',
            warranty: product.warranty || '',
            
            // Additional Details
            weight: product.weight || '',
            dimensions: product.dimensions || '',
            countryOfOrigin: product.countryOfOrigin || '',
            specifications: product.specifications || '',
            features: product.features || ''
          });
          
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
          
          // Load additional images if available
          if (product.additionalImages && product.additionalImages.length > 0) {
            setAdditionalImages(product.additionalImages);
          }
          
          // Load variants if available
          if (product.variants && product.variants.length > 0) {
            setVariants(product.variants);
          }
          
        } catch (err) {
          console.error("Error fetching product:", err);
          setError("Failed to load product details");
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [isEditMode, productId, currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({ 
        ...prev, 
        image: 'Please upload a valid image file (JPEG, PNG, or WebP)' 
      }));
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => ({ 
        ...prev, 
        image: 'Image size should be less than 5MB' 
      }));
      return;
    }
    
    setImageFile(file);
    setFormErrors(prev => ({ ...prev, image: '' }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAdditionalImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      setFormErrors(prev => ({ 
        ...prev, 
        additionalImages: 'Some images were skipped. Please ensure all images are valid (JPEG, PNG, or WebP) and under 5MB.' 
      }));
    } else {
      setFormErrors(prev => ({ ...prev, additionalImages: '' }));
    }
    
    // Add to additional image files
    setAdditionalImageFiles(prev => [...prev, ...validFiles]);
    
    // Create previews for valid files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleRemoveAdditionalImage = (index) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddVariant = () => {
    setVariants([...variants, { name: '', options: '', price: '', quantity: '', imageUrl: '' }]);
  };
  
  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
    
    // Clear error for this field if it exists
    if (formErrors.variants && formErrors.variants[index] && formErrors.variants[index][field]) {
      const updatedErrors = { ...formErrors };
      updatedErrors.variants[index][field] = '';
      setFormErrors(updatedErrors);
    }
  };
  
  const handleVariantImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        if (!updatedErrors.variants) updatedErrors.variants = [];
        if (!updatedErrors.variants[index]) updatedErrors.variants[index] = {};
        updatedErrors.variants[index].imageUrl = 'Please upload a valid image file (JPEG, PNG, or WebP)';
        return updatedErrors;
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors(prev => {
        const updatedErrors = { ...prev };
        if (!updatedErrors.variants) updatedErrors.variants = [];
        if (!updatedErrors.variants[index]) updatedErrors.variants[index] = {};
        updatedErrors.variants[index].imageUrl = 'Image size should be less than 5MB';
        return updatedErrors;
      });
      return;
    }
    
    // Clear any previous errors
    if (formErrors.variants && formErrors.variants[index] && formErrors.variants[index].imageUrl) {
      const updatedErrors = { ...formErrors };
      updatedErrors.variants[index].imageUrl = '';
      setFormErrors(updatedErrors);
    }
    
    // Create preview and update variant
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedVariants = [...variants];
      updatedVariants[index] = { 
        ...updatedVariants[index], 
        imageUrl: reader.result,
        imageFile: file // Store the actual file for later upload
      };
      setVariants(updatedVariants);
    };
    reader.readAsDataURL(file);
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Basic Product Information validation
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }
    
    if (!formData.shortDescription?.trim()) {
      errors.shortDescription = 'Short description is required';
    }
    
    if (!formData.category) {
      errors.category = 'Category is required';
    }
    
    if (!formData.subcategory) {
      errors.subcategory = 'Subcategory is required';
    }
    
    // Pricing validation
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (formData.discount && (isNaN(formData.discount) || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
      errors.discount = 'Discount must be between 0 and 100';
    }
    
    // Limited time offer validation
    if (formData.hasLimitedTimeOffer && !formData.discountEndDate) {
      errors.discountEndDate = 'Please select an end date for the limited time offer';
    }
    
    // Inventory validation
    if (formData.quantity && (isNaN(formData.quantity) || parseInt(formData.quantity) < 0)) {
      errors.quantity = 'Quantity must be a non-negative number';
    }
    
    if (formData.lowStockAlert && (!formData.lowStockThreshold || isNaN(formData.lowStockThreshold) || parseInt(formData.lowStockThreshold) < 1)) {
      errors.lowStockThreshold = 'Low stock threshold must be a positive number';
    }
    
    // Shipping validation
    if (formData.shippingCostType === 'fixed' && (isNaN(formData.shippingCost) || parseFloat(formData.shippingCost) < 0)) {
      errors.shippingCost = 'Shipping cost must be a non-negative number';
    }
    
    if (!formData.estimatedDeliveryDays) {
      errors.estimatedDeliveryDays = 'Estimated delivery days is required';
    }
    
    // Image validation
    if (!isEditMode && !imageFile && !imagePreview) {
      errors.image = 'Product image is required';
    }
    
    if (additionalImages.length < 2) {
      errors.additionalImages = 'At least 3 images are required (1 main + 2 additional)';
    }
    
    // Variants validation
    if (formData.hasVariants) {
      const variantErrors = [];
      let hasError = false;
      
      variants.forEach((variant, index) => {
        const currentErrors = {};
        
        if (!variant.name.trim()) {
          currentErrors.name = 'Variant name is required';
          hasError = true;
        }
        
        if (!variant.options.trim()) {
          currentErrors.options = 'Options are required';
          hasError = true;
        }
        
        if (!variant.price) {
          currentErrors.price = 'Price is required';
          hasError = true;
        } else if (isNaN(variant.price) || parseFloat(variant.price) <= 0) {
          currentErrors.price = 'Price must be a positive number';
          hasError = true;
        }
        
        variantErrors[index] = currentErrors;
      });
      
      if (hasError) {
        errors.variants = variantErrors;
      }
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Find the tab with errors and switch to it
      if (errors.name || errors.description || errors.shortDescription || 
          errors.category || errors.subcategory) {
        setActiveTab(0); // Basic Information tab
      } else if (errors.image || errors.additionalImages || errors.variants) {
        setActiveTab(1); // Images & Variants tab
      } else if (errors.price || errors.discount || errors.discountEndDate) {
        setActiveTab(2); // Pricing & Discount tab
      } else if (errors.quantity || errors.lowStockThreshold) {
        setActiveTab(3); // Inventory tab
      } else if (errors.shippingCost || errors.estimatedDeliveryDays) {
        setActiveTab(4); // Shipping tab
      } else if (errors.returnPolicy) {
        setActiveTab(5); // Return & Refund tab
      }
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      
      // Prepare product data
      const productData = {
        // Basic Product Information
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        subcategory: formData.subcategory,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        
        // Product Images & Variants
        hasColorVariants: formData.hasColorVariants,
        colorOptions: formData.colorOptions,
        hasSizeVariants: formData.hasSizeVariants,
        sizeOptions: formData.sizeOptions,
        materials: formData.materials,
        
        // Pricing & Discount
        price: parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        hasLimitedTimeOffer: formData.hasLimitedTimeOffer,
        discountEndDate: formData.hasLimitedTimeOffer && formData.discountEndDate ? formData.discountEndDate.toISOString() : null,
        
        // Inventory & Stock
        inStock: formData.inStock,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        lowStockAlert: formData.lowStockAlert,
        lowStockThreshold: formData.lowStockAlert ? parseInt(formData.lowStockThreshold) : null,
        
        // Shipping & Delivery
        shippingCostType: formData.shippingCostType,
        shippingCost: formData.shippingCostType !== 'free' ? parseFloat(formData.shippingCost) : 0,
        shippingRegions: formData.shippingRegions,
        estimatedDeliveryDays: formData.estimatedDeliveryDays,
        
        // Return & Refund
        returnPolicy: formData.returnPolicy,
        warranty: formData.warranty,
        
        // Additional Details
        weight: formData.weight,
        dimensions: formData.dimensions,
        countryOfOrigin: formData.countryOfOrigin,
        specifications: formData.specifications ? formData.specifications.split('\n').filter(item => item.trim()) : [],
        features: formData.features ? formData.features.split('\n').filter(item => item.trim()) : [],
        
        // Variants
        hasVariants: formData.hasVariants,
        variants: formData.hasVariants ? variants : [],
        
        // Images
        additionalImages: additionalImages,
        imageUrl: imagePreview // Keep existing image URL if no new image is uploaded
      };
      
      // First upload all variant images to Cloudinary if they exist
      if (formData.hasVariants && variants.length > 0) {
        const variantsWithUploadedImages = await Promise.all(
          variants.map(async (variant) => {
            // If the variant has an imageFile (newly uploaded), upload it to Cloudinary
            if (variant.imageFile) {
              try {
                // Upload the file to Cloudinary using the service
                const imageUrl = await uploadImage(variant.imageFile, 'variants');
                
                // Create a new variant object without the file and preview properties
                const { imageFile, imagePreview, ...variantWithoutFileData } = variant;
                return { 
                  ...variantWithoutFileData,
                  imageUrl // Use the Cloudinary URL
                };
              } catch (uploadError) {
                console.error('Error uploading variant image:', uploadError);
                // If upload fails, create a new variant object without the file and preview properties
                const { imageFile, imagePreview, ...variantWithoutFileData } = variant;
                return variantWithoutFileData;
              }
            }
            // For variants without new image files, make sure to remove any file objects
            // to prevent Firebase errors with undefined values
            const { imageFile, imagePreview, ...variantWithoutFileData } = variant;
            return variantWithoutFileData;
          })
        );

        // Update the product data with the uploaded variant images
        productData.variants = variantsWithUploadedImages;
      }
      
      if (isEditMode) {
        // Update existing product
        await updateProduct(productId, productData, imageFile, additionalImageFiles);
        navigate('/seller/dashboard');
      } else {
        // Add new product
        const newProductId = await addProduct(productData, imageFile, additionalImageFiles);
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/seller/dashboard');
  };
  
  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              fontWeight: 600
            }}
          >
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              mb: 3, 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                minHeight: { xs: '48px', md: '64px' },
                padding: { xs: '6px 10px', sm: '6px 12px', md: '6px 16px' },
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                marginRight: { xs: '4px', sm: '6px', md: '8px' },
              }
            }}
          >
            <Tab 
              label="Basic Info" 
              icon={<CategoryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Images" 
              icon={<ImageIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Pricing" 
              icon={<AttachMoneyIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Inventory" 
              icon={<InventoryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Shipping" 
              icon={<LocalShippingIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Returns" 
              icon={<AssignmentReturnIcon />} 
              iconPosition="start"
            />
          </Tabs>
          
          {/* Basic Information Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 600
                }}
              >
                Basic Product Information
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Provide the core details to make your product searchable and attractive to customers.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Product Title"
                    name="name"
                    placeholder="e.g. Fashionable 3D Cotton and Linen Short-Sleeve Shirt"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    InputProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    InputLabelProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    FormHelperTextProps={{
                      style: { fontSize: '0.75rem' }
                    }}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="shortDescription"
                    label="Short Description"
                    name="shortDescription"
                    placeholder="Brief summary of your product (displayed in product listings)"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    error={!!formErrors.shortDescription}
                    helperText={formErrors.shortDescription}
                    InputProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    InputLabelProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    FormHelperTextProps={{
                      style: { fontSize: '0.75rem' }
                    }}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="description"
                    label="Full Product Description"
                    name="description"
                    multiline
                    rows={4}
                    placeholder="Detailed description of your product including key features, materials, use cases, etc."
                    value={formData.description}
                    onChange={handleChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    InputProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    InputLabelProps={{
                      style: { fontSize: '0.9rem' }
                    }}
                    FormHelperTextProps={{
                      style: { fontSize: '0.75rem' }
                    }}
                    sx={{ mb: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="brand"
                    label="Brand Name"
                    name="brand"
                    placeholder="e.g. Nike, Samsung, etc."
                    value={formData.brand}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    required
                    error={!!formErrors.category}
                  >
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={formData.category}
                      label="Category"
                      onChange={handleChange}
                    >
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.category && (
                      <FormHelperText>{formErrors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    required
                    error={!!formErrors.subcategory}
                    disabled={!formData.category}
                  >
                    <InputLabel id="subcategory-label">Subcategory</InputLabel>
                    <Select
                      labelId="subcategory-label"
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      label="Subcategory"
                      onChange={handleChange}
                    >
                      {formData.category && subcategories[formData.category]?.map(subcategory => (
                        <MenuItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.subcategory && (
                      <FormHelperText>{formErrors.subcategory}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="tags"
                    label="Tags (comma separated)"
                    name="tags"
                    placeholder="e.g. summer, casual, trendy"
                    value={formData.tags}
                    onChange={handleChange}
                    helperText="Help customers find your product with relevant tags"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="countryOfOrigin"
                    label="Country of Origin"
                    name="countryOfOrigin"
                    placeholder="e.g. China, USA, Italy"
                    value={formData.countryOfOrigin}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Images & Variants Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Images & Variants
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Showcase your product with high-quality images and offer variants to cater to different customer preferences.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Main Product Image
                    </Typography>
                    
                    <UploadArea>
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Product preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No image selected
                        </Typography>
                      )}
                    </UploadArea>
                    
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                    >
                      Upload Main Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>
                    
                    {formErrors.image && (
                      <FormHelperText error>{formErrors.image}</FormHelperText>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Supported formats: JPEG, PNG, WebP. Max size: 5MB
                    </Typography>
                    
                    <Divider sx={{ width: '100%', my: 3 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Additional Product Images
                    </Typography>
                    
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <Grid container spacing={1}>
                        {additionalImages.map((img, index) => (
                          <Grid item xs={6} key={index}>
                            <Box 
                              sx={{ 
                                position: 'relative',
                                width: '100%', 
                                height: 100,
                                border: theme => `1px solid ${theme.palette.divider}`,
                                overflow: 'hidden'
                              }}
                            >
                              <img 
                                src={img} 
                                alt={`Product image ${index + 1}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <IconButton
                                size="small"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  right: 0,
                                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                                  '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                                  }
                                }}
                                onClick={() => handleRemoveAdditionalImage(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AddPhotoAlternateIcon />}
                      sx={{ mt: 1 }}
                    >
                      Add More Images
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImageChange}
                      />
                    </Button>
                    
                    {formErrors.additionalImages && (
                      <FormHelperText error>{formErrors.additionalImages}</FormHelperText>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Add up to 5 additional images to showcase your product from different angles
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Product Variants
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Offer different variants of your product to cater to various customer preferences.
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasVariants}
                        onChange={handleChange}
                        name="hasVariants"
                        color="primary"
                      />
                    }
                    label="This product has variants (size, color, etc.)"
                    sx={{ mb: 2 }}
                  />
                  
                  {formData.hasVariants && (
                    <Box sx={{ mb: 3 }}>
                      {variants.map((variant, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1">
                                  Variant {index + 1}
                                </Typography>
                                {variants.length > 1 && (
                                  <Button 
                                    size="small" 
                                    color="error" 
                                    onClick={() => handleRemoveVariant(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Variant Name"
                                placeholder="e.g. Size, Color"
                                value={variant.name}
                                onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                error={formErrors.variants && formErrors.variants[index]?.name}
                                helperText={formErrors.variants && formErrors.variants[index]?.name}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Options"
                                placeholder="e.g. Small, Medium, Large"
                                value={variant.options}
                                onChange={(e) => handleVariantChange(index, 'options', e.target.value)}
                                error={formErrors.variants && formErrors.variants[index]?.options}
                                helperText={formErrors.variants && formErrors.variants[index]?.options}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Price"
                                type="number"
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                                }}
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                error={formErrors.variants && formErrors.variants[index]?.price}
                                helperText={formErrors.variants && formErrors.variants[index]?.price}
                              />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                              />
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" gutterBottom>
                                Variant Image
                              </Typography>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 2,
                                mb: 2
                              }}>
                                {variant.imageUrl ? (
                                  <Box
                                    sx={{
                                      width: 80,
                                      height: 80,
                                      border: theme => `1px solid ${theme.palette.divider}`,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <img
                                      src={variant.imageUrl}
                                      alt={`Variant ${index + 1} preview`}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      width: 80,
                                      height: 80,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: theme => `1px dashed ${theme.palette.divider}`,
                                      bgcolor: 'background.default',
                                    }}
                                  >
                                    <ImageIcon color="disabled" />
                                  </Box>
                                )}
                                
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<UploadIcon />}
                                  size="small"
                                >
                                  {variant.imageUrl ? 'Change Image' : 'Upload Image'}
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => handleVariantImageChange(index, e)}
                                  />
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                      
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddVariant}
                        sx={{ mt: 1 }}
                      >
                        Add Variant
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Pricing & Discount Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Pricing & Discount
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set a competitive price for your product and offer discounts to attract more customers.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="price"
                    label="Price"
                    name="price"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                    }}
                    value={formData.price}
                    onChange={handleChange}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="discount"
                    label="Discount (%)"
                    name="discount"
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    value={formData.discount}
                    onChange={handleChange}
                    error={!!formErrors.discount}
                    helperText={formErrors.discount}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasLimitedTimeOffer}
                        onChange={handleChange}
                        name="hasLimitedTimeOffer"
                        color="primary"
                      />
                    }
                    label="Limited Time Offer"
                    sx={{ mb: 2 }}
                  />
                  
                  {formData.hasLimitedTimeOffer && (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Discount End Date"
                        value={formData.discountEndDate}
                        onChange={(newValue) => {
                          setFormData(prev => ({ ...prev, discountEndDate: newValue }));
                        }}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            fullWidth 
                            error={!!formErrors.discountEndDate}
                            helperText={formErrors.discountEndDate}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Inventory Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Inventory
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your product's inventory to ensure timely restocking and avoid overselling.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="quantity"
                    label="Quantity in Stock"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.lowStockAlert}
                        onChange={handleChange}
                        name="lowStockAlert"
                        color="primary"
                      />
                    }
                    label="Low Stock Alert"
                    sx={{ mb: 2 }}
                  />
                  
                  {formData.lowStockAlert && (
                    <TextField
                      fullWidth
                      id="lowStockThreshold"
                      label="Low Stock Threshold"
                      name="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      error={!!formErrors.lowStockThreshold}
                      helperText={formErrors.lowStockThreshold}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.inStock}
                        onChange={handleChange}
                        name="inStock"
                        color="primary"
                      />
                    }
                    label="In Stock"
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Shipping Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Shipping
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your product's shipping options to ensure timely and cost-effective delivery.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    required
                    error={!!formErrors.shippingCostType}
                  >
                    <InputLabel id="shippingCostType-label">Shipping Cost Type</InputLabel>
                    <Select
                      labelId="shippingCostType-label"
                      id="shippingCostType"
                      name="shippingCostType"
                      value={formData.shippingCostType}
                      label="Shipping Cost Type"
                      onChange={handleChange}
                    >
                      <MenuItem value="fixed">Fixed</MenuItem>
                      <MenuItem value="weight-based">Weight-based</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                    </Select>
                    {formErrors.shippingCostType && (
                      <FormHelperText>{formErrors.shippingCostType}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                {formData.shippingCostType !== 'free' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="shippingCost"
                      label="Shipping Cost"
                      name="shippingCost"
                      type="number"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">ETB</InputAdornment>,
                      }}
                      value={formData.shippingCost}
                      onChange={handleChange}
                      error={!!formErrors.shippingCost}
                      helperText={formErrors.shippingCost}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth 
                    required
                    error={!!formErrors.shippingRegions}
                  >
                    <InputLabel id="shippingRegions-label">Shipping Regions</InputLabel>
                    <Select
                      labelId="shippingRegions-label"
                      id="shippingRegions"
                      name="shippingRegions"
                      value={formData.shippingRegions}
                      label="Shipping Regions"
                      onChange={handleChange}
                      multiple
                    >
                      {shippingRegions.map(region => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.shippingRegions && (
                      <FormHelperText>{formErrors.shippingRegions}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="estimatedDeliveryDays"
                    label="Estimated Delivery Days"
                    name="estimatedDeliveryDays"
                    value={formData.estimatedDeliveryDays}
                    onChange={handleChange}
                    error={!!formErrors.estimatedDeliveryDays}
                    helperText={formErrors.estimatedDeliveryDays}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Return & Refund Tab */}
          {activeTab === 5 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Return & Refund
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Define your return and refund policies to ensure customer satisfaction and build trust.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth 
                    required
                    error={!!formErrors.returnPolicy}
                  >
                    <InputLabel id="returnPolicy-label">Return Policy</InputLabel>
                    <Select
                      labelId="returnPolicy-label"
                      id="returnPolicy"
                      name="returnPolicy"
                      value={formData.returnPolicy}
                      label="Return Policy"
                      onChange={handleChange}
                    >
                      {returnPeriods.map(period => (
                        <MenuItem key={period} value={period}>
                          {period}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.returnPolicy && (
                      <FormHelperText>{formErrors.returnPolicy}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="warranty"
                    label="Warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Product' : 'Add Product')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductForm;
