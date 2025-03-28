import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import CHAPA_CONFIG from '../../chapa/config';

/**
 * Chapa Payment Form Component
 * Renders a form that submits directly to Chapa's payment gateway
 */
const ChapaPaymentForm = ({ 
  amount, 
  email, 
  firstName, 
  lastName, 
  userId,
  onSuccess,
  onCancel
}) => {
  const formRef = useRef(null);
  const txRef = `azone-${userId.substring(0, 6)}-${uuidv4().substring(0, 8)}`;
  
  // Auto-submit the form when component mounts
  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);
  
  return (
    <form 
      ref={formRef}
      method="POST" 
      action="https://api.chapa.co/v1/hosted/pay"
      style={{ display: 'none' }} // Hide the form
    >
      <input type="hidden" name="public_key" value={CHAPA_CONFIG.PUBLIC_KEY} />
      <input type="hidden" name="tx_ref" value={txRef} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="currency" value={CHAPA_CONFIG.CURRENCY} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="first_name" value={firstName} />
      <input type="hidden" name="last_name" value={lastName} />
      <input type="hidden" name="title" value="Azone Wallet Deposit" />
      <input type="hidden" name="description" value={`Add ${amount} ${CHAPA_CONFIG.CURRENCY} to your Azone wallet`} />
      <input type="hidden" name="logo" value="https://chapa.link/asset/images/chapa_swirl.svg" />
      <input 
        type="hidden" 
        name="callback_url" 
        value={`${window.location.origin}/wallet/deposit/callback?userId=${userId}&txRef=${txRef}`} 
      />
      <input 
        type="hidden" 
        name="return_url" 
        value={`${window.location.origin}/wallet?txRef=${txRef}`} 
      />
      <input type="hidden" name="meta[userId]" value={userId} />
      <button type="submit">Pay Now</button>
    </form>
  );
};

ChapaPaymentForm.propTypes = {
  amount: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default ChapaPaymentForm;
