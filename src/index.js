import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Dark mode initialization script to prevent flickering
(function() {
  try {
    // Get the saved theme from localStorage
    const darkMode = localStorage.getItem('darkMode');
    
    // If a saved preference exists and it's dark mode, apply dark mode immediately
    if (darkMode === 'true') {
      document.documentElement.classList.add('dark');
    } else if (darkMode === null) {
      // If no saved preference, check system preference
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  } catch (e) {
    console.error('Error in early dark mode initialization:', e);
  }
})();

// Create root for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
