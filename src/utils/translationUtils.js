/**
 * Utility functions for handling translations throughout the application
 */

import { TranslationWrapper } from '../components/common/TranslationWrapper';

/**
 * Wraps text with TranslationWrapper component for consistent translation
 * @param {string} text - The text to be translated
 * @param {string} key - The translation key
 * @param {object} options - Additional options
 * @returns {JSX.Element} - The wrapped text component
 */
export const translate = (text, key, options = {}) => {
  return TranslationWrapper({
    text,
    translationKey: key,
    ...options
  });
};

/**
 * Checks if a component is already wrapped with TranslationWrapper
 * @param {React.ReactNode} component - The component to check
 * @returns {boolean} - Whether the component is already wrapped
 */
export const isTranslationWrapped = (component) => {
  return component && 
    typeof component === 'object' && 
    component.type === TranslationWrapper;
};

/**
 * Ensures all text in an object is wrapped with TranslationWrapper
 * @param {object} obj - The object containing text to translate
 * @returns {object} - The object with translated text
 */
export const translateObject = (obj) => {
  if (!obj) return obj;
  
  const result = { ...obj };
  
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'string') {
      result[key] = translate(result[key], key);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = translateObject(result[key]);
    }
  });
  
  return result;
};

/**
 * Formats a string with placeholders for translation
 * @param {string} text - The text template with {placeholders}
 * @param {object} values - The values to insert into placeholders
 * @returns {string} - The formatted string
 */
export const formatTranslation = (text, values) => {
  if (!text) return '';
  if (!values) return text;
  
  return Object.keys(values).reduce((result, key) => {
    const placeholder = `{${key}}`;
    return result.replace(new RegExp(placeholder, 'g'), values[key]);
  }, text);
};
