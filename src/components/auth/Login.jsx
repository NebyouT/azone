import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  MarkEmailRead as MarkEmailReadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  loginUser, 
  signInWithGoogle, 
  resendVerificationEmail,
  reloadUser,
  isEmailVerified 
} from '../../firebase/services';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Check for verification success from URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const verified = queryParams.get('verified');
    
    if (verified === 'true') {
      setVerificationSuccess(true);
      // Remove the query parameter from the URL without reloading the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      const user = await loginUser(formData.email, formData.password, rememberMe);
      
      // Store the user for potential verification resend
      setCurrentUser(user);
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Show verification dialog if email is not verified
        setVerificationDialogOpen(true);
        setLoading(false);
        return;
      }
      
      // Navigate to home page after successful login
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        // Don't show technical Firebase errors to the user
        setError('Login failed. Please check your credentials and try again.');
      }
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
        default:
          throw new Error('Invalid provider');
      }
      
      // Navigate to home page after successful sign-in
      navigate('/');
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      setError(err.message || `Failed to sign in with ${provider}. Please try again.`);
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      await resendVerificationEmail(currentUser);
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
  
  const handleCheckVerification = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Reload user to get fresh data
      const updatedUser = await reloadUser(currentUser);
      setCurrentUser(updatedUser);
      
      if (updatedUser.emailVerified) {
        setVerificationDialogOpen(false);
        navigate('/');
      } else {
        alert('Your email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
      setError(err.message || 'Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseVerificationDialog = () => {
    setVerificationDialogOpen(false);
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to continue to DireMart
          </Typography>
          
          {verificationSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Your email has been verified successfully! You can now log in.
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
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
              autoComplete="current-password"
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
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    value="remember" 
                    color="primary" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label="Remember me"
              />
              
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" variant="body2">
                    Sign Up
                  </Link>
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Grid container justifyContent="center">
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleSocialSignIn('Google')}
                  disabled={loading}
                  sx={{ py: 1 }}
                >
                  Sign in with Google
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
      
      {/* Email Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={handleCloseVerificationDialog}
        aria-labelledby="verification-dialog-title"
        aria-describedby="verification-dialog-description"
      >
        <DialogTitle id="verification-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <MarkEmailReadIcon color="primary" sx={{ mr: 1 }} />
          Email Verification Required
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="verification-dialog-description">
            Your email address has not been verified yet. Please check your inbox for a verification email and click the link to verify your account.
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Alert severity="info">
              While you can continue using DireMart with limited functionality, some features may be restricted until you verify your email.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResendVerification} disabled={loading}>
            {loading ? 'Sending...' : 'Resend Email'}
          </Button>
          <Button onClick={handleCheckVerification} disabled={loading}>
            {loading ? 'Checking...' : 'I\'ve Verified My Email'}
          </Button>
          <Button onClick={handleCloseVerificationDialog} variant="contained" color="primary">
            Continue Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
