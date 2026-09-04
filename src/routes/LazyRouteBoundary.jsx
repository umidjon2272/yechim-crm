import { Component } from 'react'
import { Button } from '../components/Button/Button'

function isChunkLoadError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return error?.name === 'ChunkLoadError'
    || message.includes('loading chunk')
    || message.includes('dynamically imported module')
    || message.includes('failed to fetch')
}

export class LazyRouteBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('[YECHIM route] lazy chunk failed', error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const chunkError = isChunkLoadError(this.state.error)
    return (
      <div className="route-recovery" role="alert">
        <div className="startup-state__card">
          <strong>{chunkError ? 'Yangi versiya mavjud' : 'Sahifani ochib bo\'lmadi'}</strong>
          <p>{chunkError ? 'Ilova yangilandi. Davom etish uchun sahifani qayta yuklang.' : 'Sahifa vaqtincha yuklanmadi.'}</p>
          <Button variant="secondary" onClick={this.handleReload}>Qayta yuklash</Button>
        </div>
      </div>
    )
  }
}
