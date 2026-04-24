import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: 32, textAlign: 'center', fontFamily: 'var(--font-text)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16, maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button onClick={() => this.setState({ hasError: false, error: null })} style={{
            all: 'unset', cursor: 'pointer', padding: '8px 16px', borderRadius: 8,
            background: 'var(--accent)', color: 'var(--ink-on-accent)', fontSize: 13, fontWeight: 600,
          }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
