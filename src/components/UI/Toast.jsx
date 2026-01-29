import { createContext, useContext, useState, useCallback } from 'react'
import './Toast.css'

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ type = 'info', title, message, action, duration = 5000 }) => {
    const id = Date.now()
    const toast = { id, type, title, message, action }

    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showError = useCallback((title, message, action) => {
    return addToast({ type: 'error', title, message, action, duration: 8000 })
  }, [addToast])

  const showSuccess = useCallback((title, message) => {
    return addToast({ type: 'success', title, message, duration: 4000 })
  }, [addToast])

  const showWarning = useCallback((title, message, action) => {
    return addToast({ type: 'warning', title, message, action, duration: 6000 })
  }, [addToast])

  const showInfo = useCallback((title, message) => {
    return addToast({ type: 'info', title, message, duration: 5000 })
  }, [addToast])

  // Fonction spécifique pour les erreurs de quota
  const showQuotaError = useCallback((detail) => {
    const messages = {
      csv: "Vous avez atteint votre limite de téléchargements CSV pour ce mois.",
      pdf: "Vous avez atteint votre limite d'extractions PDF pour ce mois."
    }

    return addToast({
      type: 'error',
      title: 'Quota dépassé',
      message: messages[detail?.type] || detail?.message || 'Quota mensuel dépassé',
      action: 'Contactez votre administrateur pour augmenter votre quota.',
      duration: 10000
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{
      addToast,
      removeToast,
      showError,
      showSuccess,
      showWarning,
      showInfo,
      showQuotaError
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

const Toast = ({ type, title, message, action, onClose }) => {
  const icons = {
    error: '!',
    success: '✓',
    warning: '⚠',
    info: 'i'
  }

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
        {action && <div className="toast-action">{action}</div>}
      </div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  )
}

export default Toast
