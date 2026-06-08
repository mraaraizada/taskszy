import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Temporarily DISABLE console suppression in production to debug payment page issue
// ⚠️ REMOVE THIS BEFORE FINAL DEPLOYMENT
if (import.meta.env.PROD) {
  // console.log = () => {};  // TEMPORARILY DISABLED for debugging
  // console.warn = () => {};  // TEMPORARILY DISABLED for debugging
  // console.error = () => {};  // TEMPORARILY DISABLED for debugging
  // console.info = () => {};  // TEMPORARILY DISABLED for debugging
  // console.debug = () => {};  // TEMPORARILY DISABLED for debugging
  console.log('[main.jsx] 🔥 PRODUCTION MODE - Console logs ENABLED for debugging');
}

// Suppress specific warnings in development
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress recharts warnings
    if (message.includes('width(-1) and height(-1) of chart')) return;
    // Suppress permissions policy warnings
    if (message.includes('Permissions policy violation')) return;
    if (message.includes('devicemotion events are blocked')) return;
    if (message.includes('deviceorientation events are blocked')) return;
    // Suppress mixed content warnings
    if (message.includes('Mixed Content')) return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress Razorpay header errors
    if (message.includes('Refused to get unsafe header')) return;
    // Suppress permissions policy errors
    if (message.includes('Permissions policy violation')) return;
  }
  originalError(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
