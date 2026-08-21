import { Component } from 'react'
import { Alert } from '../Alert/Alert'
import { Button } from '../Button/Button'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep the customer workspace visible even when an optional legacy field
    // or a related panel fails during render. The details remain available in
    // the browser console for diagnostics without exposing them to users.
    console.error('Customer detail render error', error, info)
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div style={{ padding: 24, width: '100%' }}>
        <Alert variant="danger" title="Mijoz detailini ochib bo‘lmadi">
          Mijoz ma’lumotlarining ayrim qismi yuklanmadi. Qayta yuklab ko‘ring.
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" onClick={this.handleReload}>Qayta yuklash</Button>
          </div>
        </Alert>
      </div>
    )
  }
}
