// ikootaclient/src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h1 style={{ 
              color: '#e74c3c', 
              fontSize: '2rem', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              ⚠️ Something went wrong
            </h1>
            
            <p style={{ 
              color: '#666', 
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              We encountered an unexpected error. This usually resolves itself when you refresh the page.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh Page
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  background: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                🏠 Go Home
              </button>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
              <details style={{ 
                marginTop: '30px', 
                textAlign: 'left',
                background: '#f8f8f8',
                padding: '15px',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                  🐛 Error Details (Development Only)
                </summary>
                <pre style={{ 
                  whiteSpace: 'pre-wrap',
                  color: '#e74c3c',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;