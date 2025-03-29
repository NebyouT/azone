import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * TranslationWrapper component that conditionally translates content
 * @param {Object} props
 * @param {string} props.text - The text to potentially translate
 * @param {string} props.translationKey - The key to use for translation lookup
 * @param {boolean} props.disableTranslation - Flag to disable translation for this content
 * @param {boolean} props.isProductContent - Flag to indicate if this is product content (which should not be translated)
 * @param {React.ReactNode} props.children - Children to render if no text is provided
 * @returns {React.ReactNode}
 */
const TranslationWrapper = ({ 
  text, 
  translationKey, 
  disableTranslation = false,
  isProductContent = false,
  children,
  ...props 
}) => {
  const { t, language } = useLanguage();
  
  // If this is product content or translation is explicitly disabled, don't translate
  const shouldTranslate = !disableTranslation && !isProductContent;
  
  // If text is provided, use it; otherwise render children
  if (text) {
    // If we have a translation key and should translate, use it
    if (translationKey && shouldTranslate) {
      return <span {...props}>{t(translationKey)}</span>;
    }
    // Otherwise just render the text directly
    return <span {...props}>{text}</span>;
  }
  
  // If no text is provided, just render children
  return <>{children}</>;
};

export default TranslationWrapper;
