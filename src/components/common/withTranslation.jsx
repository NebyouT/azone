import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import TranslationWrapper from './TranslationWrapper';

/**
 * Higher-order component that wraps a component and ensures all its text content is translated
 * @param {React.ComponentType} Component - The component to wrap
 * @returns {React.ComponentType} - The wrapped component with translation support
 */
const withTranslation = (Component) => {
  // Return a new component
  const WithTranslation = (props) => {
    const { t } = useLanguage();
    
    // Function to recursively translate props
    const translateProps = (propsObj) => {
      if (!propsObj) return propsObj;
      
      const translatedProps = { ...propsObj };
      
      // Process each prop
      Object.keys(translatedProps).forEach(key => {
        const value = translatedProps[key];
        
        // Skip certain props that should not be translated
        if (key === 'style' || key === 'className' || key === 'id' || key === 'ref' || key === 'key') {
          return;
        }
        
        // If the value is a string, wrap it with TranslationWrapper
        if (typeof value === 'string') {
          // Try to find a matching translation key
          const possibleKey = Object.keys(t).find(k => 
            t[k] === value || k === value
          );
          
          if (possibleKey) {
            translatedProps[key] = (
              <TranslationWrapper 
                text={value} 
                translationKey={possibleKey} 
              />
            );
          }
        } 
        // If the value is an object (but not a React element), recursively translate its properties
        else if (
          typeof value === 'object' && 
          value !== null && 
          !React.isValidElement(value) &&
          !Array.isArray(value)
        ) {
          translatedProps[key] = translateProps(value);
        }
        // If the value is an array, process each item
        else if (Array.isArray(value)) {
          translatedProps[key] = value.map(item => {
            if (typeof item === 'string') {
              const possibleKey = Object.keys(t).find(k => 
                t[k] === item || k === item
              );
              
              if (possibleKey) {
                return (
                  <TranslationWrapper 
                    key={item} 
                    text={item} 
                    translationKey={possibleKey} 
                  />
                );
              }
              return item;
            }
            return item;
          });
        }
        // If the value is a React element, clone it and translate its props
        else if (React.isValidElement(value)) {
          translatedProps[key] = React.cloneElement(
            value,
            translateProps(value.props),
            value.props.children
          );
        }
      });
      
      return translatedProps;
    };
    
    // Translate all props and render the component
    const translatedProps = translateProps(props);
    return <Component {...translatedProps} />;
  };
  
  // Set display name for debugging
  WithTranslation.displayName = `withTranslation(${Component.displayName || Component.name || 'Component'})`;
  
  return WithTranslation;
};

export default withTranslation;
