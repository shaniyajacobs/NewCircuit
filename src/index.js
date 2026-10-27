import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { getValue, fetchAndActivate } from 'firebase/remote-config';
import { remoteConfig } from './firebaseConfig';

// Configure Remote Config settings
remoteConfig.settings = {
  minimumFetchIntervalMillis: 60000, // 1 minute
  fetchTimeoutMillis: 60000, // 1 minute
};

async function initMetaPixel() {
  try {
    // Get Pixel ID from Firebase Remote Config
    await fetchAndActivate(remoteConfig);
    const pixelIdValue = getValue(remoteConfig, 'fb_pixel_id');
    const pixelId = pixelIdValue.asString();
    
    if (!pixelId) {
      console.error('Meta Pixel ID not found in Remote Config');
      return;
    }
    
    console.log('Meta Pixel ID loaded from Remote Config:', pixelId);

    if (!window.fbq) {
      (function(f,b,e,v,n,t,s){
        if(f.fbq) return; n=f.fbq=function(){ n.callMethod ?
          n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
        if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
        n.queue=[]; t=b.createElement(e); t.async=!0;
        t.src=v; s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  } catch (e) {
    console.error('Meta Pixel initialization failed:', e);
  }
}

initMetaPixel();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
