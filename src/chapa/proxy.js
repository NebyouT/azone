// This file sets up a proxy server to handle CORS issues with Chapa API
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const CHAPA_CONFIG = require('./config').default;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Proxy endpoint for Chapa initialize
app.post('/api/chapa/initialize', async (req, res) => {
  try {
    const response = await axios.post(
      `${CHAPA_CONFIG.BASE_URL}${CHAPA_CONFIG.INITIALIZE_URL}`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: 'failed',
      message: error.response?.data?.message || 'Failed to initialize payment'
    });
  }
});

// Proxy endpoint for Chapa verify
app.get('/api/chapa/verify/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;
    
    const response = await axios.get(
      `${CHAPA_CONFIG.BASE_URL}${CHAPA_CONFIG.VERIFY_URL}/${txRef}`,
      {
        headers: {
          'Authorization': `Bearer ${CHAPA_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      status: 'failed',
      message: error.response?.data?.message || 'Failed to verify transaction'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

module.exports = app;
