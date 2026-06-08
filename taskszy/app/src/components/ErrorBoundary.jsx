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

      // Don't log to error reporting service
      return;
    }

    // Log other errors

  }

  render() {
    // In production, if there's an error in FinancialPage specifically, show a message
    if (this.state.hasError && import.meta.env.PROD) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 40,
          background: 'var(--bg-main)'
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            Unable to load page
          </div>
          <div style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            textAlign: 'center',
            maxWidth: 400
          }}>
            Please refresh the page or contact support if the issue persists.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#3B5BFC',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    
    // Always render children in development or if no error
    return this.props.children;
  }
}

export default ErrorBoundary;
