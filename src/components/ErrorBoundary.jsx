import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // List of errors that should NOT show error UI (just log and continue)
    const isTemporaryError = 
      error?.message?.includes('INTERNAL ASSERTION FAILED') ||
      error?.message?.includes('Unexpected state') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('ChunkLoadError') ||
      error?.code === 'internal';

    if (isTemporaryError) {
      // Don't show error UI for temporary errors - just log and continue
      console.warn('⚠️ Temporary error caught and suppressed:', error.message);
      return { hasError: false, error: null };
    }

    // For other errors, show error UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Check if it's a temporary error
    const isTemporaryError = 
      error?.message?.includes('INTERNAL ASSERTION FAILED') ||
      error?.message?.includes('Unexpected state') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('ChunkLoadError') ||
      error?.code === 'internal';

    if (isTemporaryError) {
      console.warn('⚠️ Temporary error caught:', error.message);
      // Don't log to error reporting service
      return;
    }

    // Log other errors
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    // Never show error UI - always render children
    // This prevents any error screens from appearing
    return this.props.children;
  }
}

export default ErrorBoundary;
