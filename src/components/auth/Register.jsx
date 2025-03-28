import { useState } from 'react';
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
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Apple as AppleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  registerUser, 
  validateEthiopianPhoneNumber,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple
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
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear phone error when user types
    if (name === 'phoneNumber') {
      setPhoneError('');
    }
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
      if (!formData.email) {
        setError('Email is required');
        return;
      }
      if (!formData.password) {
        setError('Password is required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
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
    setLoading(true);
    
    try {
      // Validate phone number if provided
      if (formData.phoneNumber && !validateEthiopianPhoneNumber(formData.phoneNumber)) {
        setPhoneError('Please enter a valid Ethiopian phone number (e.g., +251 9XX XXX XXX or 09XXXXXXXX)');
        setLoading(false);
        return;
      }
      
      // Register the user
      await registerUser(
        formData.email,
        formData.password,
        formData.displayName || formData.email.split('@')[0], // Use part of email as display name if not provided
        formData.phoneNumber || '', // Phone is optional in progressive registration
        formData.role
      );
      
      // Navigate to home page after successful registration
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialSignIn = async (provider) => {
    setError('');
    setLoading(true);
    
    try {
      switch (provider) {
        case 'Google':
          await signInWithGoogle();
          break;
        case 'Facebook':
          await signInWithFacebook();
          break;
        case 'Apple':
          await signInWithApple();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Navigate to home page after successful sign-in
      navigate('/');
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      
      // Handle specific errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials.');
      } else {
        setError(`Failed to sign in with ${provider}. ${err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
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
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
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
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="displayName"
              label="Display Name (Optional)"
              name="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
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
              error={!!phoneError}
              helperText={phoneError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl component="fieldset" margin="normal">
              <Typography variant="subtitle2" gutterBottom>
                I want to:
              </Typography>
              <RadioGroup
                row
                aria-label="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <FormControlLabel value="buyer" control={<Radio />} label="Shop on Azone" />
                <FormControlLabel value="seller" control={<Radio />} label="Sell on Azone" />
              </RadioGroup>
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
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleSocialSignIn('Google')}
                  sx={{ py: 1 }}
                >
                  Google
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FacebookIcon />}
                  onClick={() => handleSocialSignIn('Facebook')}
                  sx={{ py: 1 }}
                >
                  Facebook
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AppleIcon />}
                  onClick={() => handleSocialSignIn('Apple')}
                  sx={{ py: 1 }}
                >
                  Apple
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
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Account'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleNext}
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
    </Container>
  );
};

export default Register;
