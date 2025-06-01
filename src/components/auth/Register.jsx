import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormHelperText
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  MarkEmailRead as MarkEmailReadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  registerUser, 
  validateEthiopianPhoneNumber,
  signInWithGoogle,
  resendVerificationEmail,
  checkEmailExists
} from '../../firebase/services';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // State for stepper
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Info', 'Account Details'];
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    role: 'buyer'
  });
  
  // Validation state
  const [validation, setValidation] = useState({
    email: { valid: false, message: '', checking: false },
    password: { valid: false, message: '' },
    confirmPassword: { valid: false, message: '' },
    displayName: { valid: false, message: '' },
    phoneNumber: { valid: true, message: '' } // Optional field, so initially valid
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  
  // Email validation with debounce
  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!formData.email) {
      setValidation(prev => ({
        ...prev,
        email: { valid: false, message: 'Email is required', checking: false }
      }));
      return;
    }
    
    if (!emailRegex.test(formData.email)) {
      setValidation(prev => ({
        ...prev,
        email: { valid: false, message: 'Please enter a valid email address', checking: false }
      }));
      return;
    }
    
    // Set checking state while we verify email uniqueness
    setValidation(prev => ({
      ...prev,
      email: { ...prev.email, checking: true }
    }));
    
    const checkEmailTimer = setTimeout(async () => {
      try {
        const exists = await checkEmailExists(formData.email);
        setValidation(prev => ({
          ...prev,
          email: { 
            valid: !exists, 
            message: exists ? 'This email is already in use' : '',
            checking: false
          }
        }));
      } catch (err) {
        console.error('Error checking email:', err);
        setValidation(prev => ({
          ...prev,
          email: { valid: false, message: 'Error checking email', checking: false }
        }));
      }
    }, 600); // Debounce for 600ms
    
    return () => clearTimeout(checkEmailTimer);
  }, [formData.email]);
  
  // Password validation
  useEffect(() => {
    if (!formData.password) {
      setValidation(prev => ({
        ...prev,
        password: { valid: false, message: 'Password is required' }
      }));
      return;
    }
    
    if (formData.password.length < 8) {
      setValidation(prev => ({
        ...prev,
        password: { valid: false, message: 'Password must be at least 8 characters' }
      }));
      return;
    }
    
    // Check password strength
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    
    const strength = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (strength < 3) {
      setValidation(prev => ({
        ...prev,
        password: { 
          valid: false, 
          message: 'Password should include uppercase, lowercase, numbers, and special characters' 
        }
      }));
      return;
    }
    
    setValidation(prev => ({
      ...prev,
      password: { valid: true, message: '' }
    }));
  }, [formData.password]);
  
  // Confirm password validation
  useEffect(() => {
    if (!formData.confirmPassword) {
      setValidation(prev => ({
        ...prev,
        confirmPassword: { valid: false, message: 'Please confirm your password' }
      }));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setValidation(prev => ({
        ...prev,
        confirmPassword: { valid: false, message: 'Passwords do not match' }
      }));
      return;
    }
    
    setValidation(prev => ({
      ...prev,
      confirmPassword: { valid: true, message: '' }
    }));
  }, [formData.password, formData.confirmPassword]);
  
  // Display name validation
  useEffect(() => {
    if (!formData.displayName) {
      setValidation(prev => ({
        ...prev,
        displayName: { valid: false, message: 'Display name is required' }
      }));
      return;
    }
    
    if (formData.displayName.length < 3) {
      setValidation(prev => ({
        ...prev,
        displayName: { valid: false, message: 'Display name must be at least 3 characters' }
      }));
      return;
    }
    
    setValidation(prev => ({
      ...prev,
      displayName: { valid: true, message: '' }
    }));
  }, [formData.displayName]);
  
  // Phone number validation
  useEffect(() => {
    // Skip validation if phone number is empty (optional field)
    if (!formData.phoneNumber) {
      setValidation(prev => ({
        ...prev,
        phoneNumber: { valid: true, message: '' }
      }));
      return;
    }
    
    const isValid = validateEthiopianPhoneNumber(formData.phoneNumber);
    
    setValidation(prev => ({
      ...prev,
      phoneNumber: { 
        valid: isValid, 
        message: isValid ? '' : 'Please enter a valid Ethiopian phone number (e.g., +251 9XX XXX XXX or 09XXXXXXXX)' 
      }
    }));
  }, [formData.phoneNumber]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear general error when user types
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Check email validation
      if (!validation.email.valid) {
        setError(validation.email.message || 'Please enter a valid email');
        return;
      }
      
      // Check password validation
      if (!validation.password.valid) {
        setError(validation.password.message || 'Please enter a valid password');
        return;
      }
      
      // Check confirm password validation
      if (!validation.confirmPassword.valid) {
        setError(validation.confirmPassword.message || 'Passwords must match');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Final validation check before submission
    if (!validation.email.valid) {
      setError(validation.email.message || 'Please enter a valid email');
      return;
    }
    
    if (!validation.password.valid) {
      setError(validation.password.message || 'Please enter a valid password');
      return;
    }
    
    if (!validation.displayName.valid) {
      setError(validation.displayName.message || 'Please enter a valid display name');
      return;
    }
    
    if (!validation.phoneNumber.valid) {
      setError(validation.phoneNumber.message || 'Please enter a valid phone number or leave it empty');
      return;
    }
    
    setLoading(true);
    
    try {      
      // Register the user
      const user = await registerUser(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phoneNumber || '', // Phone is optional in progressive registration
        formData.role
      );
      
      // Store the registered user for potential resend verification
      setRegisteredUser(user);
      
      // Show verification dialog
      setVerificationDialogOpen(true);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Provide user-friendly error messages and filter out technical errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please use another email or try logging in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Please choose a stronger password. It should be at least 6 characters.');
      } else if (err.message && err.message.includes('initializeWallet')) {
        // Don't show wallet initialization errors to the user if the account was created
        setError('Your account was created but we encountered an issue setting up your wallet. Please try logging in.');
      } else {
        setError('Registration failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialSignIn = async (provider) => {
    setError('');
    
    try {
      switch (provider) {
        case 'Google':
          await signInWithGoogle();
          break;
        default:
          throw new Error('Invalid provider');
      }
      
      // Navigate to home page after successful sign-in
      navigate('/');
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      setError(err.message || `Failed to sign in with ${provider}. Please try again.`);
    }
  };
  
  const handleResendVerification = async () => {
    if (!registeredUser) return;
    
    try {
      setLoading(true);
      await resendVerificationEmail(registeredUser);
      // Show success message
      setError('');
      alert('Verification email has been resent. Please check your inbox.');
    } catch (err) {
      console.error('Error resending verification email:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseVerificationDialog = () => {
    setVerificationDialogOpen(false);
    navigate('/login');
  };
  
  // Render step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!validation.email.message}
              helperText={
                validation.email.checking ? 
                  'Checking email availability...' : 
                  validation.email.message
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
                endAdornment: validation.email.valid && !validation.email.checking ? (
                  <InputAdornment position="end">
                    <CheckCircleIcon color="success" />
                  </InputAdornment>
                ) : (validation.email.message && !validation.email.checking) ? (
                  <InputAdornment position="end">
                    <ErrorIcon color="error" />
                  </InputAdornment>
                ) : null
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!validation.password.message}
              helperText={validation.password.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    {validation.password.valid && (
                      <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                    )}
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!validation.confirmPassword.message}
              helperText={validation.confirmPassword.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    {validation.confirmPassword.valid && (
                      <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                    )}
                  </InputAdornment>
                ),
              }}
            />
            {formData.password && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Password strength requirements:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                  <Typography 
                    variant="caption" 
                    color={formData.password.length >= 8 ? 'success.main' : 'text.secondary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {formData.password.length >= 8 ? 
                      <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
                      '•'} At least 8 characters
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={/[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {/[A-Z]/.test(formData.password) ? 
                      <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
                      '•'} At least one uppercase letter
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={/[a-z]/.test(formData.password) ? 'success.main' : 'text.secondary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {/[a-z]/.test(formData.password) ? 
                      <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
                      '•'} At least one lowercase letter
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={/[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {/[0-9]/.test(formData.password) ? 
                      <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
                      '•'} At least one number
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'success.main' : 'text.secondary'}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 
                      <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
                      '•'} At least one special character
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="Display Name"
              name="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleChange}
              error={!!validation.displayName.message}
              helperText={validation.displayName.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
                endAdornment: validation.displayName.valid ? (
                  <InputAdornment position="end">
                    <CheckCircleIcon color="success" />
                  </InputAdornment>
                ) : null
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="phoneNumber"
              label="Phone Number (Optional)"
              name="phoneNumber"
              autoComplete="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={!!validation.phoneNumber.message}
              helperText={validation.phoneNumber.message || 'Format: +251 9XX XXX XXX or 09XXXXXXXX'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
                endAdornment: formData.phoneNumber && validation.phoneNumber.valid ? (
                  <InputAdornment position="end">
                    <CheckCircleIcon color="success" />
                  </InputAdornment>
                ) : null
              }}
            />
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Account Type
              </Typography>
              <RadioGroup
                row
                aria-label="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <FormControlLabel value="buyer" control={<Radio />} label="Buyer" />
                <FormControlLabel value="seller" control={<Radio />} label="Seller" />
              </RadioGroup>
              <FormHelperText>
                You can change your account type later in your profile settings
              </FormHelperText>
            </FormControl>
          </>
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
            Create an Account
          </Typography>
          
          {/* Social Sign-in Options */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <Grid container justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleSocialSignIn('Google')}
                  sx={{ py: 1 }}
                >
                  Sign up with Google
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ width: '100%', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="button"
                  variant="contained"
                  disabled={loading || !validation.displayName.valid || !validation.phoneNumber.valid}
                  onClick={handleSubmit}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validation.email.valid || !validation.password.valid || !validation.confirmPassword.valid}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" align="center">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Email Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={handleCloseVerificationDialog}
        aria-labelledby="verification-dialog-title"
        aria-describedby="verification-dialog-description"
      >
        <DialogTitle id="verification-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <MarkEmailReadIcon color="primary" sx={{ mr: 1 }} />
          Verify Your Email
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="verification-dialog-description">
            We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and click the verification link to activate your account.
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Alert severity="info">
              You can still log in to your account, but some features may be limited until you verify your email.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResendVerification} disabled={loading}>
            {loading ? 'Sending...' : 'Resend Email'}
          </Button>
          <Button onClick={handleCloseVerificationDialog} variant="contained" autoFocus>
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
