import React, { useEffect } from 'react';

const SEOHelmet = ({ 
  title = 'Portofolio', 
  description = 'Welcome to my portofolio website.', 
  image = '', 
  url = window.location.href 
}) => {
  useEffect(() => {
    // Set Title
    document.title = title;

    // Helper to set or update meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', description);
    
    // Open Graph / Facebook
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    if (image) setMetaTag('property', 'og:image', image);

    // Twitter
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:url', url);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (image) setMetaTag('name', 'twitter:image', image);

    // Cleanup function is not strictly necessary here because we want the tags to persist 
    // until another SEOHelmet overrides them, but to be clean, we could restore defaults.
    // However, in an SPA, having the last active route's meta tags remain is standard behavior.
    
  }, [title, description, image, url]);

  // Render nothing, it's just a side-effect component
  return null;
};

export default SEOHelmet;
