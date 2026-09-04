import { Component } from 'react'
import { Button } from './Button/Button'

export class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[YECHIM app] uncaught render error', error, info)
  }

  handleReload = () => window.location.reload()

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="full-page-loading startup-state">
        <div className="startup-state__card" role="alert">
          <strong>Ilovani ochib bo\'lmadi</strong>
          <p>Ilova vaqtincha yuklanmadi. Qayta yuklab ko\'ring.</p>
          <Button variant="secondary" onClick={this.handleReload}>Qayta yuklash</Button>
        </div>
      </div>
    )
  }
}
