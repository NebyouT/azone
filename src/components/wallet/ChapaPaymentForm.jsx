import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CHAPA_CONFIG from '../../chapa/config';

/**
 * Chapa Payment Form Component
 * Renders a form that submits directly to Chapa's payment gateway
 */
const ChapaPaymentForm = ({ 
  formData,
  onSuccess,
  onCancel
}) => {
  const formRef = useRef(null);
  
  useEffect(() => {
    // Submit the form automatically when formData is provided
    if (formData && formRef.current) {
      console.log('Submitting Chapa payment form with data:', formData);
      
      // Add a small delay to ensure the form is rendered
      setTimeout(() => {
        formRef.current.submit();
      }, 500);
    }
  }, [formData]);
  
  if (!formData) {
    return null;
  }
  
  // Ensure callback URL has correct parameters
  const callbackUrl = formData.callback_url || window.location.origin + '/wallet';
  
  // Ensure the callback URL includes the protocol
  const fullCallbackUrl = callbackUrl.startsWith('http') 
    ? callbackUrl 
    : `${window.location.protocol}//${window.location.host}/wallet`;
  
  return (
    <form
      ref={formRef}
      method="POST"
      action={CHAPA_CONFIG.CHECKOUT_URL}
      style={{ display: 'none' }}
    >
      <input type="hidden" name="public_key" value={formData.public_key} />
      <input type="hidden" name="tx_ref" value={formData.tx_ref} />
      <input type="hidden" name="amount" value={formData.amount} />
      <input type="hidden" name="currency" value={formData.currency} />
      <input type="hidden" name="email" value={formData.email} />
      <input type="hidden" name="first_name" value={formData.first_name} />
      <input type="hidden" name="last_name" value={formData.last_name} />
      <input type="hidden" name="title" value="DireMart Wallet Deposit" />
      <input type="hidden" name="description" value={formData.description || "Wallet deposit"} />
      <input type="hidden" name="logo" value={formData.logo || ""} />
      <input type="hidden" name="callback_url" value={fullCallbackUrl} />
      <input type="hidden" name="return_url" value={fullCallbackUrl} />
      <input type="hidden" name="meta[title]" value="DireMart Wallet Deposit" />
    </form>
  );
};

ChapaPaymentForm.propTypes = {
  formData: PropTypes.shape({
    public_key: PropTypes.string.isRequired,
    tx_ref: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    currency: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    callback_url: PropTypes.string,
    return_url: PropTypes.string,
  }),
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ChapaPaymentForm;
