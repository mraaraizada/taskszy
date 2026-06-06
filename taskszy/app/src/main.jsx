import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Suppress all console output in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
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
