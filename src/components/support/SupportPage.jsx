import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Help as HelpIcon,
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { getAllFAQs, getFAQCategories, setupInitialFAQs } from '../../firebase/faqServices';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SupportPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const { messages, sendMessage, loading: chatLoading } = useChat();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  
  // Fetch FAQs and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Setup initial FAQs if none exist
        await setupInitialFAQs();
        
        // Fetch categories
        const categoriesData = await getFAQCategories();
        setCategories(categoriesData);
        
        // Fetch all FAQs
        const faqsData = await getAllFAQs();
        setFaqs(faqsData);
        setFilteredFaqs(faqsData);
        
      } catch (err) {
        console.error('Error fetching support data:', err);
        setError('Failed to load support information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter FAQs based on search query and selected category
  useEffect(() => {
    if (faqs.length === 0) return;
    
    let filtered = [...faqs];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    
    setFilteredFaqs(filtered);
  }, [searchQuery, selectedCategory, faqs]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle category selection
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };
  
  // Handle chat message
  const handleChatMessageChange = (event) => {
    setChatMessage(event.target.value);
  };
  
  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    
    sendMessage(chatMessage);
    setChatMessage('');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customer Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get help with your DireMart shopping experience
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '0.9rem',
            }
          }}
        >
          <Tab 
            icon={<HelpIcon />} 
            label="FAQs" 
            iconPosition="start" 
          />
          <Tab 
            icon={<QuestionAnswerIcon />} 
            label="Live Support" 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Search and Categories */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 0 }
                }}
                sx={{ mb: 3 }}
              />
              
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => handleCategoryChange(category.id)}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 0
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          {/* FAQ List */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Frequently Asked Questions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
                </Typography>
              </Box>
              
              {filteredFaqs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No FAQs found matching your search criteria.
                  </Typography>
                  <Button 
                    variant="text" 
                    color="primary"
                    onClick={handleClearSearch}
                    sx={{ mt: 2 }}
                  >
                    Clear Search
                  </Button>
                </Box>
              ) : (
                <Box>
                  {filteredFaqs.map((faq) => (
                    <Accordion key={faq.id} elevation={0} sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`faq-${faq.id}-content`}
                        id={`faq-${faq.id}-header`}
                        sx={{ 
                          borderLeft: `3px solid ${theme.palette.primary.main}`,
                          '&.Mui-expanded': {
                            borderLeft: `3px solid ${theme.palette.primary.dark}`,
                          }
                        }}
                      >
                        <Typography variant="subtitle1">{faq.question}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1">{faq.answer}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <SupportAgentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Customer Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our support team is here to help you with any questions or issues you may have.
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Email:</strong> support@DireMart.com
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Phone:</strong> +251 911 234 567
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Hours:</strong> 24/7 Support
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Support Tips
              </Typography>
              <Typography variant="body2" paragraph>
                • Check our FAQs first for quick answers
              </Typography>
              <Typography variant="body2" paragraph>
                • Be specific about your issue
              </Typography>
              <Typography variant="body2" paragraph>
                • Include order numbers when applicable
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Live Chat
              </Typography>
              
              {!currentUser ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" gutterBottom>
                    Please log in to use the live chat support.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    href="/login"
                    sx={{ mt: 2, borderRadius: 0 }}
                  >
                    Log In
                  </Button>
                </Box>
              ) : (
                <>
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      mb: 2, 
                      overflowY: 'auto',
                      height: '400px', 
                      p: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 0,
                    }}
                  >
                    {messages.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 10 }}>
                        <QuestionAnswerIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="body1" gutterBottom>
                          No messages yet.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start a conversation with our support team.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {messages.map((message) => (
                          <Box
                            key={message.id}
                            sx={{
                              alignSelf: message.isFromUser ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                            }}
                          >
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                backgroundColor: message.isFromUser
                                  ? theme.palette.primary.main
                                  : theme.palette.mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : 'rgba(0, 0, 0, 0.05)',
                                color: message.isFromUser ? 'white' : 'inherit',
                                borderRadius: 0,
                              }}
                            >
                              <Typography variant="body1">{message.content}</Typography>
                            </Paper>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5, textAlign: message.isFromUser ? 'right' : 'left' }}
                            >
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box component="form" onSubmit={handleSendMessage}>
                    <Grid container spacing={1}>
                      <Grid item xs>
                        <TextField
                          fullWidth
                          placeholder="Type your message..."
                          value={chatMessage}
                          onChange={handleChatMessageChange}
                          variant="outlined"
                          disabled={chatLoading}
                          InputProps={{
                            sx: { borderRadius: 0 }
                          }}
                        />
                      </Grid>
                      <Grid item>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={chatLoading || !chatMessage.trim()}
                          sx={{ height: '100%', borderRadius: 0 }}
                        >
                          {chatLoading ? <CircularProgress size={24} /> : <SendIcon />}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default SupportPage;
