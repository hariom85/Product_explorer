import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Add global styles
const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  .slick-dots {
    bottom: 25px !important;
  }
  
  .slick-dots li button:before {
    color: white !important;
    font-size: 12px !important;
  }
  
  .slick-dots li.slick-active button:before {
    color: white !important;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
