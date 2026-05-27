import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(err, info) {
    console.error('Component error caught:', err, info)
    try {
      localStorage.setItem('sb_last_error', JSON.stringify({
        message: err.message,
        stack: err.stack,
        componentStack: info?.componentStack
      }))
    } catch (e) {}
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          flex: 1, padding: 24, color: '#E85454', fontFamily: 'monospace',
          fontSize: 11, overflowY: 'auto', background: '#1A1A18', display: 'flex',
          flexDirection: 'column', gap: 10, justifyContent: 'center'
        }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--yellow)' }}>[!] RUNTIME CRASH</div>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6 }}>
            {this.state.error?.message}
          </div>
          <pre style={{ fontSize: 8, whiteSpace: 'pre-wrap', opacity: 0.8, lineHeight: 1.4 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

