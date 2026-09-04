import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { ToastViewport } from '../components/Toast/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, { variant = 'info', title, duration = 4000 } = {}) => {
      const id = ++idRef.current
      setToasts((current) => [...current, { id, message, variant, title }])
      if (duration) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, opts) => show(message, { ...opts, variant: 'success' }),
      error: (message, opts) => show(message, { ...opts, variant: 'danger' }),
      info: (message, opts) => show(message, { ...opts, variant: 'info' }),
    }),
    [show, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
