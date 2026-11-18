import React, { useEffect } from 'react';

export interface SEOHelmetProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  [key: string]: any;
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({ 
  title = 'sumr.day | Creative Digital Studio', 
  description = 'A little sunshine for your screen — Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic.', 
  image = '', 
  url = typeof window !== 'undefined' ? window.location.href : 'https://sumrday.web.app/',
  keywords = '',
  type = 'website',
  noindex = false,
}) => {
  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title;
    }

    // Helper to set or update meta tag
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or update link tag (canonical)
    const setLinkTag = (rel: string, href: string) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Canonical URL
    const activeUrl = url || window.location.href;
    setLinkTag('canonical', activeUrl);

    // 3. Robots indexing
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 4. Standard Meta Tags
    setMetaTag('name', 'description', description);
    if (keywords) setMetaTag('name', 'keywords', keywords);
    
    // 5. Open Graph / Facebook
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', activeUrl);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:site_name', 'sumr.day');
    setMetaTag('property', 'og:locale', 'id_ID');
    if (image) {
      setMetaTag('property', 'og:image', image);
    }

    // 6. Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:url', activeUrl);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (image) {
      setMetaTag('name', 'twitter:image', image);
    }

    // 7. Dynamic JSON-LD WebPage schema for search bots
    const schemaId = 'dynamic-seo-schema';
    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const pageSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'Article' : 'WebPage',
      'name': title,
      'description': description,
      'url': activeUrl,
      ...(image ? { 'image': image } : {}),
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'sumr.day',
        'url': 'https://sumrday.web.app/'
      }
    };

    scriptEl.textContent = JSON.stringify(pageSchema);

  }, [title, description, image, url, type, noindex]);

  return null;
};

export default SEOHelmet;
