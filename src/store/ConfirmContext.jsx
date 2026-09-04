import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setRequest({ options, resolve })
      }),
    []
  )

  const handleClose = (result) => {
    request?.resolve(result)
    setRequest(null)
  }

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={!!request}
        title={request?.options?.title}
        description={request?.options?.description}
        confirmLabel={request?.options?.confirmLabel}
        cancelLabel={request?.options?.cancelLabel}
        danger={request?.options?.danger}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
