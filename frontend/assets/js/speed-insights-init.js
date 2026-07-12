/**
 * Vercel Speed Insights Initialization
 * 
 * This script initializes Vercel Speed Insights by loading it from the CDN.
 * Speed Insights automatically tracks Core Web Vitals when deployed on Vercel.
 */

(function() {
  // Initialize the Speed Insights queue
  if (window.si) return;
  
  window.si = function() {
    (window.siq = window.siq || []).push(arguments);
  };

  // Determine the script source based on environment
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  const scriptSrc = isDevelopment
    ? 'https://va.vercel-scripts.com/v1/speed-insights/script.debug.js'
    : '/_vercel/speed-insights/script.js';

  // Check if script is already loaded
  if (document.head.querySelector(`script[src*="speed-insights"]`)) {
    return;
  }

  // Create and inject the Speed Insights script
  const script = document.createElement('script');
  script.src = scriptSrc;
  script.defer = true;
  script.dataset.sdkn = '@vercel/speed-insights';
  script.dataset.sdkv = '1.3.1';
  
  script.onerror = function() {
    console.warn(
      '[Vercel Speed Insights] Failed to load script from ' + scriptSrc + 
      '. This is expected in local development. Speed Insights will work when deployed to Vercel.'
    );
  };
  
  document.head.appendChild(script);
})();
