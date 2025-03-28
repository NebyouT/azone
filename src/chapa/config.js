// Chapa Payment Gateway Configuration
const CHAPA_CONFIG = {
  // Test credentials - replace with production credentials for live environment
  PUBLIC_KEY: 'CHAPUBK_TEST-WjhGXSwvYECQ6est1GcMbBxkJzZ378jj',
  SECRET_KEY: 'CHASECK_TEST-dtqf3YNyIqNH7hrExjwTf2g26XHDsdfO',
  ENCRYPTION_KEY: '9VlQoCLgY96HB05wNui6pK6y',
  
  // API endpoints
  BASE_URL: 'https://api.chapa.co',
  INITIALIZE_URL: '/v1/transaction/initialize',
  VERIFY_URL: '/v1/transaction/verify',
  
  // Callback URL (update this with your actual callback URL)
  CALLBACK_URL: 'http://localhost:3000/wallet/deposit/callback',
  
  // Currency (ETB for Ethiopian Birr)
  CURRENCY: 'ETB'
};

export default CHAPA_CONFIG;
