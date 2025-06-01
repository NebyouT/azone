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
 * @param {Object} props.values - Values to insert into placeholders in the translated text
 * @param {string} props.component - Component to render the translated text in (default: 'span')
 * @returns {React.ReactNode}
 */
const TranslationWrapper = ({ 
  text, 
  translationKey, 
  disableTranslation = false,
  isProductContent = false,
  children,
  values = {},
  component: Component = 'span',
  ...props 
}) => {
  const { t, language } = useLanguage();
  
  // If this is product content or translation is explicitly disabled, don't translate
  const shouldTranslate = !disableTranslation && !isProductContent;
  
  // Function to format text with placeholders
  const formatText = (content) => {
    if (!values || Object.keys(values).length === 0) return content;
    
    return Object.keys(values).reduce((result, key) => {
      const placeholder = `{${key}}`;
      return result.replace(new RegExp(placeholder, 'g'), values[key]);
    }, content);
  };
  
  // If text is provided, use it; otherwise render children
  if (text) {
    // If we have a translation key and should translate, use it
    if (translationKey && shouldTranslate) {
      const translatedText = formatText(t(translationKey));
      return <Component {...props}>{translatedText}</Component>;
    }
    // Otherwise just render the text directly
    return <Component {...props}>{formatText(text)}</Component>;
  }
  
  // If children are provided and they're a string, try to translate them
  if (children && typeof children === 'string' && shouldTranslate) {
    // Try to find a matching translation key
    const possibleKey = Object.keys(t).find(key => 
      t[key] === children
    );
    
    if (possibleKey) {
      return <Component {...props}>{formatText(t(possibleKey))}</Component>;
    }
    
    // If no key is found, just render the children
    return <Component {...props}>{formatText(children)}</Component>;
  }
  
  // If no text is provided, just render children
  return <>{children}</>;
};

export { TranslationWrapper };
export default TranslationWrapper;
