import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
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
  
  // Auto-submit the form when component mounts
  useEffect(() => {
    if (formRef.current) {
      console.log('Submitting payment form with amount:', formData.amount);
      formRef.current.submit();
    }
  }, [formData]);
  
  return (
    <form 
      ref={formRef}
      method="POST" 
      action="https://api.chapa.co/v1/hosted/pay"
      style={{ display: 'none' }} // Hide the form
    >
      <input type="hidden" name="public_key" value={CHAPA_CONFIG.PUBLIC_KEY} />
      <input type="hidden" name="tx_ref" value={formData.txRef} />
      <input type="hidden" name="amount" value={formData.amount} />
      <input type="hidden" name="currency" value={formData.currency || CHAPA_CONFIG.CURRENCY} />
      <input type="hidden" name="email" value={formData.email} />
      <input type="hidden" name="first_name" value={formData.firstName} />
      <input type="hidden" name="last_name" value={formData.lastName} />
      <input type="hidden" name="title" value={formData.title || "Azone Wallet Deposit"} />
      <input type="hidden" name="description" value={formData.description || `Add ${formData.amount} ${CHAPA_CONFIG.CURRENCY} to your Azone wallet`} />
      <input type="hidden" name="logo" value={formData.logo || "https://chapa.link/asset/images/chapa_swirl.svg"} />
      <input 
        type="hidden" 
        name="callback_url" 
        value={formData.callback_url || `${window.location.origin}/wallet/callback`} 
      />
      <input 
        type="hidden" 
        name="return_url" 
        value={formData.return_url || `${window.location.origin}/wallet?tx_ref=${formData.txRef}&status=success`} 
      />
      <button type="submit" style={{ display: 'none' }}>Pay</button>
    </form>
  );
};

ChapaPaymentForm.propTypes = {
  formData: PropTypes.shape({
    txRef: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    currency: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    logo: PropTypes.string,
    callback_url: PropTypes.string,
    return_url: PropTypes.string
  }).isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default ChapaPaymentForm;
